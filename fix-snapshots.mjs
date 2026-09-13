import fs from 'fs';

let content = fs.readFileSync('src/context/AppDataContext.tsx', 'utf8');

const regexes = [
  {
    regex: /onSnapshot\(collection\(db, 'users', uid, 'inventory'\), \(snap\) => \{[\s\S]*?saveStorageDebounced\('doctor_tools_inventory', list, 0\);\n      \},/m,
    replacement: `onSnapshot(collection(db, 'users', uid, 'inventory'), (snap) => {
        if (!active) return;
        setSyncStatus('synced');
        setLastSyncTime(new Date());
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as InventoryItem)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setInventory(list);
        saveStorageDebounced('doctor_tools_inventory', list, 0);
      },`
  },
  {
    regex: /onSnapshot\(collection\(db, 'users', uid, 'customers'\), \(snap\) => \{[\s\S]*?saveStorageDebounced\('doctor_tools_customers', list, 0\);\n      \},/m,
    replacement: `onSnapshot(collection(db, 'users', uid, 'customers'), (snap) => {
        if (!active) return;
        setSyncStatus('synced');
        setLastSyncTime(new Date());
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as Customer)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setCustomers(list);
        saveStorageDebounced('doctor_tools_customers', list, 0);
      },`
  },
  {
    regex: /onSnapshot\(collection\(db, 'users', uid, 'suppliers'\), \(snap\) => \{[\s\S]*?saveStorageDebounced\('doctor_tools_suppliers', list, 0\);\n      \},/m,
    replacement: `onSnapshot(collection(db, 'users', uid, 'suppliers'), (snap) => {
        if (!active) return;
        setSyncStatus('synced');
        setLastSyncTime(new Date());
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as Supplier)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setSuppliers(list);
        saveStorageDebounced('doctor_tools_suppliers', list, 0);
      },`
  },
  {
    regex: /onSnapshot\(collection\(db, 'users', uid, 'invoices'\), \(snap\) => \{[\s\S]*?saveStorageDebounced\('doctor_tools_invoices', list, 0\);\n      \},/m,
    replacement: `onSnapshot(collection(db, 'users', uid, 'invoices'), (snap) => {
        if (!active) return;
        setSyncStatus('synced');
        setLastSyncTime(new Date());
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as Invoice)).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        setInvoices(list);
        saveStorageDebounced('doctor_tools_invoices', list, 0);
      },`
  },
  {
    regex: /onSnapshot\(collection\(db, 'users', uid, 'purchases'\), \(snap\) => \{[\s\S]*?saveStorageDebounced\('doctor_tools_purchases', list, 0\);\n      \},/m,
    replacement: `onSnapshot(collection(db, 'users', uid, 'purchases'), (snap) => {
        if (!active) return;
        setSyncStatus('synced');
        setLastSyncTime(new Date());
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as PurchaseOrder)).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        setPurchases(list);
        saveStorageDebounced('doctor_tools_purchases', list, 0);
      },`
  }
];

let ok = true;
for (const { regex, replacement } of regexes) {
  if (!regex.test(content)) {
    console.error("Regex not found:\n" + regex);
    ok = false;
  }
  content = content.replace(regex, replacement);
}

if (ok) {
  fs.writeFileSync('src/context/AppDataContext.tsx', content);
  console.log('File updated successfully.');
} else {
  console.log('Failed to match some regexes.');
}
