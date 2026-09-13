export type InventoryItem = {
  id: number;
  item_code: string;
  item_name: string;
  category: string;
  qty_in_stock: number;
  min_qty: number;
  sell_price: number;
  status: 'available' | 'low' | 'out';
};

export type WorkOrder = {
  id: number;
  wo_no: string;
  vehicle: string;
  customer: string;
  status: 'open' | 'in_progress' | 'waiting_parts' | 'done' | 'delivered';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  start_date: string;
};

export type Invoice = {
  id: number;
  invoice_no: string;
  customer: string;
  date: string;
  total: number;
  remaining: number;
  status: 'draft' | 'confirmed' | 'paid' | 'partial' | 'cancelled';
};

export type Customer = {
  id: number;
  full_name: string;
  phone: string;
  balance: number;
  customer_type: 'individual' | 'company';
};
