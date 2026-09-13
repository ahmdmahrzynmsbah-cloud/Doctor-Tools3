import React, { useMemo } from 'react';
import { useAppData } from '@/src/context/AppDataContext';
import { Package, FileText, ArrowUpRight, TrendingDown, Wallet, CreditCard, AlertTriangle, ArrowLeft, Database, CheckCircle2, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { inventory, invoices, customers, businessProfile, scanAndRecoverBrowserData, recoveryNotice, dismissRecoveryNotice } = useAppData();

  const customerMap = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach(c => map.set(c.id, c.name));
    return map;
  }, [customers]);

  const { todaySales, todayDebt, todayCash, allTimeDebt, lowStockCount, recentInvoices } = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    let sales = 0;
    let debt = 0;
    let cash = 0;

    for (let i = 0; i < invoices.length; i++) {
      const inv = invoices[i];
      if (inv.date && inv.date.startsWith(todayStr)) {
        sales += inv.total || 0;
        debt += ((inv.total || 0) - (inv.paid || 0));
        cash += inv.paid || 0;
      }
    }
    
    let totalCustomerDebt = 0;
    for (let i = 0; i < customers.length; i++) {
      totalCustomerDebt += customers[i].balance || 0;
    }

    let lowStock = 0;
    for (let i = 0; i < inventory.length; i++) {
      if ((inventory[i].quantity || 0) <= 5) lowStock++;
    }

    const recent = invoices.slice(0, 5);

    return {
      todaySales: sales,
      todayDebt: debt,
      todayCash: cash,
      allTimeDebt: totalCustomerDebt,
      lowStockCount: lowStock,
      recentInvoices: recent
    };
  }, [invoices, customers, inventory]);

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-[#E2E8F0]">
        <div className="text-right mb-6 md:mb-0 w-full md:w-auto">
           <h2 className="text-2xl md:text-3xl font-bold text-[#1E293B] mb-2 flex items-center justify-start gap-2">
              مرحباً بك، admin
           </h2>
           <p className="text-[#475569] text-sm md:text-base">{businessProfile?.description || 'نظام إدارة العيادات والمستلزمات الطبية المتكامل'}</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
           <Link to="/inventory" className="flex-1 md:flex-none justify-center bg-white border border-[#E2E8F0] text-[#1E293B] px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#F8FAFC] transition-colors">
               <Package className="w-5 h-5"/> المستودع
           </Link>
           <Link to="/invoices" className="flex-1 md:flex-none justify-center bg-[#2180B2] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-opacity-90 transition-colors">
               <FileText className="w-5 h-5"/> فاتورة بيع جديدة
           </Link>
        </div>
      </div>

      {/* Recovery Notice if an action was executed */}
      {recoveryNotice && (
        <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl p-4 flex items-center justify-between gap-3 text-[#065F46] text-sm">
          <div className="flex items-center gap-2.5 font-bold">
            <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
            <span>{recoveryNotice}</span>
          </div>
          <button
            onClick={() => dismissRecoveryNotice()}
            className="p-1 text-[#047857] hover:bg-[#D1FAE5] rounded-lg cursor-pointer transition-colors"
            title="إغلاق التنبيه"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Smart Recovery Alert if data is currently 0 */}
      {inventory.length === 0 && invoices.length === 0 && (
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white text-[#2563EB] rounded-xl shadow-xs shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base text-[#1E3A8A]">هل تبحث عن بياناتك السابقة؟</h4>
              <p className="text-xs sm:text-sm text-[#1E40AF] mt-0.5">
                يمكنك فحص ذاكرة المتصفح بنقرة واحدة لاستعادة كافة المنتجات والعملاء والفواتير تلقائياً ومزامنتها سحابياً.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => scanAndRecoverBrowserData()}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#2563EB] text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-[#1D4ED8] transition-colors cursor-pointer text-center shadow-sm"
            >
              فحص واستعادة الآن
            </button>
            <Link
              to="/settings"
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-white border border-[#CBD5E1] text-[#334155] rounded-xl text-xs sm:text-sm font-bold hover:bg-[#F8FAFC] transition-colors text-center"
            >
              مركز النسخ الاحتياطي
            </Link>
          </div>
        </div>
      )}

      {/* Stats Cards Grid - 1-col on mobile, 2-col on sm, 3-col on md/lg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        
        <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center justify-between min-h-[120px] sm:min-h-[140px]">
           <div>
             <h3 className="text-xs sm:text-sm font-bold text-[#64748B] mb-1 sm:mb-2">القطع بالمستودع</h3>
             <p className="text-2xl sm:text-3xl font-black text-[#1E293B]">{inventory.length}</p>
           </div>
           <div className="w-11 h-11 sm:w-12 sm:h-12 bg-[#EFF6FF] text-[#3B82F6] rounded-xl flex items-center justify-center flex-shrink-0" dir="ltr">
             <Package className="w-5 h-5 sm:w-6 sm:h-6" />
           </div>
        </div>

        <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center justify-between min-h-[120px] sm:min-h-[140px]">
           <div>
             <h3 className="text-xs sm:text-sm font-bold text-[#64748B] mb-1 sm:mb-2 whitespace-nowrap">مبيعات اليوم <span className="text-[10px] sm:text-xs font-normal text-[#94A3B8]">(الإجمالي)</span></h3>
             <p className="text-2xl sm:text-3xl font-black text-[#10B981]">{todaySales} <span className="text-xs sm:text-sm font-bold text-[#94A3B8]">ج.م</span></p>
           </div>
           <div className="w-11 h-11 sm:w-12 sm:h-12 bg-[#ECFDF5] text-[#10B981] rounded-xl flex items-center justify-center flex-shrink-0" dir="ltr">
             <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6" />
           </div>
        </div>

        <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center justify-between min-h-[120px] sm:min-h-[140px]">
           <div>
             <h3 className="text-xs sm:text-sm font-bold text-[#64748B] mb-1 sm:mb-2 whitespace-nowrap">الديون المعلقة <span className="text-[10px] sm:text-xs font-normal text-[#94A3B8]">(اليوم)</span></h3>
             <p className="text-2xl sm:text-3xl font-black text-[#F59E0B]">{todayDebt} <span className="text-xs sm:text-sm font-bold text-[#94A3B8]">ج.م</span></p>
           </div>
           <div className="w-11 h-11 sm:w-12 sm:h-12 bg-[#FFFBEB] text-[#F59E0B] rounded-xl flex items-center justify-center flex-shrink-0" dir="ltr">
             <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" />
           </div>
        </div>

        <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between min-h-[120px] sm:min-h-[140px]">
           <div className="flex items-center justify-between w-full">
             <div>
               <h3 className="text-xs sm:text-sm font-bold text-[#2180B2] mb-1 sm:mb-2">الموجود في الدرج</h3>
               <p className="text-2xl sm:text-3xl font-black text-[#2180B2]">{todayCash} <span className="text-xs sm:text-sm font-bold text-[#94A3B8]">ج.م</span></p>
             </div>
             <div className="w-11 h-11 sm:w-12 sm:h-12 bg-[#EFF6FF] text-[#2180B2] rounded-xl flex items-center justify-center flex-shrink-0" dir="ltr">
               <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
             </div>
           </div>
           <p className="text-[11px] sm:text-xs font-bold text-[#64748B] border-t border-[#E2E8F0] pt-2 mt-2 w-full text-center">المبيعات الكاش - المصروفات: 0 ج</p>
        </div>

        <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center justify-between min-h-[120px] sm:min-h-[140px]">
           <div>
             <h3 className="text-xs sm:text-sm font-bold text-[#64748B] mb-1 sm:mb-2">الديون بكل الأيام</h3>
             <p className="text-2xl sm:text-3xl font-black text-[#EF4444]">{allTimeDebt} <span className="text-xs sm:text-sm font-bold text-[#94A3B8]">ج.م</span></p>
           </div>
           <div className="w-11 h-11 sm:w-12 sm:h-12 bg-[#FEF2F2] text-[#EF4444] rounded-xl flex items-center justify-center flex-shrink-0" dir="ltr">
             <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
           </div>
        </div>

        <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center justify-between min-h-[120px] sm:min-h-[140px] relative overflow-hidden">
           <div>
             <h3 className="text-xs sm:text-sm font-bold text-[#64748B] mb-1 sm:mb-2">أوشكت على النفاذ</h3>
             <p className={`text-2xl sm:text-3xl font-black ${lowStockCount > 0 ? "text-[#EF4444]" : "text-[#F59E0B]"}`}>{lowStockCount}</p>
           </div>
           <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 z-10 ${lowStockCount > 0 ? "bg-[#FEF2F2] text-[#EF4444]" : "bg-[#FFFBEB] text-[#F59E0B]"}`} dir="ltr">
             <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
           </div>
        </div>

      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
         
         <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 flex justify-between items-center border-b border-[#F1F5F9] gap-4">
               <h3 className="font-bold text-base sm:text-lg text-[#1E293B] flex items-center gap-2">
                 <FileText className="w-5 h-5 text-[#2180B2]" />
                 آخر الفواتير الصادرة
               </h3>
               <Link to="/invoices" className="text-xs sm:text-sm font-bold text-[#2180B2] flex items-center gap-1 hover:underline">
                 عرض المبيعات <ArrowLeft className="w-4 h-4" />
               </Link>
            </div>

            {/* Mobile View: Recent Invoices Cards */}
            <div className="block md:hidden p-3 space-y-2.5">
              {recentInvoices.length === 0 ? (
                <div className="py-6 text-center text-[#94A3B8] text-sm">
                  لا توجد فواتير صادرة مؤخراً.
                </div>
              ) : (
                recentInvoices.map((inv, idx) => {
                  const customerName = inv.customCustomerName || customerMap.get(inv.customerId) || 'عميل نقدي';
                  const isFullyPaid = inv.paid >= inv.total;
                  const isPartiallyPaid = inv.paid > 0 && inv.paid < inv.total;
                  const dateStr = new Date(inv.date);
                  const formattedDate = `${dateStr.getDate().toString().padStart(2, '0')}/${(dateStr.getMonth()+1).toString().padStart(2, '0')}/${dateStr.getFullYear()}`;

                  return (
                    <div 
                      key={inv.id ? `recent-inv-${inv.id}` : `recent-inv-idx-${idx}`}
                      className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-[#2180B2]">
                            SA-{inv.invoiceNumber}
                          </span>
                          {isFullyPaid ? (
                            <span className="px-1.5 py-0.5 bg-[#F0FDF4] text-[#16A34A] rounded text-[10px] font-bold">نقدي</span>
                          ) : isPartiallyPaid ? (
                            <span className="px-1.5 py-0.5 bg-[#FFFBEB] text-[#D97706] rounded text-[10px] font-bold">جزئي</span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-[#FEF2F2] text-[#DC2626] rounded text-[10px] font-bold">آجل</span>
                          )}
                        </div>
                        <h4 className="font-bold text-[#1E293B] text-sm truncate mt-0.5">
                          {customerName}
                        </h4>
                        <span className="text-[11px] text-[#94A3B8] font-mono">
                          {formattedDate}
                        </span>
                      </div>

                      <div className="text-left shrink-0">
                        <span className="font-black text-sm text-[#1E293B] font-mono block">
                          {Number(inv.total || 0).toLocaleString()} <span className="text-[10px] font-normal text-[#94A3B8]">ج.م</span>
                        </span>
                        <Link 
                          to="/invoices" 
                          className="text-[11px] font-bold text-[#2180B2] hover:underline"
                        >
                          عرض
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
               <table className="w-full text-sm text-right">
                  <thead className="bg-[#white] text-[#94A3B8]">
                     <tr>
                        <th className="py-4 px-6 font-bold whitespace-nowrap">رقم الفاتورة</th>
                        <th className="py-4 px-6 font-bold whitespace-nowrap">العميل</th>
                        <th className="py-4 px-6 font-bold whitespace-nowrap">التاريخ</th>
                        <th className="py-4 px-6 font-bold text-center whitespace-nowrap">طريقة الدفع</th>
                        <th className="py-4 px-6 font-bold text-left whitespace-nowrap">المبلغ الإجمالي</th>
                     </tr>
                  </thead>
                   <tbody className="divide-y divide-[#F1F5F9]">
                     {recentInvoices.map((inv, idx) => {
                       const customerName = inv.customCustomerName || customerMap.get(inv.customerId) || 'عميل نقدي';
                       const isFullyPaid = inv.paid >= inv.total;
                       const isPartiallyPaid = inv.paid > 0 && inv.paid < inv.total;
                       const dateStr = new Date(inv.date);
                       
                       const formattedDate = `${dateStr.getHours().toString().padStart(2, '0')}:${dateStr.getMinutes().toString().padStart(2, '0')} ${dateStr.getDate().toString().padStart(2, '0')}/${(dateStr.getMonth()+1).toString().padStart(2, '0')}/${dateStr.getFullYear()}`;

                       return (
                         <tr key={inv.id ? `recent-inv-${inv.id}` : `recent-inv-idx-${idx}`} className="hover:bg-[#F8FAFC] transition-colors">
                           <td className="py-4 px-6 font-bold text-[#1E293B]">SA-{inv.invoiceNumber}</td>
                           <td className="py-4 px-6 font-bold text-[#1E293B]">{customerName}</td>
                           <td className="py-4 px-6 text-[#94A3B8] font-mono text-right" dir="ltr">{formattedDate}</td>
                           <td className="py-4 px-6 text-center">
                             {isFullyPaid ? (
                               <span className="px-3 py-1 bg-[#F0FDF4] text-[#16A34A] rounded-lg text-xs font-bold">نقدي</span>
                             ) : isPartiallyPaid ? (
                               <span className="px-3 py-1 bg-[#FFFBEB] text-[#D97706] rounded-lg text-xs font-bold">جزئي</span>
                             ) : (
                               <span className="px-3 py-1 bg-[#FEF2F2] text-[#DC2626] rounded-lg text-xs font-bold">آجل</span>
                             )}
                           </td>
                           <td className="py-4 px-6 font-black text-[#1E293B] text-left">{inv.total} <span className="text-xs font-bold text-[#94A3B8]">ج.م</span></td>
                         </tr>
                       );
                     })}
                     {recentInvoices.length === 0 && (
                       <tr>
                         <td colSpan={5} className="py-8 text-center text-[#94A3B8]">لا توجد فواتير صادرة مؤخراً.</td>
                       </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>

         <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden text-center col-span-1 border-dashed">
            <div className="absolute top-6 left-6 text-[#F59E0B]">
               <div className="w-8 h-8 bg-[#FFFBEB] rounded-full flex items-center justify-center text-[#F59E0B] flex-shrink-0 min-w-[32px]" dir="ltr">
                  <AlertTriangle className="w-5 h-5" />
               </div>
            </div>
            <h3 className="font-bold text-lg text-[#1E293B] mb-2 absolute top-6 right-6">تنبيهات المخزون<br/> الحرج</h3>
            
            <div className={`mt-10 w-24 h-24 ${lowStockCount > 0 ? "bg-[#FEF2F2] text-[#DC2626]" : "bg-[#FEF3C7] text-[#F59E0B]"} rounded-full flex flex-col items-center justify-center mb-6`}>
               <span className="text-3xl font-black">{lowStockCount}</span>
               <span className="text-xs font-bold">قطع</span>
            </div>
            
            {lowStockCount === 0 ? (
               <p className="text-center text-[#94A3B8] text-sm font-bold px-2">
                 جميع السلع متوفرة بكمية ممتازة (أعلى من 5 حبات).
               </p>
            ) : (
               <p className="text-center text-[#DC2626] text-sm font-bold px-2">
                 يوجد {lowStockCount} قطع قاربت على النفاذ بالمستودع وتحتاج للطلب فوراً.
               </p>
            )}
         </div>

      </div>

    </div>
  );
}
