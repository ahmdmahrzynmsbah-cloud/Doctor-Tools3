import React, { useState, useMemo } from 'react';
import { Plus, Search, Users as UsersIcon, X, History, User, Banknote, Edit2, Trash2, Printer, MessageCircle, Share2, Loader2, Calendar } from 'lucide-react';
import { useAppData, Customer } from '@/src/context/AppDataContext';
import { captureElementToCanvas } from '../utils/canvasCapture';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

export default function Customers() {
  const { customers, invoices, inventory, addCustomer, updateCustomer, deleteCustomer, recordCustomerPayment, businessProfile } = useAppData();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  const [newCustomer, setNewCustomer] = useState<{
    name: string;
    phone: string;
    balance: number | string;
    date: string;
  }>({
    name: '', phone: '', balance: '', date: new Date().toISOString().split('T')[0]
  });

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const baseList = [...customers].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (!term) return baseList;
    return baseList.filter(c => 
      (c.name && c.name.toLowerCase().includes(term)) || 
      (c.phone && c.phone.includes(term)) ||
      (c.serialNumber && c.serialNumber.toLowerCase().includes(term))
    );
  }, [customers, searchTerm]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: newCustomer.name,
        phone: newCustomer.phone,
        balance: Number(newCustomer.balance) || 0,
        createdAt: newCustomer.date ? new Date(newCustomer.date).getTime() : Date.now(),
      };
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, payload);
      } else {
        await addCustomer(payload);
      }
      closeModal();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ: ' + String(err));
    }
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingCustomer(null);
    setNewCustomer({ name: '', phone: '', balance: '', date: new Date().toISOString().split('T')[0] });
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setNewCustomer({
      name: customer.name,
      phone: customer.phone,
      balance: customer.balance === 0 ? '' : customer.balance,
      date: customer.createdAt ? new Date(customer.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setIsAddModalOpen(true);
  };

  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCustomer(customerToDelete.id);
      setCustomerToDelete(null);
    } catch (err: any) {
      console.error(err);
      alert('حدث خطأ أثناء حذف العميل: ' + (err?.message || String(err)));
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentCustomer && paymentAmount) {
      recordCustomerPayment(paymentCustomer.id, Number(paymentAmount), paymentDate);
      setPaymentCustomer(null);
      setPaymentAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
    }
  };

  const getCustomerTransactions = (customerId: string) => {
    return invoices.filter(inv => inv.customerId === customerId);
  };

  const ledgerEntries = useMemo(() => {
    if (!selectedCustomer) return [];

    const transactions = [...getCustomerTransactions(selectedCustomer.id)].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let netChange = transactions.reduce((acc, inv) => acc + (inv.total - inv.paid), 0);
    const initialBalance = selectedCustomer.balance - netChange;

    let currentBalance = initialBalance;
    const entries = [];

    // Formatter helper for customer registration/creation date
    const getFormattedDate = (dateVal: any) => {
      if (!dateVal) return '-';
      try {
        if (typeof dateVal === 'object' && dateVal.seconds) {
          return new Date(dateVal.seconds * 1000).toLocaleDateString('ar-EG');
        }
        if (typeof dateVal.toDate === 'function') {
          return dateVal.toDate().toLocaleDateString('ar-EG');
        }
        return new Date(dateVal).toLocaleDateString('ar-EG');
      } catch (e) {
        return '-';
      }
    };

    if (initialBalance !== 0 || transactions.length === 0) {
      entries.push({
        id: 'initial',
        date: selectedCustomer.createdAt ? getFormattedDate(selectedCustomer.createdAt) : '-',
        description: 'رصيد مرحل (افتتاحي)',
        debit: initialBalance > 0 ? initialBalance : 0,
        credit: initialBalance < 0 ? Math.abs(initialBalance) : 0,
        balance: currentBalance,
        isInitial: true
      });
    }

    transactions.forEach(inv => {
      const isPayment = inv.items.length === 0;
      const debit = inv.total;
      const credit = inv.paid;
      
      currentBalance += (debit - credit);

      let invoiceDetails = '';
      if (!isPayment && inv.items.length > 0) {
        const itemNames = inv.items.map(item => {
          const inventoryItem = inventory.find(i => i.id === item.itemId);
          return inventoryItem ? `${inventoryItem.name} (${item.quantity})` : `صنف محذوف (${item.quantity})`;
        });
        invoiceDetails = ` - أصناف: ${itemNames.join('، ')}`;
      }

      entries.push({
        id: inv.id,
        date: new Date(inv.date).toLocaleDateString('ar-EG'),
        description: isPayment ? `دفعة نقدية مسددة` : `فاتورة مبيعات SA-${inv.invoiceNumber}${invoiceDetails}`,
        debit: debit,
        credit: credit,
        balance: currentBalance,
        isInitial: false
      });
    });

    return entries;
  }, [selectedCustomer, invoices, inventory]);

  const handlePrintStatement = () => {
    window.print();
  };

  const handleShareWhatsApp = async () => {
    let waWindow = (window as any)._waWindow;
    (window as any)._waWindow = null;
    
    if (!selectedCustomer) {
      if (waWindow) waWindow.close();
      return;
    }
    
    // Check if phone number is available
    if (!selectedCustomer.phone) {
      if (waWindow) waWindow.close();
      alert("العميل ليس لديه رقم هاتف مسجل للمراسلة عبر واتساب.");
      return;
    }

    // 1. Open popup immediately to preserve user gesture
    if (!waWindow) {
        waWindow = window.open('about:blank', '_blank');
        if (waWindow) {
          waWindow.document.write('<html dir="rtl"><body style="font-family: system-ui; text-align: center; padding-top: 50px;"><h3>جاري تجهيز كشف الحساب كصورة لفتح واتساب...</h3><p>برجاء الانتظار لثواني معدودة</p></body></html>');
        }
    }

    try {
      setIsGeneratingImage(true);
      const element = document.getElementById('statement-printable-area');
      if (!element) {
        if (waWindow) waWindow.close();
        setIsGeneratingImage(false);
        return;
      }
      
      // Temporarily change styles to capture the full scrolling content
      const originalOverflow = element.style.overflow;
      const originalHeight = element.style.height;
      const originalMaxHeight = element.style.maxHeight;
      const parent = element.closest('.max-h-\\[90vh\\]') as HTMLElement;
      
      let parentOriginalMaxHeight = '';
      let parentOriginalOverflow = '';

      if (parent) {
        parentOriginalMaxHeight = parent.style.maxHeight;
        parentOriginalOverflow = parent.style.overflow;
        parent.style.maxHeight = 'none';
        parent.style.overflow = 'visible';
      }

      if (parent) {
        parent.style.maxHeight = parentOriginalMaxHeight;
        parent.style.overflow = parentOriginalOverflow;
      }

      const canvas = await captureElementToCanvas(element);
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          if (waWindow) waWindow.close();
          setIsGeneratingImage(false);
          return;
        }
        
        try {
          const textMsg = `مرحباً بك،\nمرفق كشف حساب تفصيلي خاص بك.`;
          
          let phone = selectedCustomer.phone;
          if (phone.startsWith('0')) {
              phone = '2' + phone.substring(1);
          } else if (!phone.startsWith('2')) {
              phone = '2' + phone;
          }

          const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(textMsg)}`;

          // Try clipboard first
          let copied = false;
          if (navigator.clipboard) {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
              ]);
              copied = true;
            } catch (err) {
              console.log('Clipboard write failed, falling back to download');
            }
          }

          // Always download fallback
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `كشف_حساب_${selectedCustomer.name}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 100);
          
          if (waWindow) {
            waWindow.location.href = waUrl;
          } else {
            window.open(waUrl, '_blank');
          }

          // Alert after everything is triggered
          if (copied) {
              alert('تم نسخ صورة الكشف وتحميلها\n\n- سيتم فتح الواتساب الآن.\n- يمكنك عمل "لصق" (Paste) لإرسال الصورة للعميل مباشرةً.');
          } else {
              alert('تم تحميل صورة الكشف\n\n- سيتم فتح الواتساب الآن.\n- يمكنك إرفاق الصورة المحملة داخل المحادثة للعميل.');
          }
          
        } catch (error) {
          console.error("Error sharing:", error);
          if (waWindow) waWindow.close();
        } finally {
          setIsGeneratingImage(false);
        }
      }, 'image/png');
    } catch (err) {
      console.error(err);
      if (waWindow) waWindow.close();
      setIsGeneratingImage(false);
    }
  };

  return (
    <>
    <div className={`space-y-6 ${selectedCustomer ? 'print:hidden' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1E293B]">حسابات العملاء</h2>
          <p className="mt-1 text-sm text-[#475569]">إدارة بيانات العملاء والتفاصيل المالية وسجل المعاملات</p>
        </div>
        <button 
          onClick={() => {
            setEditingCustomer(null);
            setNewCustomer({ name: '', phone: '', balance: '', date: new Date().toISOString().split('T')[0] });
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          إضافة عميل
        </button>
      </div>

      <div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col">
          <div className="p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:max-w-md">
              <div className="absolute inset-y-0 right-3 flex items-center pr-1 pointer-events-none text-[#94A3B8]">
                <Search className="h-4 w-4" aria-hidden="true" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full bg-[#F1F5F9] border-none rounded-lg pr-10 pl-4 py-2 text-sm focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                placeholder="بحث بالرقم المسلسل للاستعلام، الاسم، أو الهاتف..."
              />
            </div>
          </div>
          
          {/* Mobile View: Customer Cards */}
          <div className="block md:hidden px-3 py-3 space-y-3">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-[#94A3B8]">
                لا يوجد عملاء مطابقين للبحث
              </div>
            ) : (
              filteredCustomers.map((customer, idx) => (
                <div 
                  key={customer.id ? `customer-${customer.id}` : `customer-idx-${idx}`} 
                  className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-3 shadow-xs"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-[#E2E8F0] flex items-center justify-center text-[#475569] shrink-0 font-bold">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-[#1E293B] text-base leading-tight">
                            {customer.name}
                          </h4>
                          {customer.serialNumber && (
                            <span className="font-mono text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              #{customer.serialNumber}
                            </span>
                          )}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-2 mt-1">
                            <a 
                              href={`tel:${customer.phone}`} 
                              className="text-xs font-mono font-medium text-[#2563EB] hover:underline"
                              dir="ltr"
                            >
                              {customer.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-left">
                      <span className="block text-[10px] text-slate-500 font-medium">الرصيد المالي</span>
                      <span className={`font-black text-base font-mono ${Number(customer.balance || 0) > 0 ? 'text-[#DC2626]' : Number(customer.balance || 0) < 0 ? 'text-[#16A34A]' : 'text-[#64748B]'}`}>
                        {Number(customer.balance || 0).toLocaleString()} <span className="text-[11px] font-normal">ج.م</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#E2E8F0]/70 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => setSelectedCustomer(customer)}
                        className="px-3 py-1.5 bg-[#EFF6FF] text-[#2563EB] rounded-lg font-bold text-xs hover:bg-[#DBEAFE] transition-colors border border-blue-200 flex items-center gap-1 cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>كشف الحساب</span>
                      </button>

                      {customer.phone && (
                        <a
                          href={`https://wa.me/2${customer.phone.startsWith('0') ? customer.phone.substring(1) : customer.phone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-[#E6F4EA] border border-[#CEEAD6] text-[#137333] rounded-lg hover:bg-[#CEEAD6] transition-colors cursor-pointer flex items-center justify-center"
                          title="مراسلة عبر واتساب"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}

                      {customer.balance > 0 && (
                        <button 
                          onClick={() => {
                            setPaymentCustomer(customer);
                            setPaymentAmount(customer.balance);
                            setPaymentDate(new Date().toISOString().split('T')[0]);
                          }}
                          className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-xs hover:bg-emerald-100 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          <span>سداد</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mr-auto">
                      <button 
                        onClick={() => openEditModal(customer)}
                        className="p-1.5 bg-white border border-[#E2E8F0] text-[#475569] rounded-lg hover:bg-[#F1F5F9] hover:text-[#2563EB] transition-colors cursor-pointer"
                        title="تعديل"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(customer)}
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
            <table className="w-full text-right">
              <thead className="bg-[#F7FAFC] text-xs font-bold text-[#475569] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">رقم العميل</th>
                  <th className="px-6 py-4">اسم العميل</th>
                  <th className="px-6 py-4">رقم الهاتف</th>
                  <th className="px-6 py-4">الرصيد المالي الحالي (ج.م)</th>
                  <th className="px-6 py-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-sm">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[#94A3B8]">
                      لا يوجد عملاء مطابقين للبحث
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer, idx) => (
                    <tr 
                      key={customer.id ? `customer-${customer.id}` : `customer-idx-${idx}`} 
                      className="hover:bg-[#F8FAFC] transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs font-bold text-[#475569]">{customer.serialNumber}</td>
                      <td className="px-6 py-4 font-bold text-[#1E293B]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#E2E8F0] flex items-center justify-center text-[#475569] overflow-hidden">
                            <User className="w-4 h-4" />
                          </div>
                          {customer.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-[#475569]">{customer.phone}</td>
                      <td className="px-6 py-4 font-bold" dir="ltr">
                        <span className={Number(customer.balance || 0) > 0 ? 'text-[#DC2626]' : Number(customer.balance || 0) < 0 ? 'text-[#16A34A]' : 'text-[#64748B]'}>
                          {Number(customer.balance || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomer(customer);
                            }}
                            className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-[#F1F5F9] text-[#475569] rounded-lg font-bold text-xs hover:bg-[#E2E8F0] transition-colors border-none cursor-pointer"
                          >
                            <History className="w-4 h-4" />
                            السجل
                          </button>
                          {customer.phone && (
                            <a
                              href={`https://wa.me/2${customer.phone.startsWith('0') ? customer.phone.substring(1) : customer.phone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center justify-center w-8 h-8 bg-[#E6F4EA] border border-[#CEEAD6] text-[#137333] rounded-lg hover:bg-[#CEEAD6] transition-colors cursor-pointer"
                              title="مراسلة عبر واتساب"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                          {customer.balance > 0 && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setPaymentCustomer(customer);
                                setPaymentAmount(customer.balance);
                                setPaymentDate(new Date().toISOString().split('T')[0]);
                              }}
                              className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-[#EFF6FF] text-[#2563EB] rounded-lg font-bold text-xs hover:bg-[#DBEAFE] transition-colors border-none cursor-pointer"
                            >
                              <Banknote className="w-4 h-4" />
                              سداد 
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(customer);
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 bg-white border border-[#E2E8F0] text-[#475569] rounded-lg hover:bg-[#F1F5F9] hover:text-[#2563EB] transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(customer);
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 bg-white border border-[#E2E8F0] text-[#475569] rounded-lg hover:bg-[#FEE2E2] hover:text-[#DC2626] hover:border-[#FECACA] transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

      {/* Customer Record Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/70 backdrop-blur-sm p-2 sm:p-4 print:p-0 print:bg-transparent print:backdrop-blur-none print:items-start print:block print:static print:inset-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:max-w-none print:w-full print:mx-0 print:h-auto print:shadow-none print:rounded-none border border-[#E2E8F0] print:border-none print:overflow-visible">
            <div className="px-4 sm:px-6 py-3.5 border-b border-[#E2E8F0] flex flex-wrap gap-2 justify-between items-center bg-[#F8FAFC] print:hidden">
              <h3 className="font-bold text-base sm:text-lg text-[#1E293B] flex items-center gap-2">
                <History className="w-5 h-5 text-[#2563EB]" />
                كشف حساب عميل
              </h3>
              <div className="flex items-center gap-2">
                 <button 
                   onClick={handleShareWhatsApp} 
                   disabled={isGeneratingImage || !selectedCustomer.phone}
                   className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-[#16A34A] text-white rounded-xl font-bold text-xs hover:bg-[#15803D] transition-colors border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                 >
                    {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                    <span>مشاركة واتساب</span>
                 </button>
                 <button onClick={handlePrintStatement} className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-[#2563EB] text-white rounded-xl font-bold text-xs hover:bg-[#1D4ED8] transition-colors border-none cursor-pointer shadow-sm">
                    <Printer className="w-4 h-4" />
                    <span>طباعة</span>
                 </button>
                 <button onClick={() => setSelectedCustomer(null)} className="text-[#94A3B8] hover:text-[#DC2626] transition-colors cursor-pointer bg-transparent border-none p-1">
                   <X className="w-6 h-6" />
                 </button>
              </div>
            </div>
            
            <div id="statement-printable-area" className="p-4 sm:p-6 overflow-y-auto space-y-6 print:overflow-visible print:p-2 bg-white">
              <div className="mb-4 pt-2 border-b-2 border-[#E2E8F0] pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm border border-[#E2E8F0]">
                      <img src={businessProfile?.logo || '/logo.png'} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold text-[#1E293B]">{businessProfile?.name || 'اسم الشركة'}</h1>
                      <p className="text-xs sm:text-sm font-bold text-[#475569] mt-0.5" dir="ltr">{businessProfile?.phone || 'رقم التليفون'}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B] mb-1">كشف حساب عميل</h2>
                    <div className="text-xs sm:text-sm font-bold text-[#475569]">
                      <span>تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-[#F1F5F9] p-4 rounded-xl border border-[#E2E8F0] gap-4 print:bg-transparent print:border-none print:p-0 print:items-end print:mb-6">
                <div className="flex items-center gap-3 text-right print:gap-2">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#2563EB] shadow-sm print:hidden flex-shrink-0 min-w-[48px]" dir="ltr">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1E293B] text-base sm:text-lg print:text-xl">اسم العميل: {selectedCustomer.name || 'عميل'}</h3>
                    <p className="text-xs sm:text-sm text-[#475569] font-mono mt-0.5 print:text-[#1E293B]">
                      رقم الهاتف: {selectedCustomer.phone ? selectedCustomer.phone : 'غير مسجل'}
                    </p>
                  </div>
                </div>
                <div className="text-left bg-white px-5 py-3 rounded-xl shadow-sm border border-[#E2E8F0] w-full sm:w-auto print:shadow-none print:px-4">
                  <p className="text-xs text-[#475569] font-bold mb-1 block">الرصيد المالي الحالي</p>
                  <p className={`text-2xl font-black ${Number(selectedCustomer.balance || 0) > 0 ? 'text-[#DC2626]' : Number(selectedCustomer.balance || 0) < 0 ? 'text-[#16A34A]' : 'text-[#1E293B]'} print:text-black font-mono`} dir="ltr">
                    {Math.abs(Number(selectedCustomer.balance || 0)).toLocaleString()} <span className="text-xs text-[#94A3B8] print:text-black">ج.م</span>
                  </p>
                  <p className="text-[11px] text-[#64748B] mt-0.5 text-center font-bold print:text-black">
                    {Number(selectedCustomer.balance || 0) > 0 ? 'مطلوب من العميل' : Number(selectedCustomer.balance || 0) < 0 ? 'رصيد دائن للعميل' : 'حساب خالص غير مدين'}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto print:overflow-visible w-full rounded-xl border border-[#E2E8F0] print:border-none">
                <table className="w-full text-right border-collapse min-w-[620px] print:min-w-0">
                  <thead className="bg-[#F8FAFC]">
                    <tr>
                      <th className="px-3.5 py-3 border-b border-[#E2E8F0] font-bold text-[#475569] text-xs sm:text-sm print:text-black">التاريخ</th>
                      <th className="px-3.5 py-3 border-b border-[#E2E8F0] font-bold text-[#475569] text-xs sm:text-sm print:text-black w-2/5">البيان</th>
                      <th className="px-3.5 py-3 border-b border-[#E2E8F0] font-bold text-[#475569] text-xs sm:text-sm text-center print:text-black">مدين (للمحل)</th>
                      <th className="px-3.5 py-3 border-b border-[#E2E8F0] font-bold text-[#475569] text-xs sm:text-sm text-center print:text-black">دائن (للعميل)</th>
                      <th className="px-3.5 py-3 border-b border-[#E2E8F0] font-bold text-[#475569] text-xs sm:text-sm text-center print:text-black">الرصيد (ج.م)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {ledgerEntries.length > 0 ? (
                      ledgerEntries.map((row, idx) => (
                        <tr key={row.id ? `row-${row.id}-${idx}` : `row-idx-${idx}`} className={row.isInitial ? 'bg-[#F1F5F9] print:bg-gray-100' : 'hover:bg-[#F8FAFC] transition-colors'}>
                          <td className="px-3.5 py-3 text-xs sm:text-sm text-[#475569] font-mono whitespace-nowrap print:text-black">{row.date}</td>
                          <td className="px-3.5 py-3 text-xs sm:text-sm text-[#1E293B] font-bold print:text-black">{row.description}</td>
                          <td className="px-3.5 py-3 text-xs sm:text-sm text-center text-[#DC2626] font-bold print:text-black font-mono" dir="ltr">
                            {row.debit > 0 ? Number(row.debit || 0).toLocaleString() : '-'}
                          </td>
                          <td className="px-3.5 py-3 text-xs sm:text-sm text-center text-[#16A34A] font-bold print:text-black font-mono" dir="ltr">
                            {row.credit > 0 ? Number(row.credit || 0).toLocaleString() : '-'}
                          </td>
                          <td className="px-3.5 py-3 text-xs sm:text-sm text-center font-bold print:text-black font-mono" dir="ltr">
                            <span className={row.balance > 0 ? 'text-[#DC2626] print:text-black' : row.balance < 0 ? 'text-[#16A34A] print:text-black' : 'text-[#64748B] print:text-black'}>
                              {Math.abs(Number(row.balance || 0)).toLocaleString()} {row.balance > 0 ? 'مدين' : row.balance < 0 ? 'دائن' : ''}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-3.5 py-8 text-center text-[#94A3B8] font-bold print:text-black">لا توجد حركات مسجلة للعميل</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end print:hidden">
               <button onClick={() => setSelectedCustomer(null)} className="px-6 py-2 bg-white border border-[#E2E8F0] text-[#1E293B] rounded-xl font-bold hover:bg-[#F1F5F9] transition-colors cursor-pointer text-sm shadow-xs">
                 إغلاق النافذة
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A2332]/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
              <h3 className="font-bold text-lg text-[#1E293B] flex items-center gap-2">
                <Banknote className="w-5 h-5 text-[#2563EB]" />
                سداد دفعة من الحساب
              </h3>
              <button onClick={() => setPaymentCustomer(null)} className="text-[#94A3B8] hover:text-[#DC2626] transition-colors cursor-pointer border-none bg-transparent">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handlePayment} className="p-5 space-y-4">
              <div className="bg-[#EFF6FF] p-3 rounded-lg border border-[#BFDBFE]">
                <p className="text-xs text-[#1D4ED8] font-bold mb-1">العميل: {paymentCustomer.name}</p>
                <p className="text-sm text-[#1E3A8A] font-bold">الرصيد المستحق: <span className="text-xl inline-block mr-1">{Number(paymentCustomer.balance || 0).toLocaleString()}</span> ج.م</p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-[#475569] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#2563EB]" />
                  <span>تاريخ السداد</span>
                </label>
                <input 
                  type="date"
                  required
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm font-bold text-[#1E293B] focus:ring-2 focus:ring-[#2563EB] focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-[#475569]">المبلغ المسدد (ج.م)</label>
                <div className="relative">
                  <input 
                    required 
                    type="number" 
                    min="1"
                    max={paymentCustomer.balance}
                    value={paymentAmount} 
                    onChange={e => setPaymentAmount(Number(e.target.value))} 
                    className="w-full border border-[#E2E8F0] rounded-lg px-4 py-3 text-lg font-bold flex-1 text-left focus:ring-2 focus:ring-[#2563EB] focus:outline-none" 
                    dir="ltr"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] font-bold pointer-events-none">ج.م</span>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setPaymentCustomer(null)} className="px-4 py-2.5 text-sm font-bold text-[#475569] bg-[#F1F5F9] rounded-lg hover:bg-[#E2E8F0] cursor-pointer">
                  إلغاء
                </button>
                <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-[#2563EB] rounded-lg hover:bg-[#1D4ED8] cursor-pointer shadow-sm">
                  تأكيد السداد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A2332]/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#1E293B]">{editingCustomer ? 'تعديل بيانات العميل' : 'تسجيل عميل جديد'}</h3>
              <button 
                onClick={closeModal}
                className="text-[#94A3B8] hover:text-[#DC2626] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddCustomer} className="p-6 overflow-y-auto space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#475569]">اسم العميل</label>
                <input required type="text" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2563EB] focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#475569]">رقم الهاتف (اختياري)</label>
                <input type="tel" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2563EB] focus:outline-none" dir="ltr" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#475569]">التاريخ</label>
                <input type="date" value={newCustomer.date} onChange={e => setNewCustomer({...newCustomer, date: e.target.value})} className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2563EB] focus:outline-none" dir="ltr" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#475569]">الرصيد الإفتتاحي (ج.م)</label>
                <input 
                  type="number" 
                  placeholder="0"
                  value={newCustomer.balance} 
                  onChange={e => setNewCustomer({...newCustomer, balance: e.target.value === '' ? '' : Number(e.target.value)})} 
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2563EB] focus:outline-none" 
                />
                <p className="text-[10px] text-[#94A3B8]">الموجب يعني أن العميل مدين (عليه فلوس)، السالب معناه دائن للورشة.</p>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#E2E8F0] mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-bold text-[#475569] bg-[#F1F5F9] rounded-lg hover:bg-[#E2E8F0] cursor-pointer">
                  إلغاء
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-[#2563EB] rounded-lg hover:bg-[#1D4ED8] cursor-pointer">
                  {editingCustomer ? 'تحديث البيانات' : 'حفظ العميل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!customerToDelete}
        onClose={() => !isDeleting && setCustomerToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        title="تأكيد حذف العميل"
        message="هل أنت متأكد من رغبتك في حذف هذا العميل وسجله نهائياً من قاعدة البيانات؟"
        itemName={customerToDelete?.name}
        itemDetails={
          customerToDelete ? (
            <div className="flex flex-col gap-1 mt-1 text-xs">
              <div>الهاتف: {customerToDelete.phone || 'غير مسجل'}</div>
              <div>الرصيد الحالي: {Number(customerToDelete.balance || 0).toLocaleString()} ج.م</div>
              {customerToDelete.serialNumber && <div>كود العميل: {customerToDelete.serialNumber}</div>}
            </div>
          ) : undefined
        }
        warningNote="تنبيه: سيؤدي الحذف إلى إزالة سجل العميل نهائياً من النظام. لن تتمكن من التراجع عن هذه الخطوة."
        confirmText="نعم، حذف العميل"
      />
    </>
  );
}
