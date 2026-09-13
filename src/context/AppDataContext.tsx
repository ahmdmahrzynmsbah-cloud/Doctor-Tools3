import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect, useCallback, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Ensure no stale quota lockout key is present
try {
  localStorage.removeItem('firestore_quota_exhausted_until');
} catch {}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errStr = error instanceof Error ? error.message : String(error);
  console.warn(`[Firestore ${operationType} on ${path}]`, errStr);
}

// Background Firestore writer with instantaneous local reactivity
function safeFirestoreOperation(operation: () => Promise<void>, path: string, opType: OperationType = OperationType.WRITE) {
  operation().catch(err => {
    handleFirestoreError(err, opType, path);
  });
}

const loadStorage = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      return fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
};

const toSafeArray = <ItemType,>(data: any): ItemType[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const vals = Object.values(data).filter(v => v && typeof v === 'object');
    if (vals.length > 0) return vals as ItemType[];
    return [data as ItemType];
  }
  return [];
};

// Data item validators for intelligent recovery
const isInventoryItem = (item: any): boolean => {
  return Boolean(
    item &&
    typeof item === 'object' &&
    typeof item.name === 'string' &&
    item.name.trim().length > 0 &&
    ('purchasePrice' in item || 'sellPrice' in item || 'code' in item || 'quantity' in item || 'compatibleCars' in item || 'category' in item)
  );
};

const isCustomer = (item: any): boolean => {
  return Boolean(
    item &&
    typeof item === 'object' &&
    typeof item.name === 'string' &&
    item.name.trim().length > 0 &&
    ('balance' in item || 'serialNumber' in item || 'phone' in item) &&
    !('code' in item) &&
    !('purchasePrice' in item)
  );
};

const isSupplier = (item: any): boolean => {
  return Boolean(
    item &&
    typeof item === 'object' &&
    typeof item.name === 'string' &&
    item.name.trim().length > 0 &&
    'balance' in item &&
    !('serialNumber' in item) &&
    !('code' in item) &&
    !('purchasePrice' in item)
  );
};

const isInvoice = (item: any): boolean => {
  return Boolean(
    item &&
    typeof item === 'object' &&
    ('invoiceNumber' in item || ('customerId' in item && Array.isArray(item.items) && 'total' in item))
  );
};

const isPurchase = (item: any): boolean => {
  return Boolean(
    item &&
    typeof item === 'object' &&
    'supplierId' in item &&
    Array.isArray(item.items) &&
    'total' in item
  );
};

const isProfile = (item: any): boolean => {
  return Boolean(
    item &&
    typeof item === 'object' &&
    typeof item.name === 'string' &&
    item.name.trim().length > 0 &&
    ('phone' in item || 'address' in item || 'logo' in item)
  );
};

function extractValidCandidates<T>(parsed: any, validator: (item: any) => boolean, expectArray: boolean): T | null {
  if (parsed === null || parsed === undefined) return null;

  if (expectArray) {
    if (Array.isArray(parsed)) {
      const valid = parsed.filter(validator);
      if (valid.length > 0) return valid as unknown as T;
    } else if (typeof parsed === 'object') {
      const values = Object.values(parsed);
      const valid = values.filter(validator);
      if (valid.length > 0) return valid as unknown as T;
      if (validator(parsed)) {
        return [parsed] as unknown as T;
      }
    }
    return null;
  } else {
    if (!Array.isArray(parsed) && typeof parsed === 'object' && validator(parsed)) {
      return parsed as T;
    }
    return null;
  }
}

// Deep scanner across primary keys, backup keys, legacy keys, and entire browser storage
function scanStorageForItems<T>(
  preferredKey: string,
  legacyKeys: string[],
  validator: (item: any) => boolean,
  fallback: T
): T {
  const expectArray = Array.isArray(fallback);

  const checkValue = (raw: string | null): T | null => {
    if (!raw || raw.length < 2) return null;
    try {
      const parsed = JSON.parse(raw);
      return extractValidCandidates<T>(parsed, validator, expectArray);
    } catch {
      return null;
    }
  };

  try {
    // 1. Try preferred key
    const primary = checkValue(localStorage.getItem(preferredKey));
    if (primary) return primary;

    // 2. Try designated backup key
    const backupKey = `${preferredKey}_backup`;
    const backup = checkValue(localStorage.getItem(backupKey));
    if (backup) {
      console.log(`[Data Recovery] Restored data from backup key: ${backupKey}`);
      return backup;
    }

    // 3. Try known legacy keys
    for (const lk of legacyKeys) {
      const leg = checkValue(localStorage.getItem(lk));
      if (leg) {
        console.log(`[Data Recovery] Restored data from legacy key: ${lk}`);
        return leg;
      }
    }

    // 4. Scan all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || k === preferredKey || legacyKeys.includes(k) || k === backupKey) continue;
      if (k.startsWith('firebase:') || k.startsWith('_') || k === 'theme') continue;
      const found = checkValue(localStorage.getItem(k));
      if (found) {
        console.log(`[Data Recovery] Discovered data in storage key: ${k}`);
        return found;
      }
    }

    // 5. Scan sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (!k || k.startsWith('firebase:') || k.startsWith('_')) continue;
      const found = checkValue(sessionStorage.getItem(k));
      if (found) {
        console.log(`[Data Recovery] Discovered data in sessionStorage key: ${k}`);
        return found;
      }
    }
  } catch (e) {
    console.warn('Deep storage scanner warning:', e);
  }
  return fallback;
}

const saveStorageDebounced = (() => {
  const timers: Record<string, ReturnType<typeof setTimeout>> = {};
  return <T,>(key: string, data: T, delay = 200) => {
    if (timers[key]) clearTimeout(timers[key]);
    timers[key] = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
        // Keep a secondary permanent backup key
        if (Array.isArray(data) && data.length > 0) {
          localStorage.setItem(`${key}_backup`, JSON.stringify(data));
        } else if (!Array.isArray(data) && data) {
          localStorage.setItem(`${key}_backup`, JSON.stringify(data));
        }
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }
    }, delay);
  };
})();

export type InventoryItem = {
  id: string;
  code: string;
  name: string;
  brand: string;
  compatibleCars: string;
  category: string;
  storageLocation: string;
  quantity: number;
  purchasePrice: number;
  sellPrice: number;
  createdAt?: number;
  updatedAt?: number;
};

export type Customer = {
  id: string;
  serialNumber: string;
  name: string;
  phone: string;
  balance: number;
  createdAt?: number;
  updatedAt?: number;
};

export type Supplier = {
  id: string;
  name: string;
  phone: string;
  balance: number;
  createdAt?: number;
  updatedAt?: number;
};

export type TransactionItem = {
  itemId: string;
  quantity: number;
  price: number;
  name?: string;
  itemName?: string;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId: string;
  items: TransactionItem[];
  total: number;
  paid: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  createdAt?: number;
  updatedAt?: number;
  isQuote?: boolean;
  customCustomerName?: string;
};

