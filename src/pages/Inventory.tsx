import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Filter, Search, Edit, Trash2, X, PackageOpen, LayoutGrid, Eye, Printer, MapPin, ScanLine } from 'lucide-react';
import { useAppData, InventoryItem } from '@/src/context/AppDataContext';
import Barcode from 'react-barcode';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

export default function Inventory() {
  const { inventory, categories, addInventoryItem, updateInventoryItem, deleteInventoryItem, addCategory, removeCategory } = useAppData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [printingBarcodeItem, setPrintingBarcodeItem] = useState<InventoryItem | null>(null);
  
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    brand: string;
    compatibleCars: string;
    category: string;
    storageLocation: string;
    quantity: number | string;
    purchasePrice: number | string;
    sellPrice: number | string;
    date: string;
  }>({
    code: '', name: '', brand: '', compatibleCars: '', category: '', storageLocation: '', quantity: '', purchasePrice: '', sellPrice: '', date: new Date().toISOString().split('T')[0]
  });

  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    if (printingBarcodeItem) {
      const handleAfterPrint = () => {
        setPrintingBarcodeItem(null);
      };
      window.addEventListener('afterprint', handleAfterPrint);
      
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      
      return () => {
        window.removeEventListener('afterprint', handleAfterPrint);
        clearTimeout(timer);
      };
    }
  }, [printingBarcodeItem]);

  const filteredInventory = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const hasCategoryFilter = selectedCategory !== 'الكل';

    // Always sort by createdAt descending (newest added first at the top)
    const baseList = [...inventory].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (!term && !hasCategoryFilter) return baseList;

    return baseList.filter(item => {
      if (hasCategoryFilter && item.category !== selectedCategory) {
        return false;
      }
      if (!term) return true;

      return (
        (item.name && item.name.toLowerCase().includes(term)) ||
        (item.code && item.code.toLowerCase().includes(term)) ||
        (item.brand && item.brand.toLowerCase().includes(term)) ||
        (item.compatibleCars && item.compatibleCars.toLowerCase().includes(term)) ||
        (item.storageLocation && item.storageLocation.toLowerCase().includes(term))
      );
    });
  }, [inventory, searchTerm, selectedCategory]);

  const generateAutoCode = () => {
    return Math.floor(Math.random() * 899999999999 + 100000000000).toString();
  };

  const openAdd = () => {
    setEditingItem(null);
    setFormData({
      code: generateAutoCode(),
      name: '',
      brand: '',
      compatibleCars: '',
      category: categories[0] || '',
      storageLocation: '',
      quantity: '',
      purchasePrice: '',
      sellPrice: '', date: new Date().toISOString().split('T')[0]
    });
    setError('');
    setIsModalOpen(true);
  };


  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      ...item,
      quantity: item.quantity === 0 ? '' : item.quantity,
      purchasePrice: item.purchasePrice === 0 ? '' : item.purchasePrice,
      sellPrice: item.sellPrice === 0 ? '' : item.sellPrice, date: item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setError('');
    setIsModalOpen(true);
  };

  const [error, setError] = useState<string>('');

  const handleConfirmDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteInventoryItem(itemToDelete.id);
      setItemToDelete(null);
      if (viewingItem?.id === itemToDelete.id) {
        setViewingItem(null);
      }
    } catch (err: any) {
      console.error(err);
      alert('حدث خطأ أثناء حذف الصنف: ' + (err?.message || String(err)));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await removeCategory(categoryToDelete);
      setCategoryToDelete(null);
      if (selectedCategory === categoryToDelete) {
        setSelectedCategory('الكل');
      }
    } catch (err: any) {
      console.error(err);
      alert('حدث خطأ أثناء حذف الفئة: ' + (err?.message || String(err)));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const name = formData.name?.trim();
    if (!name) {
      setError('الرجاء إدخال اسم القطعة');
      return;
    }

    const code = formData.code?.trim() || generateAutoCode();
    const category = formData.category?.trim() || categories[0] || 'عام';

    const itemData = {
      ...formData,
      name,
      code,
      category,
      quantity: Number(formData.quantity) || 0,
      purchasePrice: Number(formData.purchasePrice) || 0,
      sellPrice: Number(formData.sellPrice) || 0,
      createdAt: formData.date ? new Date(formData.date).getTime() : Date.now(),
    };

    try {
      if (editingItem) {
        updateInventoryItem(editingItem.id, itemData);
      } else {
        addInventoryItem(itemData);
      }
      setIsModalOpen(false);
      setEditingItem(null);
      setError('');
    } catch (err: any) {
      console.error(err);
      setIsModalOpen(false);
    }
  };

  const handleAddCategory = () => {
    if (newCatName.trim()) {
      addCategory(newCatName.trim());
      setNewCatName('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Bar */}
      <div className="flex items-center justify-between gap-2 bg-white p-2.5 sm:p-3.5 rounded-xl shadow-xs border border-[#E2E8F0] overflow-hidden">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-0.5 max-w-[calc(100%-115px)] sm:max-w-none">
          <button
            onClick={() => setSelectedCategory('الكل')}
            className={`px-3.5 sm:px-4 py-1.5 rounded-full font-bold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap ${selectedCategory === 'الكل' ? 'bg-[#1E293B] text-white shadow-xs' : 'bg-[#F8FAFC] text-[#475569] hover:bg-[#F1F5F9] border border-[#E2E8F0]'}`}
          >
            الكل
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 sm:px-4 py-1.5 rounded-full font-bold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap ${selectedCategory === cat ? 'bg-[#1E293B] text-white shadow-xs' : 'bg-[#F8FAFC] text-[#475569] hover:bg-[#F1F5F9] border border-[#E2E8F0]'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <button 
          onClick={() => setIsCategoryModalOpen(true)}
          className="shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full font-bold text-xs sm:text-sm text-[#4F46E5] bg-[#EEF2FF] hover:bg-[#E0E7FF] transition-colors cursor-pointer border border-[#C7D2FE] whitespace-nowrap"
        >
          <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>إدارة الفئات</span>
        </button>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <button 
          onClick={openAdd}
          className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-[#2180B2] px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-[#1A6B94] cursor-pointer shadow-xs border-none"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          إضافة منتج جديد
        </button>

        {/* Full-space Professional Search Field */}
        <div className="relative flex-1 w-full bg-white rounded-xl shadow-xs border border-[#CBD5E1] focus-within:border-[#2180B2] focus-within:ring-2 focus-within:ring-[#2180B2]/20 transition-all flex items-center px-3 py-1.5 sm:py-2 gap-2">
          <Search className="h-4 w-4 text-[#94A3B8] shrink-0" />
          
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none py-1 text-xs sm:text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none min-w-0"
            placeholder="بحث بالاسم، الباركود، الماركة، أو مكان التخزين..."
          />

          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 rounded-full text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              title="مسح البحث"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Barcode Scanner Ready Status Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#F0FDF4] text-[#16A34A] rounded-lg border border-[#BBF7D0] text-[11px] font-bold whitespace-nowrap shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
            <span>قارئ الباركود مستعد</span>
          </div>

          <div 
            className="flex sm:hidden items-center gap-1 px-2 py-1 bg-[#F0FDF4] text-[#16A34A] rounded-lg border border-[#BBF7D0] text-[10px] font-bold whitespace-nowrap shrink-0"
            title="قارئ الباركود مستعد وجاهز للاستخدام"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse"></span>
            <ScanLine className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Main Table & Mobile Cards */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col relative pt-4">
        
        <div className="flex justify-between items-center px-4 sm:px-6 mb-4">
           <div className="flex items-center gap-2 text-[#1E293B]">
             <PackageOpen className="w-5 h-5 sm:w-6 sm:h-6 text-[#2180B2]" />
             <h3 className="font-bold text-base sm:text-lg">سجل المنتجات الفعلي بالمستودع</h3>
           </div>
           <div className="px-3 py-1 sm:px-4 sm:py-1.5 bg-[#F1F5F9] rounded-full text-xs sm:text-sm font-bold text-[#475569]">
             متاح: {filteredInventory.length} قطعة
           </div>
        </div>

        {/* Mobile View: Product Cards */}
        <div className="block md:hidden px-3 pb-4 space-y-3">
          {filteredInventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#94A3B8] text-center">
              <PackageOpen className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-bold">لا توجد منتجات مطابقة للبحث</p>
            </div>
          ) : (
            filteredInventory.map((item, idx) => (
              <div 
                key={item.id ? `inventory-${item.id}` : `inventory-idx-${idx}`}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-3 transition-shadow hover:shadow-sm"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {item.code}
                      </span>
                      <span className="px-2 py-0.5 bg-[#EEF2FF] text-[#4F46E5] text-[11px] font-bold rounded border border-[#C7D2FE]">
                        {item.category}
                      </span>
                    </div>
                    <h4 className="font-bold text-[#1E293B] text-base mt-1.5 leading-snug break-words">
                      {item.name}
                    </h4>
                    {item.brand && (
                      <p className="text-xs text-[#64748B] mt-0.5">الماركة: {item.brand}</p>
                    )}
                    {item.compatibleCars && (
                      <p className="text-xs text-[#64748B] mt-0.5">التوافق: {item.compatibleCars}</p>
                    )}
                  </div>

                  <div className="text-left shrink-0">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-black ${item.quantity > 5 ? 'bg-emerald-100 text-emerald-800' : item.quantity > 0 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                      {item.quantity} قطعة
                    </span>
                    {item.storageLocation && (
                      <div className="flex items-center gap-1 text-[11px] text-[#64748B] mt-1 justify-end font-medium">
                        <MapPin className="w-3 h-3 text-[#94A3B8]" />
                        <span>{item.storageLocation}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price tags */}
                <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-[#E2E8F0] text-xs">
                  <div>
                    <span className="text-[#94A3B8] block text-[10px] font-medium">سعر الشراء:</span>
                    <span className="font-bold text-slate-700 font-mono">{item.purchasePrice} ج.م</span>
                  </div>
                  <div className="text-left">
                    <span className="text-[#16A34A] block text-[10px] font-medium">سعر البيع:</span>
                    <span className="font-bold text-[#16A34A] font-mono text-sm">{item.sellPrice} ج.م</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-[#E2E8F0]/70">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setViewingItem(item)}
                      className="px-3 py-1.5 bg-white border border-[#E2E8F0] text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#2180B2]" />
                      <span>عرض</span>
                    </button>
                    <button 
                      onClick={() => setPrintingBarcodeItem(item)}
                      className="px-3 py-1.5 bg-white border border-[#E2E8F0] text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#2180B2]" />
                      <span>باركود</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openEdit(item)}
                      className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-[#2180B2] rounded-lg text-xs font-bold hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>
                    <button 
                      onClick={() => setItemToDelete(item)}
                      className="p-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Desktop View: Full Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="text-[#475569] border-y border-[#E2E8F0] bg-white text-xs font-bold whitespace-nowrap tracking-wider">
              <tr>
                <th className="px-6 py-4">الباركود</th>
                <th className="px-6 py-4">اسم القطعة<br/>والماركة</th>
                <th className="px-6 py-4">السيارات<br/>المتوافقة</th>
                <th className="px-6 py-4 text-center">التصنيف</th>
                <th className="px-6 py-4 text-center">مكان<br/>التخزين</th>
                <th className="px-6 py-4 text-center">الكمية<br/>الحالية</th>
                <th className="px-6 py-4">شراء / بيع</th>
                <th className="px-6 py-4 text-center">خيارات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                      <PackageOpen className="w-12 h-12 mb-3 opacity-20" />
                      <p className="font-bold">لا توجد منتجات مطابقة للبحث</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item, idx) => (
                  <tr key={item.id ? `inventory-${item.id}` : `inventory-idx-${idx}`} className="hover:bg-[#F8FAFC]">
                    <td className="px-6 py-4 font-mono font-bold text-[#1E293B]">{item.code}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#1E293B] text-base">{item.name}</p>
                      <p className="text-sm text-[#94A3B8]">{item.brand}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#475569]">{item.compatibleCars}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-[#EEF2FF] text-[#4F46E5] text-xs font-bold rounded-lg border border-[#C7D2FE]">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <MapPin className="w-4 h-4 mb-1" />
                        <span className="text-xs font-bold">{item.storageLocation || 'غير محدد'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xl font-bold ${item.quantity > 0 ? 'text-[#1E293B]' : 'text-[#DC2626]'}`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-xs whitespace-nowrap">
                       <p className="text-[#94A3B8] flex justify-between gap-4"><span>شراء:</span> <span>{item.purchasePrice} <span className="text-[10px]">ج.م</span></span></p>
                       <p className="text-[#16A34A] text-sm mt-1 flex justify-between gap-4"><span>بيع:</span> <span>{item.sellPrice} <span className="text-[10px]">ج.م</span></span></p>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="flex justify-center items-center gap-3 text-[#94A3B8]">
                         <button onClick={() => setViewingItem(item)} className="hover:text-[#2180B2] transition-colors cursor-pointer bg-transparent border-none" title="عرض"><Eye className="w-5 h-5"/></button>
                         <button onClick={() => setPrintingBarcodeItem(item)} className="hover:text-[#2180B2] transition-colors cursor-pointer bg-transparent border-none" title="طباعة باركود"><Printer className="w-5 h-5"/></button>
                         <button onClick={() => openEdit(item)} className="hover:text-[#2180B2] transition-colors cursor-pointer bg-transparent border-none" title="تعديل"><Edit className="w-5 h-5"/></button>
                         <button onClick={() => setItemToDelete(item)} className="hover:text-[#DC2626] transition-colors cursor-pointer bg-transparent border-none" title="حذف الصنف"><Trash2 className="w-5 h-5"/></button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A2332]/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
              <h3 className="text-lg font-bold text-[#1E293B] flex items-center gap-2">
                <PackageOpen className="w-5 h-5 text-[#2180B2]" />
                {editingItem ? 'تعديل الصنف' : 'إضافة منتج جديد للمستودع'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#94A3B8] hover:text-[#DC2626] transition-colors cursor-pointer bg-transparent border-none">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-bold border border-red-200">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-[#475569]">رمز الباركود / الكود</label>
                  <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#2180B2] focus:outline-none bg-[#F8FAFC]" dir="ltr" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-[#475569]">التاريخ</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#2180B2] focus:outline-none bg-[#F8FAFC]" dir="ltr" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-[#475569]">الكمية الحالية</label>
                  <input 
                    type="number" 
                    min="0" 
                    placeholder="0"
                    value={formData.quantity} 
                    onChange={e => setFormData({...formData, quantity: e.target.value === '' ? '' : Number(e.target.value)})} 
                    className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#2180B2] focus:outline-none" 
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-sm font-bold text-[#475569]">اسم القطعة</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#2180B2] focus:outline-none" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-bold text-[#475569]">الماركة</label>
                  <input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#2180B2] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-[#475569]">السيارات المتوافقة</label>
                  <input type="text" value={formData.compatibleCars} onChange={e => setFormData({...formData, compatibleCars: e.target.value})} className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#2180B2] focus:outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-[#475569]">التصنيف (الفئة)</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#2180B2] focus:outline-none bg-white">
                    <option key="default-empty-cat" value="">-- اختر الفئة --</option>
                    {categories.map((cat, idx) => (
                      <option key={cat ? `cat-${cat}-${idx}` : `cat-idx-${idx}`} value={cat || ''}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-[#475569]">مكان التخزين (الرف)</label>
                  <input type="text" value={formData.storageLocation} onChange={e => setFormData({...formData, storageLocation: e.target.value})} className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#2180B2] focus:outline-none" />
                </div>

                <div className="space-y-1 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  <label className="text-sm font-bold text-[#475569]">سعر الشراء</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input 
                      type="number" 
                      min="0" 
                      placeholder="0"
                      value={formData.purchasePrice} 
                      onChange={e => setFormData({...formData, purchasePrice: e.target.value === '' ? '' : Number(e.target.value)})} 
                      className="w-full border border-[#E2E8F0] rounded-lg px-3 py-1.5 focus:outline-none" 
                    />
                    <span className="text-xs font-bold text-[#94A3B8]">ج.م</span>
                  </div>
                </div>
                <div className="space-y-1 p-3 bg-[#F0FDF4] rounded-xl border border-[#BBF7D0]">
                  <label className="text-sm font-bold text-[#16A34A]">سعر البيع</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input 
                      type="number" 
                      min="0" 
                      placeholder="0"
                      value={formData.sellPrice} 
                      onChange={e => setFormData({...formData, sellPrice: e.target.value === '' ? '' : Number(e.target.value)})} 
                      className="w-full border border-[#E2E8F0] rounded-lg px-3 py-1.5 focus:outline-none font-bold" 
                    />
                    <span className="text-xs font-bold text-[#16A34A]">ج.م</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-bold text-[#475569] bg-[#F1F5F9] rounded-xl hover:bg-[#E2E8F0] cursor-pointer border-none transition-colors">
                  إلغاء الأمر
                </button>
                <button type="submit" className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-[#2180B2] rounded-xl hover:bg-[#1A6B94] cursor-pointer border-none shadow-sm transition-colors">
                  <Plus className="w-4 h-4"/>
                  {editingItem ? 'حفظ التعديلات' : 'إضافة إلى المستودع'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A2332]/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
              <h3 className="text-lg font-bold text-[#1E293B]">إدارة الفئات</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-[#94A3B8] hover:text-[#DC2626] transition-colors cursor-pointer bg-transparent border-none">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   value={newCatName} 
                   onChange={e => setNewCatName(e.target.value)} 
                   placeholder="اسم الفئة الجديدة..."
                   className="flex-1 border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2180B2]"
                   onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory(); }}
                 />
                 <button 
                   onClick={handleAddCategory}
                   className="px-4 py-2 bg-[#2180B2] text-white rounded-lg font-bold text-sm cursor-pointer border-none"
                 >
                   إضافة
                 </button>
               </div>
               
               <div className="space-y-2 mt-4 max-h-60 overflow-y-auto">
                 {categories.map(cat => (
                   <div key={cat} className="flex justify-between items-center px-4 py-2 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                     <span className="font-bold text-[#1E293B] text-sm">{cat}</span>
                     <button 
                       onClick={() => setCategoryToDelete(cat)}
                       className="p-1 text-[#DC2626] hover:bg-[#FEF2F2] rounded cursor-pointer border-none bg-transparent"
                       title="حذف الفئة"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                 ))}
                 {categories.length === 0 && (
                   <p className="text-center text-[#94A3B8] text-sm mt-4">لا توجد فئات</p>
                 )}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Viewing Item Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
              <h3 className="text-lg font-bold text-[#1E293B] flex items-center gap-2">
                <PackageOpen className="w-5 h-5 text-[#2180B2]" />
                تفاصيل المنتج
              </h3>
              <button onClick={() => setViewingItem(null)} className="text-[#94A3B8] hover:text-[#DC2626] transition-colors cursor-pointer bg-transparent border-none">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex flex-col items-center justify-center p-4 !bg-white rounded-xl border border-[#E2E8F0] shadow-inner overflow-hidden">
                 <Barcode value={viewingItem.code} width={1.8} height={60} displayValue={true} />
              </div>
              
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                 <div>
                   <p className="text-[#94A3B8] font-bold mb-1">اسم القطعة</p>
                   <p className="font-bold text-[#1E293B]">{viewingItem.name}</p>
                 </div>
                 <div>
                   <p className="text-[#94A3B8] font-bold mb-1">الماركة</p>
                   <p className="font-bold text-[#1E293B]">{viewingItem.brand || '-'}</p>
                 </div>
                 <div>
                   <p className="text-[#94A3B8] font-bold mb-1">السيارات المتوافقة</p>
                   <p className="font-bold text-[#1E293B]">{viewingItem.compatibleCars || '-'}</p>
                 </div>
                 <div>
                   <p className="text-[#94A3B8] font-bold mb-1">التصنيف</p>
                   <p className="font-bold text-[#1E293B]">{viewingItem.category}</p>
                 </div>
                 <div>
                   <p className="text-[#94A3B8] font-bold mb-1">مكان التخزين</p>
                   <p className="font-bold text-[#1E293B]">{viewingItem.storageLocation || '-'}</p>
                 </div>
                 <div>
                   <p className="text-[#94A3B8] font-bold mb-1">الكمية الحالية</p>
                   <p className={"font-bold " + (viewingItem.quantity > 0 ? "text-[#16A34A]" : "text-[#DC2626]")}>{viewingItem.quantity} قطعة</p>
                 </div>
                 <div className="p-3 bg-[#EEF2FF] rounded-lg border border-[#E0E7FF]">
                   <p className="text-[#4F46E5] font-bold mb-1 text-xs">سعر الشراء</p>
                   <p className="font-bold text-[#1E293B] font-mono text-base">{viewingItem.purchasePrice} ج.م</p>
                 </div>
                 <div className="p-3 bg-[#F0FDF4] rounded-lg border border-[#BBF7D0]">
                   <p className="text-[#16A34A] font-bold mb-1 text-xs">سعر البيع</p>
                   <p className="font-bold text-[#16A34A] font-mono text-base">{viewingItem.sellPrice} ج.م</p>
                 </div>
              </div>
              
              <div className="pt-2 flex justify-center gap-3">
                 <button onClick={() => { setViewingItem(null); setPrintingBarcodeItem(viewingItem); }} className="flex items-center gap-2 px-6 py-2.5 bg-[#F1F5F9] text-[#475569] rounded-xl hover:bg-[#E2E8F0] font-bold text-sm transition-colors border-none cursor-pointer">
                   <Printer className="w-4 h-4" /> طباعة الباركود
                 </button>
                 <button onClick={() => { setViewingItem(null); openEdit(viewingItem); }} className="flex items-center gap-2 px-6 py-2.5 bg-[#2180B2] text-white rounded-xl hover:bg-[#1A6B94] font-bold text-sm transition-colors border-none cursor-pointer">
                   <Edit className="w-4 h-4" /> تعديل المنتج
                 </button>
                 <button onClick={() => { setItemToDelete(viewingItem); }} className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-sm transition-colors border border-red-200 cursor-pointer">
                   <Trash2 className="w-4 h-4" /> حذف
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!itemToDelete}
        onClose={() => !isDeleting && setItemToDelete(null)}
        onConfirm={handleConfirmDeleteItem}
        isDeleting={isDeleting}
        title="تأكيد حذف الصنف من المخزن"
        message="هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً من المستودع وقاعدة البيانات؟"
        itemName={itemToDelete?.name}
        itemDetails={
          itemToDelete ? (
            <div className="grid grid-cols-2 gap-2 mt-1 font-mono text-xs">
              <div>الكود: {itemToDelete.code}</div>
              <div>الكمية: {itemToDelete.quantity} قطعة</div>
              <div>سعر البيع: {itemToDelete.sellPrice} ج.م</div>
              <div>التصنيف: {itemToDelete.category}</div>
            </div>
          ) : undefined
        }
        warningNote="تنبيه: سيتم مسح الصنف نهائياً ولن يظهر في حركات البيع أو قوائم الجرد القادمة."
        confirmText="نعم، حذف الصنف"
      />

      {/* Category Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!categoryToDelete}
        onClose={() => !isDeleting && setCategoryToDelete(null)}
        onConfirm={handleConfirmDeleteCategory}
        isDeleting={isDeleting}
        title="تأكيد حذف الفئة / التصنيف"
        message={`هل أنت متأكد من رغبتك في حذف تصنيف "${categoryToDelete}"؟`}
        itemName={categoryToDelete || ''}
        warningNote="ملاحظة: المنتجات الحالية المسجلة تحت هذا التصنيف ستظل موجودة ولكن سيتم إزالة هذا التصنيف من الفلاتر."
        confirmText="نعم، حذف الفئة"
      />

      {/* Print Barcode View */}
      {printingBarcodeItem && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/80 backdrop-blur-sm flex flex-col print:bg-transparent print:backdrop-blur-none print:static print:inset-auto print:overflow-visible">
           <div className="p-4 flex gap-4 justify-between items-center border-b border-[#E2E8F0] dark:border-[#263552] print:hidden bg-white dark:bg-[#141E33] shadow-sm shrink-0">
             <div className="flex items-center gap-2">
               <ScanLine className="w-5 h-5 text-[#2180B2]" />
               <h3 className="font-bold text-base text-[#1E293B]">معاينة ملصق الباركود للطباعة</h3>
             </div>
             <div className="flex items-center gap-3">
               <button 
                 onClick={() => { setTimeout(() => window.print(), 100); }}
                 className="px-6 py-2 bg-[#2180B2] text-white rounded-xl font-bold hover:bg-[#1A6B94] transition-colors border-none cursor-pointer flex items-center gap-2 shadow-sm"
               >
                 <Printer className="w-4 h-4" />
                 طباعة الملصق الآن
               </button>
               <button 
                 onClick={() => setPrintingBarcodeItem(null)}
                 className="px-5 py-2 bg-[#F1F5F9] dark:bg-[#1E2D4A] text-[#475569] dark:text-[#E2E8F0] rounded-xl font-bold hover:bg-[#E2E8F0] transition-colors border-none cursor-pointer"
               >
                 إغلاق
               </button>
             </div>
           </div>
           
           <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-[#0B132B]/40 print:p-0 print:bg-transparent">
             <div className="p-6 rounded-3xl shadow-2xl bg-transparent print:shadow-none print:border-none print:p-0 flex flex-col items-center justify-center">
               <div 
                 className="barcode-sticker-card text-center p-6 border-2 border-black rounded-2xl w-80 shadow-2xl print:shadow-none print:border-[2px] print:border-black"
                 style={{ backgroundColor: '#ffffff', color: '#000000' }}
               >
                 <h2 className="text-xl font-bold mb-1" style={{ color: '#000000' }}>{printingBarcodeItem.name}</h2>
                 <p className="font-semibold text-xs mb-3" style={{ color: '#475569' }}>{printingBarcodeItem.brand || printingBarcodeItem.category}</p>
                 <div className="flex justify-center my-3 bg-white p-2 rounded-lg" style={{ backgroundColor: '#ffffff' }}>
                   <Barcode value={printingBarcodeItem.code} width={2.2} height={70} displayValue={true} />
                 </div>
                 <p className="mt-2 text-2xl font-black font-mono" style={{ color: '#000000' }}>{printingBarcodeItem.sellPrice} ج.م</p>
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}