export type PurchaseOrder = {
  id: string;
  date: string;
  supplierId: string;
  items: TransactionItem[];
  total: number;
  paid: number;
  createdAt?: number;
  updatedAt?: number;
};

export type AppNotification = {
  id: string;
  message: string;
  date: string;
  read: boolean;
  createdAt?: number;
  updatedAt?: number;
};

export type BusinessProfile = {
  name: string;
  phone: string;
  address: string;
  description?: string;
  logo: string | null;
  createdAt?: number;
  updatedAt?: number;
};

type Category = {
  id: string;
  name: string;
};

const inventoryLegacyKeys = ['doctor_tools_inventory', 'doctor_tools_inventory_backup', 'autoserv_inventory', 'pos_inventory', 'inventory', 'items', 'products', 'inventory_backup', 'store_inventory'];
const customersLegacyKeys = ['doctor_tools_customers', 'doctor_tools_customers_backup', 'autoserv_customers', 'pos_customers', 'customers', 'clients', 'customers_backup'];
const suppliersLegacyKeys = ['doctor_tools_suppliers', 'doctor_tools_suppliers_backup', 'autoserv_suppliers', 'pos_suppliers', 'suppliers', 'vendors', 'suppliers_backup'];
const invoicesLegacyKeys = ['doctor_tools_invoices', 'doctor_tools_invoices_backup', 'autoserv_invoices', 'pos_invoices', 'invoices', 'sales', 'orders', 'invoices_backup'];
const purchasesLegacyKeys = ['doctor_tools_purchases', 'doctor_tools_purchases_backup', 'autoserv_purchases', 'pos_purchases', 'purchases', 'purchases_backup'];
const categoriesLegacyKeys = ['doctor_tools_categories', 'autoserv_categories', 'pos_categories', 'categories'];
const profileLegacyKeys = ['doctor_tools_profile', 'autoserv_profile', 'pos_profile', 'businessProfile', 'profile'];

type AppDataContextType = {
  inventory: InventoryItem[];
  categories: string[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  purchases: PurchaseOrder[];
  notifications: AppNotification[];
  businessProfile: BusinessProfile;
  syncStatus: 'synced' | 'syncing' | 'error';
  isLiveSyncActive: boolean;
  lastSyncTime: Date | null;
  syncNow: () => Promise<void>;
  
  exportDataBackup: () => string;
  importDataBackup: (jsonString: string) => Promise<{ success: boolean; message: string }>;
  scanAndRecoverBrowserData: () => { recoveredItems: number; recoveredCustomers: number; recoveredSuppliers: number; recoveredInvoices: number; recoveredPurchases: number; message: string };
  recoveryNotice: string | null;
  dismissRecoveryNotice: () => void;

  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => Promise<string>;
  updateInventoryItem: (id: string, item: Omit<InventoryItem, 'id'>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  
  addCategory: (category: string) => Promise<void>;
  removeCategory: (category: string) => Promise<void>;
  
  addCustomer: (customer: Omit<Customer, 'id' | 'serialNumber'>) => Promise<string>;
  updateCustomer: (id: string, customer: Omit<Customer, 'id' | 'serialNumber'>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (id: string, supplier: Omit<Supplier, 'id'>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  
  createInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => Promise<void>;
  updateInvoice: (id: string, invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  
  createPurchase: (purchase: Omit<PurchaseOrder, 'id'>) => Promise<void>;
  recordCustomerPayment: (customerId: string, amount: number, paymentDate?: string) => Promise<void>;
  recordSupplierPayment: (supplierId: string, amount: number, paymentDate?: string) => Promise<void>;
  
  markAllNotificationsRead: () => Promise<void>;
  updateBusinessProfile: (profile: BusinessProfile) => Promise<void>;
};

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const uid = 'main_store';
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);
  const initialSyncExecuted = useRef(false);

  const dismissRecoveryNotice = useCallback(() => setRecoveryNotice(null), []);

  const [categories, setCategories] = useState<string[]>(() => {
    const raw = scanStorageForItems('doctor_tools_categories', categoriesLegacyKeys, (item) => typeof item === 'string', ["فلاتر", "فرامل", "كهرباء", "زيوت", "إطارات", "عادم", "تعليق", "أخرى"]);
    return Array.isArray(raw) ? raw : ["فلاتر", "فرامل", "كهرباء", "زيوت", "إطارات", "عادم", "تعليق", "أخرى"];
  });
  
  const [categoriesDocs, setCategoriesDocs] = useState<Category[]>(() => {
    const raw = scanStorageForItems<Category[]>('doctor_tools_categories_docs', ['autoserv_categories_docs'], (item) => Boolean(item && item.name), []);
    return toSafeArray<Category>(raw);
  });
  
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const raw = scanStorageForItems<InventoryItem[]>('doctor_tools_inventory', inventoryLegacyKeys, isInventoryItem, []);
    const list = toSafeArray<InventoryItem>(raw);
    return [...list].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  });
  
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const raw = scanStorageForItems<Customer[]>('doctor_tools_customers', customersLegacyKeys, isCustomer, []);
    const list = toSafeArray<Customer>(raw);
    return [...list].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  });
  
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const raw = scanStorageForItems<Supplier[]>('doctor_tools_suppliers', suppliersLegacyKeys, isSupplier, []);
    const list = toSafeArray<Supplier>(raw);
    return [...list].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  });
  
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const raw = scanStorageForItems<Invoice[]>('doctor_tools_invoices', invoicesLegacyKeys, isInvoice, []);
    const list = toSafeArray<Invoice>(raw);
    return [...list].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  });
  
  const [purchases, setPurchases] = useState<PurchaseOrder[]>(() => {
    const raw = scanStorageForItems<PurchaseOrder[]>('doctor_tools_purchases', purchasesLegacyKeys, isPurchase, []);
    const list = toSafeArray<PurchaseOrder>(raw);
    return [...list].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  });
  
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const raw = loadStorage<AppNotification[]>('doctor_tools_notifications', []);
    return toSafeArray<AppNotification>(raw);
  });
  
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(() => {
    const stored = scanStorageForItems<BusinessProfile>('doctor_tools_profile', profileLegacyKeys, isProfile, {
      name: 'Doctor Tools',
      phone: '',
      address: 'القاهرة، مصر',
      description: 'نظام إدارة العيادات والمستلزمات الطبية المتكامل',
      logo: '/logo.png'
    });
    // Remove hardcoded placeholder phone if user hasn't set their own
    if (stored.phone === '01000000000') {
      stored.phone = '';
    }
    if (!stored.logo) {
      stored.logo = '/logo.png';
    }
    return stored;
  });

  // Track latest state references to avoid stale snapshot closures
  const inventoryRef = useRef<InventoryItem[]>(inventory);
  const customersRef = useRef<Customer[]>(customers);
  const suppliersRef = useRef<Supplier[]>(suppliers);
  const invoicesRef = useRef<Invoice[]>(invoices);
  const purchasesRef = useRef<PurchaseOrder[]>(purchases);

  useEffect(() => { inventoryRef.current = inventory; }, [inventory]);
  useEffect(() => { customersRef.current = customers; }, [customers]);
  useEffect(() => { suppliersRef.current = suppliers; }, [suppliers]);
  useEffect(() => { invoicesRef.current = invoices; }, [invoices]);
  useEffect(() => { purchasesRef.current = purchases; }, [purchases]);

  // Sync to localStorage smoothly via debounced non-blocking batcher
  useEffect(() => { saveStorageDebounced('doctor_tools_inventory', inventory); }, [inventory]);
  useEffect(() => { saveStorageDebounced('doctor_tools_categories', categories); }, [categories]);
  useEffect(() => { saveStorageDebounced('doctor_tools_categories_docs', categoriesDocs); }, [categoriesDocs]);
  useEffect(() => { saveStorageDebounced('doctor_tools_customers', customers); }, [customers]);
  useEffect(() => { saveStorageDebounced('doctor_tools_suppliers', suppliers); }, [suppliers]);
  useEffect(() => { saveStorageDebounced('doctor_tools_invoices', invoices); }, [invoices]);
  useEffect(() => { saveStorageDebounced('doctor_tools_purchases', purchases); }, [purchases]);
  useEffect(() => { saveStorageDebounced('doctor_tools_notifications', notifications); }, [notifications]);
  useEffect(() => { saveStorageDebounced('doctor_tools_profile', businessProfile); }, [businessProfile]);

  // Comprehensive bi-directional sync method (pulls remote, pushes offline-created local items)
  const syncNow = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      // Data is synced in real-time via onSnapshot listeners below.
      // We no longer push local items that are missing from the cloud, 
      // because that resurrects legitimately deleted items across devices.
      // Firebase SDK handles offline writes and caching automatically.
      setSyncStatus('synced');
      setLastSyncTime(new Date());
    } catch (err) {
      console.warn('Sync reconciliation finished:', err);
      setSyncStatus('synced');
      setLastSyncTime(new Date());
    }
  }, [uid]);

  // Initial sync once on mount
  useEffect(() => {
    if (!initialSyncExecuted.current) {
      initialSyncExecuted.current = true;
      syncNow();
    }
  }, [syncNow]);

  // Firestore Real-Time Live Sync Listeners across all devices
  useEffect(() => {
    let active = true;
    setSyncStatus('syncing');

    const unsubs = [
      onSnapshot(doc(db, 'users', uid, 'profile', 'businessProfile'), (docSnap) => {
        if (!active) return;
        setSyncStatus('synced');
        setLastSyncTime(new Date());
        if (docSnap.exists()) {
          const prof = docSnap.data() as BusinessProfile;
          setBusinessProfile(prof);
          saveStorageDebounced('doctor_tools_profile', prof, 0);
        }
      }, (e) => {
        handleFirestoreError(e, OperationType.GET, `users/${uid}/profile`);
      }),

      onSnapshot(collection(db, 'users', uid, 'categories'), (snap) => {
        if (!active) return;
        setSyncStatus('synced');
        setLastSyncTime(new Date());
        if (!snap.empty) {
          const cats = snap.docs.map(t => ({ id: t.id, name: t.data().name }));
          setCategoriesDocs(cats);
          if (cats.length > 0) {
            const catNames = cats.map(c => c.name);
            setCategories(catNames);
            saveStorageDebounced('doctor_tools_categories', catNames, 0);
          }
        }
      }, (e) => {
        handleFirestoreError(e, OperationType.LIST, `users/${uid}/categories`);
      }),

      onSnapshot(collection(db, 'users', uid, 'inventory'), (snap) => {
        if (!active) return;
        setSyncStatus('synced');
        setLastSyncTime(new Date());
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as InventoryItem)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setInventory(list);
        saveStorageDebounced('doctor_tools_inventory', list, 0);
      }, (e) => {
        handleFirestoreError(e, OperationType.LIST, `users/${uid}/inventory`);
      }),

      onSnapshot(collection(db, 'users', uid, 'customers'), (snap) => {
        if (!active) return;
        setSyncStatus('synced');
        setLastSyncTime(new Date());
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as Customer)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setCustomers(list);
        saveStorageDebounced('doctor_tools_customers', list, 0);
      }, (e) => {
        handleFirestoreError(e, OperationType.LIST, `users/${uid}/customers`);
      }),

      onSnapshot(collection(db, 'users', uid, 'suppliers'), (snap) => {
        if (!active) return;
        setSyncStatus('synced');
        setLastSyncTime(new Date());
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as Supplier)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setSuppliers(list);
        saveStorageDebounced('doctor_tools_suppliers', list, 0);
      }, (e) => {
        handleFirestoreError(e, OperationType.LIST, `users/${uid}/suppliers`);
      }),

      onSnapshot(collection(db, 'users', uid, 'invoices'), (snap) => {
        if (!active) return;
        setSyncStatus('synced');
        setLastSyncTime(new Date());
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as Invoice)).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        setInvoices(list);
        saveStorageDebounced('doctor_tools_invoices', list, 0);
      }, (e) => {
        handleFirestoreError(e, OperationType.LIST, `users/${uid}/invoices`);
      }),

      onSnapshot(collection(db, 'users', uid, 'purchases'), (snap) => {
        if (!active) return;
        setSyncStatus('synced');
        setLastSyncTime(new Date());
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as PurchaseOrder)).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        setPurchases(list);
        saveStorageDebounced('doctor_tools_purchases', list, 0);
      }, (e) => {
        handleFirestoreError(e, OperationType.LIST, `users/${uid}/purchases`);
      }),

      onSnapshot(collection(db, 'users', uid, 'notifications'), (snap) => {
        if (!active) return;
        setSyncStatus('synced');
        setLastSyncTime(new Date());
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as AppNotification));
        setNotifications(list);
        saveStorageDebounced('doctor_tools_notifications', list, 0);
      }, (e) => {
        handleFirestoreError(e, OperationType.LIST, `users/${uid}/notifications`);
      })
    ];

    return () => {
      active = false;
      unsubs.forEach(unsub => {
        try { unsub(); } catch {}
      });
    };
  }, [uid]);

  const lowStockThreshold = 10;
  const currentNotifications = useMemo(() => {
    const lowStockAlerts = inventory
      .filter(i => i.quantity <= lowStockThreshold)
      .map(i => ({
        id: `low-stock-${i.id}`,
        message: `تنبيه: صنف (${i.name}) قارب على الانتهاء. المتبقي: ${i.quantity}`,
        date: new Date().toISOString(),
        read: false
      }));
    
    return [...notifications, ...lowStockAlerts];
  }, [inventory, notifications]);

  const addInventoryItem = useCallback(async (item: Omit<InventoryItem, 'id'>): Promise<string> => {
    const cleanedItem = Object.fromEntries(
      Object.entries(item).map(([k, v]) => [k, v === undefined ? '' : v])
    ) as Omit<InventoryItem, 'id'>;
    
    const now = (item as any).createdAt || Date.now();
    const newRef = doc(collection(db, 'users', uid, 'inventory'));
    const newId = newRef.id;

    const newItem: InventoryItem = {
      ...cleanedItem,
      id: newId,
      createdAt: now,
      updatedAt: now
    } as InventoryItem;

    setInventory(prev => {
      const updated = [newItem, ...prev.filter(i => i.id !== newId)].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      try {
        localStorage.setItem('doctor_tools_inventory', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    safeFirestoreOperation(async () => {
      await setDoc(newRef, { ...cleanedItem, ownerId: uid, createdAt: now, updatedAt: now });
    }, `inventory/${newId}`);

    return newId;
  }, [uid]);
  
  const updateInventoryItem = useCallback(async (id: string, item: Omit<InventoryItem, 'id'>) => {
    const cleanedItem = Object.fromEntries(
      Object.entries(item).map(([k, v]) => [k, v === undefined ? '' : v])
    ) as Omit<InventoryItem, 'id'>;

    const now = Date.now();
    setInventory(prev => {
      const updated = prev.map(inv => inv.id === id ? { ...inv, ...cleanedItem, updatedAt: now } : inv);
      try {
        localStorage.setItem('doctor_tools_inventory', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    safeFirestoreOperation(async () => {
      await setDoc(doc(db, 'users', uid, 'inventory', id), { ...cleanedItem, ownerId: uid, updatedAt: now }, { merge: true });
    }, `inventory/${id}`);
  }, [uid]);
  
  const deleteInventoryItem = useCallback(async (id: string) => {
    setInventory(prev => {
      const updated = prev.filter(inv => inv.id !== id);
      try {
        localStorage.setItem('doctor_tools_inventory', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    safeFirestoreOperation(async () => {
      await deleteDoc(doc(db, 'users', uid, 'inventory', id));
    }, `inventory/${id}`, OperationType.DELETE);
  }, [uid]);

  const addCategory = useCallback(async (category: string) => {
    const catName = category.trim();
    if (!catName) return;

    setCategories(prev => {
      const updated = prev.includes(catName) ? prev : [...prev, catName];
      try { localStorage.setItem('doctor_tools_categories', JSON.stringify(updated)); } catch {}
      return updated;
    });
    const newCatId = `cat_${Date.now()}`;
    setCategoriesDocs(prev => {
      const updated = prev.some(c => c.name === catName) ? prev : [...prev, { id: newCatId, name: catName }];
      try { localStorage.setItem('doctor_tools_categories_docs', JSON.stringify(updated)); } catch {}
      return updated;
    });

    safeFirestoreOperation(async () => {
      const newRef = doc(collection(db, 'users', uid, 'categories'));
      await setDoc(newRef, { ownerId: uid, name: catName, createdAt: Date.now(), updatedAt: Date.now() });
    }, 'categories');
  }, [uid]);
  
  const removeCategory = useCallback(async (categoryName: string) => {
    setCategories(prev => {
      const updated = prev.filter(c => c !== categoryName);
      try { localStorage.setItem('doctor_tools_categories', JSON.stringify(updated)); } catch {}
      return updated;
    });
    setCategoriesDocs(prev => {
      const updated = prev.filter(c => c.name !== categoryName);
      try { localStorage.setItem('doctor_tools_categories_docs', JSON.stringify(updated)); } catch {}
      return updated;
    });

    safeFirestoreOperation(async () => {
      const cat = categoriesDocs.find(c => c.name === categoryName);
      if (cat) {
        await deleteDoc(doc(db, 'users', uid, 'categories', cat.id));
      }
    }, `categories/${categoryName}`, OperationType.DELETE);
  }, [categoriesDocs, uid]);

  const addCustomer = useCallback(async (customer: Omit<Customer, 'id' | 'serialNumber'>): Promise<string> => {
    const serialNumber = `CUST-${1000 + customers.length + 1}`;
    const now = (customer as any).createdAt || Date.now();
    const newRef = doc(collection(db, 'users', uid, 'customers'));
    const newId = newRef.id;

    const newCust: Customer = {
      ...customer,
      id: newId,
      serialNumber,
      createdAt: now,
      updatedAt: now
    };

    setCustomers(prev => {
      const updated = [newCust, ...prev.filter(c => c.id !== newId)].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      try { localStorage.setItem('doctor_tools_customers', JSON.stringify(updated)); } catch {}
      return updated;
    });

    safeFirestoreOperation(async () => {
      await setDoc(newRef, { ...customer, ownerId: uid, serialNumber, createdAt: now, updatedAt: now });
    }, `customers/${newId}`);

    return newId;
  }, [customers.length, uid]);

  const updateCustomer = useCallback(async (id: string, customer: Omit<Customer, 'id' | 'serialNumber'>) => {
    const now = Date.now();
    setCustomers(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...customer, updatedAt: now } : c);
      try { localStorage.setItem('doctor_tools_customers', JSON.stringify(updated)); } catch {}
      return updated;
    });

    safeFirestoreOperation(async () => {
      await setDoc(doc(db, 'users', uid, 'customers', id), { ...customer, ownerId: uid, updatedAt: now }, { merge: true });
    }, `customers/${id}`);
  }, [uid]);

  const deleteCustomer = useCallback(async (id: string) => {
    setCustomers(prev => {
      const updated = prev.filter(c => c.id !== id);
      try { localStorage.setItem('doctor_tools_customers', JSON.stringify(updated)); } catch {}
      return updated;
    });

    safeFirestoreOperation(async () => {
      await deleteDoc(doc(db, 'users', uid, 'customers', id));
    }, `customers/${id}`, OperationType.DELETE);
  }, [uid]);

  const addSupplier = useCallback(async (supplier: Omit<Supplier, 'id'>) => {
    const now = (supplier as any).createdAt || Date.now();
    const newRef = doc(collection(db, 'users', uid, 'suppliers'));
    const newId = newRef.id;

    const newSup: Supplier = {
      ...supplier,
      id: newId,
      createdAt: now,
      updatedAt: now
    };

    setSuppliers(prev => {
      const updated = [newSup, ...prev.filter(s => s.id !== newId)].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      try { localStorage.setItem('doctor_tools_suppliers', JSON.stringify(updated)); } catch {}
      return updated;
    });

    safeFirestoreOperation(async () => {
      await setDoc(newRef, { ...supplier, ownerId: uid, createdAt: now, updatedAt: now });
    }, `suppliers/${newId}`);
  }, [uid]);

  const updateSupplier = useCallback(async (id: string, supplier: Omit<Supplier, 'id'>) => {
    const now = Date.now();
    setSuppliers(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, ...supplier, updatedAt: now } : s);
      try { localStorage.setItem('doctor_tools_suppliers', JSON.stringify(updated)); } catch {}
      return updated;
    });

    safeFirestoreOperation(async () => {
      await setDoc(doc(db, 'users', uid, 'suppliers', id), { ...supplier, ownerId: uid, updatedAt: now }, { merge: true });
    }, `suppliers/${id}`);
  }, [uid]);

  const deleteSupplier = useCallback(async (id: string) => {
    setSuppliers(prev => {
      const updated = prev.filter(s => s.id !== id);
      try { localStorage.setItem('doctor_tools_suppliers', JSON.stringify(updated)); } catch {}
      return updated;
    });

    safeFirestoreOperation(async () => {
      await deleteDoc(doc(db, 'users', uid, 'suppliers', id));
    }, `suppliers/${id}`, OperationType.DELETE);
  }, [uid]);

  const createInvoice = useCallback(async (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
    const isQuote = invoice.isQuote || false;
    const invoiceNumber = isQuote 
      ? `QT-${1000 + invoices.filter(i => i.isQuote).length + 1}`
      : `INV-${1000 + invoices.length + 1}`;
    
    const newRef = doc(collection(db, 'users', uid, 'invoices'));
    const newId = newRef.id;

    const newInv: Invoice = {
      ...invoice,
      id: newId,
      invoiceNumber,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setInvoices(prev => {
      const updated = [newInv, ...prev];
      try { localStorage.setItem('doctor_tools_invoices', JSON.stringify(updated)); } catch {}
      return updated;
    });

    if (!isQuote) {
      setInventory(prev => {
        const updated = prev.map(inv => {
          const sold = invoice.items.find(it => it.itemId === inv.id);
          if (sold) {
            return { ...inv, quantity: inv.quantity - sold.quantity, updatedAt: Date.now() };
          }
          return inv;
        });
        try { localStorage.setItem('doctor_tools_inventory', JSON.stringify(updated)); } catch {}
        return updated;
      });

      const remaining = invoice.total - invoice.paid;
      if (remaining !== 0 && invoice.customerId) {
        setCustomers(prev => {
          const updated = prev.map(c => {
            if (c.id === invoice.customerId) {
              return { ...c, balance: c.balance + remaining, updatedAt: Date.now() };
            }
            return c;
          });
          try { localStorage.setItem('doctor_tools_customers', JSON.stringify(updated)); } catch {}
          return updated;
        });
      }
    }

    safeFirestoreOperation(async () => {
      const batch = writeBatch(db);
      batch.set(newRef, { ...invoice, ownerId: uid, invoiceNumber, createdAt: Date.now(), updatedAt: Date.now() });
      
      if (!isQuote) {
        for (const item of invoice.items) {
          const invRef = doc(db, 'users', uid, 'inventory', item.itemId);
          const currentItem = inventory.find(i => i.id === item.itemId);
          if (currentItem) {
            batch.update(invRef, { quantity: currentItem.quantity - item.quantity, updatedAt: Date.now() });
          }
        }

        const remaining = invoice.total - invoice.paid;
        if (remaining !== 0 && invoice.customerId) {
          const custRef = doc(db, 'users', uid, 'customers', invoice.customerId);
          const currentCust = customers.find(c => c.id === invoice.customerId);
          if (currentCust) {
            batch.update(custRef, { balance: currentCust.balance + remaining, updatedAt: Date.now() });
          }
        }
      }
      
      await batch.commit();
    }, `invoices/${newId}`);
  }, [customers, inventory, invoices, uid]);

  const updateInvoice = useCallback(async (id: string, invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
    const existingInvoice = invoices.find(inv => inv.id === id);
    if (!existingInvoice) return;

    setInvoices(prev => {
      const updated = prev.map(inv => inv.id === id ? { ...inv, ...invoice, updatedAt: Date.now() } : inv);
      try { localStorage.setItem('doctor_tools_invoices', JSON.stringify(updated)); } catch {}
      return updated;
    });

    const wasQuote = existingInvoice.isQuote || false;
    const isQuote = invoice.isQuote || false;

    if (!wasQuote && !isQuote) {
      setInventory(prev => {
        const updated = prev.map(inv => {
          const oldItem = existingInvoice.items.find(it => it.itemId === inv.id);
          const newItem = invoice.items.find(it => it.itemId === inv.id);
          let qty = inv.quantity;
          if (oldItem) qty += oldItem.quantity;
          if (newItem) qty -= newItem.quantity;
          return qty !== inv.quantity ? { ...inv, quantity: qty, updatedAt: Date.now() } : inv;
        });
        try { localStorage.setItem('doctor_tools_inventory', JSON.stringify(updated)); } catch {}
        return updated;
      });

      const oldRemaining = existingInvoice.total - existingInvoice.paid;
      const newRemaining = invoice.total - invoice.paid;
      if (existingInvoice.customerId && invoice.customerId) {
        setCustomers(prev => {
          const updated = prev.map(c => {
            if (c.id === existingInvoice.customerId && existingInvoice.customerId === invoice.customerId) {
              return { ...c, balance: c.balance - oldRemaining + newRemaining, updatedAt: Date.now() };
            }
            if (c.id === existingInvoice.customerId) {
              return { ...c, balance: c.balance - oldRemaining, updatedAt: Date.now() };
            }
            if (c.id === invoice.customerId) {
              return { ...c, balance: c.balance + newRemaining, updatedAt: Date.now() };
            }
            return c;
          });
          try { localStorage.setItem('doctor_tools_customers', JSON.stringify(updated)); } catch {}
          return updated;
        });
      }
    }

    safeFirestoreOperation(async () => {
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', uid, 'invoices', id), { ...invoice, ownerId: uid, updatedAt: Date.now() }, { merge: true });

      if (!wasQuote && !isQuote) {
        for (const existingItem of existingInvoice.items) {
          const invRef = doc(db, 'users', uid, 'inventory', existingItem.itemId);
          const currentItem = inventory.find(i => i.id === existingItem.itemId);
          if (currentItem) {
            const newItem = invoice.items.find(i => i.itemId === existingItem.itemId);
            let newQuantity = currentItem.quantity + existingItem.quantity;
            if (newItem) newQuantity -= newItem.quantity;
            batch.update(invRef, { quantity: newQuantity, updatedAt: Date.now() });
          }
        }
        for (const newItem of invoice.items) {
          if (!existingInvoice.items.find(i => i.itemId === newItem.itemId)) {
            const invRef = doc(db, 'users', uid, 'inventory', newItem.itemId);
            const currentItem = inventory.find(i => i.id === newItem.itemId);
            if (currentItem) {
              batch.update(invRef, { quantity: currentItem.quantity - newItem.quantity, updatedAt: Date.now() });
            }
          }
        }

        const oldRemaining = existingInvoice.total - existingInvoice.paid;
        const newRemaining = invoice.total - invoice.paid;
        
        if (existingInvoice.customerId && invoice.customerId) {
          if (existingInvoice.customerId === invoice.customerId) {
              const custRef = doc(db, 'users', uid, 'customers', existingInvoice.customerId);
              const cust = customers.find(c => c.id === existingInvoice.customerId);
              if (cust) batch.update(custRef, { balance: cust.balance - oldRemaining + newRemaining, updatedAt: Date.now() });
          } else {
              const oldCustRef = doc(db, 'users', uid, 'customers', existingInvoice.customerId);
              const oldCust = customers.find(c => c.id === existingInvoice.customerId);
              if (oldCust) batch.update(oldCustRef, { balance: oldCust.balance - oldRemaining, updatedAt: Date.now() });

              const newCustRef = doc(db, 'users', uid, 'customers', invoice.customerId);
              const newCust = customers.find(c => c.id === invoice.customerId);
              if (newCust) batch.update(newCustRef, { balance: newCust.balance + newRemaining, updatedAt: Date.now() });
          }
        }
      }

      await batch.commit();
    }, `invoices/${id}`);
  }, [customers, inventory, invoices, uid]);

  const deleteInvoice = useCallback(async (id: string) => {
    const invToDelete = invoices.find(inv => inv.id === id);
    if (!invToDelete) return;

    setInvoices(prev => {
      const updated = prev.filter(inv => inv.id !== id);
      try { localStorage.setItem('doctor_tools_invoices', JSON.stringify(updated)); } catch {}
      return updated;
    });

    if (!invToDelete.isQuote) {
      setInventory(prev => {
        const updated = prev.map(inv => {
          const sold = invToDelete.items.find(it => it.itemId === inv.id);
          if (sold) {
            return { ...inv, quantity: inv.quantity + sold.quantity, updatedAt: Date.now() };
          }
          return inv;
        });
        try { localStorage.setItem('doctor_tools_inventory', JSON.stringify(updated)); } catch {}
        return updated;
      });

      const remaining = invToDelete.total - invToDelete.paid;
      if (remaining !== 0 && invToDelete.customerId) {
        setCustomers(prev => {
          const updated = prev.map(c => {
            if (c.id === invToDelete.customerId) {
              return { ...c, balance: c.balance - remaining, updatedAt: Date.now() };
            }
            return c;
          });
          try { localStorage.setItem('doctor_tools_customers', JSON.stringify(updated)); } catch {}
          return updated;
        });
      }
    }

    safeFirestoreOperation(async () => {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'users', uid, 'invoices', id));

      if (!invToDelete.isQuote) {
        for (const soldItem of invToDelete.items) {
          const invRef = doc(db, 'users', uid, 'inventory', soldItem.itemId);
          const currentItem = inventory.find(i => i.id === soldItem.itemId);
          if (currentItem) {
            batch.update(invRef, { quantity: currentItem.quantity + soldItem.quantity, updatedAt: Date.now() });
          }
        }

        const remaining = invToDelete.total - invToDelete.paid;
        if (remaining !== 0 && invToDelete.customerId) {
          const custRef = doc(db, 'users', uid, 'customers', invToDelete.customerId);
          const cust = customers.find(c => c.id === invToDelete.customerId);
          if (cust) batch.update(custRef, { balance: cust.balance - remaining, updatedAt: Date.now() });
        }
      }

      await batch.commit();
    }, `invoices/${id}`, OperationType.DELETE);
  }, [customers, inventory, invoices, uid]);

  const createPurchase = useCallback(async (purchase: Omit<PurchaseOrder, 'id'>) => {
    const newRef = doc(collection(db, 'users', uid, 'purchases'));
    const newId = newRef.id;

    const newPur: PurchaseOrder = {
      ...purchase,
      id: newId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setPurchases(prev => {
      const updated = [newPur, ...prev];
      try { localStorage.setItem('doctor_tools_purchases', JSON.stringify(updated)); } catch {}
      return updated;
    });

    setInventory(prev => {
      const updated = prev.map(inv => {
        const purItem = purchase.items.find(it => it.itemId === inv.id);
        if (purItem) {
          return { ...inv, quantity: inv.quantity + purItem.quantity, purchasePrice: purItem.price, updatedAt: Date.now() };
        }
        return inv;
      });
      try { localStorage.setItem('doctor_tools_inventory', JSON.stringify(updated)); } catch {}
      return updated;
    });

    const remaining = purchase.total - purchase.paid;
    if (remaining !== 0) {
      setSuppliers(prev => {
        const updated = prev.map(s => {
          if (s.id === purchase.supplierId) {
            return { ...s, balance: s.balance + remaining, updatedAt: Date.now() };
          }
          return s;
        });
        try { localStorage.setItem('doctor_tools_suppliers', JSON.stringify(updated)); } catch {}
        return updated;
      });
    }

    safeFirestoreOperation(async () => {
      const batch = writeBatch(db);
      batch.set(newRef, { ...purchase, ownerId: uid, createdAt: Date.now(), updatedAt: Date.now() });
      
      for (const purItem of purchase.items) {
        const invRef = doc(db, 'users', uid, 'inventory', purItem.itemId);
        const currentItem = inventory.find(i => i.id === purItem.itemId);
        if (currentItem) {
          batch.update(invRef, { quantity: currentItem.quantity + purItem.quantity, purchasePrice: purItem.price, updatedAt: Date.now() });
        }
      }

      if (remaining !== 0) {
        const supRef = doc(db, 'users', uid, 'suppliers', purchase.supplierId);
        const sup = suppliers.find(s => s.id === purchase.supplierId);
        if (sup) {
          batch.update(supRef, { balance: sup.balance + remaining, updatedAt: Date.now() });
        }
      }
      
      await batch.commit();
    }, `purchases/${newId}`);
  }, [inventory, suppliers, uid]);

  const recordCustomerPayment = useCallback(async (customerId: string, amount: number, paymentDate?: string) => {
    if (amount <= 0) return;
    const invoiceNumber = `PAY-${1000 + invoices.length + 1}`;
    const newRef = doc(collection(db, 'users', uid, 'invoices'));
    const newId = newRef.id;

    const dateToUse = paymentDate ? new Date(paymentDate + 'T12:00:00').toISOString() : new Date().toISOString();
    const timeToUse = paymentDate ? new Date(paymentDate + 'T12:00:00').getTime() : Date.now();

    const newPayInv: Invoice = {
      id: newId,
      invoiceNumber,
      date: dateToUse,
      customerId,
      items: [],
      total: 0,
      paid: amount,
      createdAt: timeToUse,
      updatedAt: Date.now()
    };

    setInvoices(prev => {
      const updated = [newPayInv, ...prev];
      try { localStorage.setItem('doctor_tools_invoices', JSON.stringify(updated)); } catch {}
      return updated;
    });
    setCustomers(prev => {
      const updated = prev.map(c => c.id === customerId ? { ...c, balance: c.balance - amount, updatedAt: Date.now() } : c);
      try { localStorage.setItem('doctor_tools_customers', JSON.stringify(updated)); } catch {}
      return updated;
    });

    safeFirestoreOperation(async () => {
      const batch = writeBatch(db);
      batch.set(newRef, {
        ownerId: uid,
        invoiceNumber,
        date: dateToUse,
        customerId,
        items: [],
        total: 0,
        paid: amount,
        createdAt: timeToUse,
        updatedAt: Date.now()
      });

      const custRef = doc(db, 'users', uid, 'customers', customerId);
      const cust = customers.find(c => c.id === customerId);
      if (cust) {
        batch.update(custRef, { balance: cust.balance - amount, updatedAt: Date.now() });
      }

      await batch.commit();
    }, `invoices/${newId}`);
  }, [customers, invoices.length, uid]);

  const recordSupplierPayment = useCallback(async (supplierId: string, amount: number, paymentDate?: string) => {
    if (amount <= 0) return;
    const newRef = doc(collection(db, 'users', uid, 'purchases'));
    const newId = newRef.id;

    const dateToUse = paymentDate ? new Date(paymentDate + 'T12:00:00').toISOString() : new Date().toISOString();
    const timeToUse = paymentDate ? new Date(paymentDate + 'T12:00:00').getTime() : Date.now();

    const newPayPur: PurchaseOrder = {
      id: newId,
      date: dateToUse,
      supplierId,
      items: [],
      total: 0,
      paid: amount,
      createdAt: timeToUse,
      updatedAt: Date.now()
    };

    setPurchases(prev => {
      const updated = [newPayPur, ...prev];
      try { localStorage.setItem('doctor_tools_purchases', JSON.stringify(updated)); } catch {}
      return updated;
    });
    setSuppliers(prev => {
      const updated = prev.map(s => s.id === supplierId ? { ...s, balance: s.balance - amount, updatedAt: Date.now() } : s);
      try { localStorage.setItem('doctor_tools_suppliers', JSON.stringify(updated)); } catch {}
      return updated;
    });

    safeFirestoreOperation(async () => {
      const batch = writeBatch(db);
      batch.set(newRef, {
        ownerId: uid,
        date: dateToUse,
        supplierId,
        items: [],
        total: 0,
        paid: amount,
        createdAt: timeToUse,
        updatedAt: Date.now()
      });

      const supRef = doc(db, 'users', uid, 'suppliers', supplierId);
      const sup = suppliers.find(s => s.id === supplierId);
      if (sup) {
        batch.update(supRef, { balance: sup.balance - amount, updatedAt: Date.now() });
      }

      await batch.commit();
    }, `purchases/${newId}`);
  }, [suppliers, uid]);

  const markAllNotificationsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true, updatedAt: Date.now() })));

    await safeFirestoreOperation(async () => {
      const batch = writeBatch(db);
      let updated = 0;
      notifications.forEach(n => {
        if (!n.read && updated < 500) {
           batch.update(doc(db, 'users', uid, 'notifications', n.id), { read: true, updatedAt: Date.now() });
           updated++;
        }
      });
      if (updated > 0) await batch.commit();
    }, 'notifications');
  }, [notifications, uid]);

  const updateBusinessProfile = useCallback(async (profile: BusinessProfile) => {
    const dataToSave = {
      name: profile.name || 'Doctor Tools',
      phone: profile.phone || '01000000000',
      address: profile.address || 'القاهرة، مصر',
      description: profile.description || 'نظام إدارة العيادات والمستلزمات الطبية المتكامل',
      logo: profile.logo || null,
      ownerId: uid,
      createdAt: businessProfile.createdAt || profile.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    setBusinessProfile(dataToSave);

    await safeFirestoreOperation(async () => {
      await setDoc(doc(db, 'users', uid, 'profile', 'businessProfile'), dataToSave);
    }, 'profile/businessProfile');
  }, [businessProfile.createdAt, uid]);

  const scanAndRecoverBrowserData = useCallback(() => {
    let recItems = 0;
    let recCusts = 0;
    let recSups = 0;
    let recInvs = 0;
    let recPurs = 0;

    // 1. Scan Inventory
    const foundInv = toSafeArray<InventoryItem>(scanStorageForItems<InventoryItem[]>('doctor_tools_inventory', inventoryLegacyKeys, isInventoryItem, []));
    if (foundInv.length > 0) {
      const cur = toSafeArray<InventoryItem>(inventoryRef.current);
      const existingIds = new Set(cur.map(i => i.id));
      const combined = [...cur];
      foundInv.forEach(item => {
        if (item && item.id && !existingIds.has(item.id)) {
          combined.push(item);
          recItems++;
        }
      });
      if (recItems > 0 || cur.length === 0) {
        setInventory(combined);
        saveStorageDebounced('doctor_tools_inventory', combined, 0);
        combined.forEach(item => {
          if (item && item.id) {
            setDoc(doc(db, 'users', uid, 'inventory', item.id), { ...item, ownerId: uid }, { merge: true }).catch(() => {});
          }
        });
      }
    }

    // 2. Scan Customers
    const foundCust = toSafeArray<Customer>(scanStorageForItems<Customer[]>('doctor_tools_customers', customersLegacyKeys, isCustomer, []));
    if (foundCust.length > 0) {
      const cur = toSafeArray<Customer>(customersRef.current);
      const existingIds = new Set(cur.map(c => c.id));
      const combined = [...cur];
      foundCust.forEach(c => {
        if (c && c.id && !existingIds.has(c.id)) {
          combined.push(c);
          recCusts++;
        }
      });
      if (recCusts > 0 || cur.length === 0) {
        setCustomers(combined);
        saveStorageDebounced('doctor_tools_customers', combined, 0);
        combined.forEach(c => {
          if (c && c.id) {
            setDoc(doc(db, 'users', uid, 'customers', c.id), { ...c, ownerId: uid }, { merge: true }).catch(() => {});
          }
        });
      }
    }

    // 3. Scan Suppliers
    const foundSups = toSafeArray<Supplier>(scanStorageForItems<Supplier[]>('doctor_tools_suppliers', suppliersLegacyKeys, isSupplier, []));
    if (foundSups.length > 0) {
      const cur = toSafeArray<Supplier>(suppliersRef.current);
      const existingIds = new Set(cur.map(s => s.id));
      const combined = [...cur];
      foundSups.forEach(s => {
        if (s && s.id && !existingIds.has(s.id)) {
          combined.push(s);
          recSups++;
        }
      });
      if (recSups > 0 || cur.length === 0) {
        setSuppliers(combined);
        saveStorageDebounced('doctor_tools_suppliers', combined, 0);
        combined.forEach(s => {
          if (s && s.id) {
            setDoc(doc(db, 'users', uid, 'suppliers', s.id), { ...s, ownerId: uid }, { merge: true }).catch(() => {});
          }
        });
      }
    }

    // 4. Scan Invoices
    const foundInvs = toSafeArray<Invoice>(scanStorageForItems<Invoice[]>('doctor_tools_invoices', invoicesLegacyKeys, isInvoice, []));
    if (foundInvs.length > 0) {
      const cur = toSafeArray<Invoice>(invoicesRef.current);
      const existingIds = new Set(cur.map(inv => inv.id));
      const combined = [...cur];
      foundInvs.forEach(inv => {
        if (inv && inv.id && !existingIds.has(inv.id)) {
          combined.push(inv);
          recInvs++;
        }
      });
      if (recInvs > 0 || cur.length === 0) {
        setInvoices(combined);
        saveStorageDebounced('doctor_tools_invoices', combined, 0);
        combined.forEach(inv => {
          if (inv && inv.id) {
            setDoc(doc(db, 'users', uid, 'invoices', inv.id), { ...inv, ownerId: uid }, { merge: true }).catch(() => {});
          }
        });
      }
    }

    // 5. Scan Purchases
    const foundPurs = toSafeArray<PurchaseOrder>(scanStorageForItems<PurchaseOrder[]>('doctor_tools_purchases', purchasesLegacyKeys, isPurchase, []));
    if (foundPurs.length > 0) {
      const cur = toSafeArray<PurchaseOrder>(purchasesRef.current);
      const existingIds = new Set(cur.map(p => p.id));
      const combined = [...cur];
      foundPurs.forEach(p => {
        if (p && p.id && !existingIds.has(p.id)) {
          combined.push(p);
          recPurs++;
        }
      });
      if (recPurs > 0 || cur.length === 0) {
        setPurchases(combined);
        saveStorageDebounced('doctor_tools_purchases', combined, 0);
        combined.forEach(p => {
          if (p && p.id) {
            setDoc(doc(db, 'users', uid, 'purchases', p.id), { ...p, ownerId: uid }, { merge: true }).catch(() => {});
          }
        });
      }
    }

    const totalRecovered = recItems + recCusts + recSups + recInvs + recPurs;
    const msg = totalRecovered > 0
      ? `تم العثور بنجاح على ${totalRecovered} سجلاً واسترجاعها إلى النظام ومزامنتها السحابية!`
      : 'تم فحص ذاكرة المتصفح بالكامل، جميع البيانات الحالية مُحدثة بالفعل ولا توجد سجلات مفقودة.';
    
    setRecoveryNotice(msg);
    return {
      recoveredItems: recItems,
      recoveredCustomers: recCusts,
      recoveredSuppliers: recSups,
      recoveredInvoices: recInvs,
      recoveredPurchases: recPurs,
      message: msg
    };
  }, [uid]);

  const exportDataBackup = useCallback((): string => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      appName: 'Doctor Tools',
      inventory: toSafeArray(inventoryRef.current),
      customers: toSafeArray(customersRef.current),
      suppliers: toSafeArray(suppliersRef.current),
      invoices: toSafeArray(invoicesRef.current),
      purchases: toSafeArray(purchasesRef.current),
      categories: Array.isArray(categories) ? categories : [],
      businessProfile: businessProfile
    };
    return JSON.stringify(backup, null, 2);
  }, [categories, businessProfile]);

  const importDataBackup = useCallback(async (jsonString: string): Promise<{ success: boolean; message: string }> => {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'ملف النسخة الاحتياطية غير صالح (تنسيق غير متوافق)' };
      }

      let count = 0;
      if (Array.isArray(data.inventory) && data.inventory.length > 0) {
        setInventory(data.inventory);
        saveStorageDebounced('doctor_tools_inventory', data.inventory, 0);
        data.inventory.forEach((item: any) => {
          setDoc(doc(db, 'users', uid, 'inventory', item.id), { ...item, ownerId: uid }, { merge: true }).catch(() => {});
        });
        count += data.inventory.length;
      }

      if (Array.isArray(data.customers) && data.customers.length > 0) {
        setCustomers(data.customers);
        saveStorageDebounced('doctor_tools_customers', data.customers, 0);
        data.customers.forEach((c: any) => {
          setDoc(doc(db, 'users', uid, 'customers', c.id), { ...c, ownerId: uid }, { merge: true }).catch(() => {});
        });
        count += data.customers.length;
      }

      if (Array.isArray(data.suppliers) && data.suppliers.length > 0) {
        setSuppliers(data.suppliers);
        saveStorageDebounced('doctor_tools_suppliers', data.suppliers, 0);
        data.suppliers.forEach((s: any) => {
          setDoc(doc(db, 'users', uid, 'suppliers', s.id), { ...s, ownerId: uid }, { merge: true }).catch(() => {});
        });
        count += data.suppliers.length;
      }

      if (Array.isArray(data.invoices) && data.invoices.length > 0) {
        setInvoices(data.invoices);
        saveStorageDebounced('doctor_tools_invoices', data.invoices, 0);
        data.invoices.forEach((inv: any) => {
          setDoc(doc(db, 'users', uid, 'invoices', inv.id), { ...inv, ownerId: uid }, { merge: true }).catch(() => {});
        });
        count += data.invoices.length;
      }

      if (Array.isArray(data.purchases) && data.purchases.length > 0) {
        setPurchases(data.purchases);
        saveStorageDebounced('doctor_tools_purchases', data.purchases, 0);
        data.purchases.forEach((p: any) => {
          setDoc(doc(db, 'users', uid, 'purchases', p.id), { ...p, ownerId: uid }, { merge: true }).catch(() => {});
        });
        count += data.purchases.length;
      }

      if (Array.isArray(data.categories) && data.categories.length > 0) {
        setCategories(data.categories);
        saveStorageDebounced('doctor_tools_categories', data.categories, 0);
      }

      if (data.businessProfile && typeof data.businessProfile === 'object') {
        setBusinessProfile(data.businessProfile);
        saveStorageDebounced('doctor_tools_profile', data.businessProfile, 0);
      }

      const successMsg = `تم استيراد ${count} سجلاً بنجاح ومزامنتها مع السحابة والتخزين الداخلي!`;
      setRecoveryNotice(successMsg);
      return { success: true, message: successMsg };
    } catch (e: any) {
      return { success: false, message: `فشل استيراد النسخة الاحتياطية: ${e?.message || 'خطأ غير متوقع'}` };
    }
  }, [uid]);

  const contextValue = useMemo(() => ({
    inventory,
    categories,
    customers,
    suppliers,
    invoices,
    purchases,
    notifications: currentNotifications,
    businessProfile,
    syncStatus,
    isLiveSyncActive: true,
    lastSyncTime,
    syncNow,
    exportDataBackup,
    importDataBackup,
    scanAndRecoverBrowserData,
    recoveryNotice,
    dismissRecoveryNotice,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    addCategory,
    removeCategory,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    createPurchase,
    recordCustomerPayment,
    recordSupplierPayment,
    markAllNotificationsRead,
    updateBusinessProfile
  }), [
    inventory,
    categories,
    customers,
    suppliers,
    invoices,
    purchases,
    currentNotifications,
    businessProfile,
    syncStatus,
    lastSyncTime,
    syncNow,
    exportDataBackup,
    importDataBackup,
    scanAndRecoverBrowserData,
    recoveryNotice,
    dismissRecoveryNotice,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    addCategory,
    removeCategory,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    createPurchase,
    recordCustomerPayment,
    recordSupplierPayment,
    markAllNotificationsRead,
    updateBusinessProfile
  ]);

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return context;
}
