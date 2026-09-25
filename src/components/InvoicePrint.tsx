import React from 'react';
import { Invoice, Customer, InventoryItem, BusinessProfile } from '@/src/context/AppDataContext';
import { MapPin, Phone, ShieldCheck, CheckCircle2, Receipt, ArrowDownLeft } from 'lucide-react';

function tafqeetArabic(num: number): string {
  if (!num || num <= 0) return 'صفر جنيه مصري';
  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

  if (num === 500) return 'خمسمائة جنيه مصري';
  if (num === 1000) return 'ألف جنيه مصري';
  if (num === 1500) return 'ألف وخمسمائة جنيه مصري';
  if (num === 2000) return 'ألفان جنيه مصري';
  if (num === 2500) return 'ألفان وخمسمائة جنيه مصري';
  if (num === 3000) return 'ثلاثة آلاف جنيه مصري';
  if (num === 3500) return 'ثلاثة آلاف وخمسمائة جنيه مصري';
  if (num === 4000) return 'أربعة آلاف جنيه مصري';
  if (num === 5000) return 'خمسة آلاف جنيه مصري';
  if (num === 10000) return 'عشرة آلاف جنيه مصري';

  const convertHundreds = (n: number): string => {
    let str = '';
    const h = Math.floor(n / 100);
    const rem = n % 100;
    if (h > 0) str += hundreds[h];
    if (rem > 0) {
      if (str) str += ' و';
      if (rem < 20) {
        str += ones[rem];
      } else {
        const o = rem % 10;
        const t = Math.floor(rem / 10);
        if (o > 0) str += ones[o] + ' و';
        str += tens[t];
      }
    }
    return str;
  };

  let result = '';
  const th = Math.floor(num / 1000);
  const rem1000 = num % 1000;
  if (th > 0) {
    if (th === 1) result += 'ألف';
    else if (th === 2) result += 'ألفان';
    else if (th >= 3 && th <= 10) result += convertHundreds(th) + ' آلاف';
    else result += convertHundreds(th) + ' ألف';
  }
  if (rem1000 > 0) {
    if (result) result += ' و';
    result += convertHundreds(rem1000);
  }
  return result ? `${result} جنيه مصري` : `${num} جنيه مصري`;
}

type InvoicePrintProps = {
  invoice: Invoice;
  customer?: Customer;
  inventory: InventoryItem[];
  profile: BusinessProfile;
  allInvoices?: Invoice[];
};

export default function InvoicePrint({ invoice, customer, inventory, profile, allInvoices = [] }: InvoicePrintProps) {
  const isPaymentReceipt = Boolean(
    invoice.invoiceNumber?.startsWith('PAY-') || 
    (!invoice.isQuote && invoice.items?.length === 0 && (invoice.paid > 0 || invoice.total === 0))
  );

  // Customer Financial Calculations
  const customerInvoices = (allInvoices || []).filter(
    i => i.customerId === invoice.customerId && !i.isQuote && !i.invoiceNumber?.startsWith('PAY-') && (i.items?.length > 0 || i.total > 0)
  );
  const calcTotalCustomerInvoices = customerInvoices.reduce((acc, i) => acc + Number(i.total || 0), 0);
  const customerPayments = (allInvoices || []).filter(
    i => i.customerId === invoice.customerId && !i.isQuote
  );
  const customerTotalPaid = customerPayments.reduce((acc, i) => acc + Number(i.paid || 0), 0);
  const customerBalance = Number(customer?.balance ?? Math.max(0, calcTotalCustomerInvoices - customerTotalPaid));

  const paidThisReceipt = Number(invoice.paid || 0);
  const customerBalanceAfter = Math.max(0, customerBalance);
  const customerBalanceBefore = customerBalanceAfter + paidThisReceipt;
  const totalCustomerInvoices = calcTotalCustomerInvoices > 0 
    ? calcTotalCustomerInvoices 
    : (customerBalance + paidThisReceipt);

  // For regular invoice calculations
  const getItemPrice = (item: any) => {
    let price = item.price;
    if (price === undefined || price === null || price === 0) {
      if (item.sellPrice !== undefined && item.sellPrice !== null && item.sellPrice !== 0) {
        price = Number(item.sellPrice);
      } else if (item.unitPrice !== undefined && item.unitPrice !== null && item.unitPrice !== 0) {
        price = Number(item.unitPrice);
      } else if (item.total && item.quantity) {
        price = Number(item.total) / Number(item.quantity);
      } else if (invoice.items.length === 1 && invoice.total) {
        price = Number(invoice.total) / Number(item.quantity || 1);
      } else {
        const found = inventory.find(i => i.id === item.itemId || i.id === item.id || i.name === item.name || i.code === item.code);
        if (found && found.sellPrice) {
          price = Number(found.sellPrice);
        }
      }
    }
    return Number(price || 0);
  };

  const subtotal = (invoice.items || []).reduce((acc, item) => acc + (item.quantity * getItemPrice(item)), 0);
  const discountAmount = Math.max(0, subtotal - (invoice.total || 0));

  // Determine effective paid and remaining for sales invoices
  const effectiveInvoiceTotal = Number(invoice.total || 0);
  const directPaid = Number(invoice.paid || 0);
  const effectivePaid = directPaid;
  const effectiveRemaining = Math.max(0, effectiveInvoiceTotal - directPaid);

  const formatMixedText = (text: string) => {
    if (!text) return text;
    return text
      .replace(/(\d)([\u0600-\u06FF])/g, '$1 $2')
      .replace(/([\u0600-\u06FF])(\d)/g, '$1 $2');
  };

  const customerDisplayName = invoice.isQuote && invoice.customCustomerName 
    ? invoice.customCustomerName 
    : (customer?.name || 'عميل نقدي');

  return (
    <div 
      id="invoice-card"
      className="bg-white text-[#1E293B] p-8 w-[850px] max-w-none shadow-lg border border-[#E2E8F0] print:border-none print:shadow-none print:w-full print:max-w-none print:p-2 relative select-none font-sans mx-auto shrink-0 flex flex-col justify-start box-border print:h-auto print:min-h-0" 
      dir="rtl"
      style={{ fontFamily: '"Cairo", system-ui, sans-serif', backgroundColor: '#ffffff', color: '#1E293B', boxSizing: 'border-box' }}
    >
      {/* Top Main Content Section */}
      <div className="flex-1 flex flex-col print:block">
        {/* Decorative Top Accent Bar */}
        <div 
          className="w-full h-2 rounded-t" 
          style={{ 
            height: '8px', 
            width: '100%', 
            background: isPaymentReceipt 
              ? 'linear-gradient(to right, #059669, #10B981)' 
              : invoice.isQuote 
                ? 'linear-gradient(to right, #D97706, #F59E0B)' 
                : 'linear-gradient(to right, #2180B2, #2ECC71)' 
          }}
        />

        {/* Header Container */}
        <div className="flex flex-row justify-between items-start border-b border-[#E2E8F0] pb-5 mb-5 mt-2 print:flex print:flex-row print:justify-between print:items-start" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Company Profile (Right) */}
          <div className="flex items-start gap-5 print:flex print:items-start print:gap-4" style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
            <div className="w-20 h-20 bg-white rounded-2xl border border-[#CBD5E1] flex items-center justify-center shadow-md relative overflow-hidden shrink-0 print:border-none print:shadow-none" style={{ backgroundColor: '#ffffff', borderColor: '#CBD5E1', width: '80px', height: '80px', minWidth: '80px', minHeight: '80px', flex: '0 0 80px' }}>
              <img style={{ width: "80px", height: "80px", objectFit: "contain", maxWidth: "80px", maxHeight: "80px" }} width="80" height="80"  
                src={profile.logo || '/logo.png'} 
                alt="Logo" 
                className="w-full h-full object-contain rounded-2xl"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col justify-start text-right pt-1">
              <h1 className="text-2xl font-black text-[#1E293B]" style={{ color: '#1E293B', fontSize: '26px', fontWeight: 900, margin: 0, padding: 0 }}>{profile.name || 'Doctor Tools'}</h1>
              {profile.address && (
                <p className="text-[#64748B] text-xs mt-1 flex items-center gap-1.5 justify-start" style={{ color: '#64748B' }}>
                  <MapPin className="w-3.5 h-3.5 text-[#2180B2]" /> {profile.address}
                </p>
              )}
              {profile.phone && (
                <p className="text-[#64748B] text-xs mt-0.5 flex items-center gap-1.5 justify-start" dir="rtl" style={{ color: '#64748B' }}>
                  <Phone className="w-3.5 h-3.5 text-[#2180B2]" /> <span className="font-bold font-mono text-[#475569]" dir="ltr" style={{ color: '#475569' }}>{profile.phone}</span>
                </p>
              )}
            </div>
          </div>

          {/* Invoice / Receipt Title & Quick Specs (Left) */}
          <div className="flex flex-col justify-start items-end border-r border-[#E2E8F0] pr-6 mr-2 text-left print:flex print:flex-col print:items-end print:justify-start" style={{ borderRight: '1px solid #E2E8F0', paddingRight: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start' }}>
            <div className="text-left">
              <div 
                className="inline-block text-xs font-bold px-3 py-0.5 rounded-full mb-1 border"
                style={{ 
                  backgroundColor: isPaymentReceipt ? '#ECFDF5' : invoice.isQuote ? '#FFFBEB' : '#EFF6FF', 
                  color: isPaymentReceipt ? '#059669' : invoice.isQuote ? '#D97706' : '#1D4ED8', 
                  borderColor: isPaymentReceipt ? '#A7F3D0' : invoice.isQuote ? '#FDE68A' : '#DBEAFE' 
                }}
              >
                {isPaymentReceipt ? 'سند قبض وتحصيل نقدية' : invoice.isQuote ? 'عرض سعر معتمد' : 'فاتورة مبيعات معتمدة'}
              </div>
              <h2 className="text-2xl font-extrabold text-[#0F172A]" style={{ color: '#0F172A', fontSize: '24px', fontWeight: 800 }}>
                {isPaymentReceipt ? 'سند قبض رقم' : invoice.isQuote ? 'عرض سعر رقم' : 'فاتورة رقم'}
              </h2>
              <p className="font-mono text-lg font-black text-[#2180B2] mt-0.5 tracking-wider" dir="ltr" style={{ color: '#2180B2', fontSize: '18px', fontWeight: 900 }}>
                #{invoice.invoiceNumber}
              </p>
            </div>
            <div className="text-left mt-1 text-[#475569]" style={{ color: '#475569' }}>
              <p className="text-xs font-semibold">التاريخ: <span className="font-bold text-[#1E293B] font-mono" style={{ color: '#1E293B' }}>{new Date(invoice.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
            </div>
          </div>
        </div>

        {/* Customer Info Card */}
        <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-4 mb-5 grid grid-cols-3 gap-4 text-right" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
          <div>
            <span className="text-[#94A3B8] text-xs font-bold block mb-0.5" style={{ color: '#94A3B8' }}>العميل الكريم</span>
            <p className="font-extrabold text-sm sm:text-base text-[#0F172A]" style={{ color: '#0F172A', fontWeight: 800 }}>{customerDisplayName}</p>
          </div>
          <div>
            <span className="text-[#94A3B8] text-xs font-bold block mb-0.5" style={{ color: '#94A3B8' }}>رقم الهاتف</span>
            <p className="font-mono font-bold text-xs sm:text-sm text-[#334155]" dir="ltr" style={{ color: '#334155' }}>{customer?.phone || '—'}</p>
          </div>
          <div>
            <span className="text-[#94A3B8] text-xs font-bold block mb-0.5" style={{ color: '#94A3B8' }}>كود العميل</span>
            <p className="font-mono font-bold text-xs sm:text-sm text-[#334155]" dir="ltr" style={{ color: '#334155' }}>{customer?.serialNumber || '—'}</p>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* CASE A: PAYMENT RECEIPT VOUCHER (سند قبض / إيصال استلام)       */}
        {/* ------------------------------------------------------------- */}
        {isPaymentReceipt ? (
          <div className="space-y-5 mb-5">
            {/* Prominent Payment Box */}
            <div className="bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] border-2 border-[#86EFAC] rounded-2xl p-5 text-right shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-xs font-black text-[#15803D] uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                    المبلغ المحصل والمقبوض بهذا السند
                  </span>
                  <div className="inline-flex items-baseline gap-2" dir="ltr">
                    <span className="text-3xl sm:text-4xl font-black text-[#166534] font-mono">
                      {Number(invoice.paid || 0).toLocaleString()}
                    </span>
                    <span className="text-base font-bold text-[#15803D]" dir="rtl">جنيه مصري (ج.م)</span>
                  </div>
                  <p className="text-xs font-bold text-[#15803D] mt-1.5">
                    فقط وقدره: <span className="font-black text-[#166534]">{tafqeetArabic(Number(invoice.paid || 0))}</span> لا غير.
                  </p>
                </div>
                <div className="bg-white/80 backdrop-blur-xs px-4 py-3 rounded-xl border border-[#86EFAC] text-xs space-y-1">
                  <div className="text-slate-600 font-semibold">
                    <span>طريقة السداد: </span>
                    <span className="font-black text-slate-800">نقداً بالخزينة</span>
                  </div>
                  <div className="text-slate-600 font-semibold">
                    <span>البيان: </span>
                    <span className="font-bold text-slate-800">سداد دفعة نقدية لحساب الفواتير</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Invoices Table (Credited Invoices) */}
            {customerInvoices.length > 0 && (
              <div className="rounded-xl border border-[#E2E8F0] overflow-hidden">
                <div className="bg-[#F8FAFC] px-4 py-2.5 border-b border-[#E2E8F0] flex justify-between items-center text-xs font-bold text-[#475569]">
                  <span className="flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-[#2180B2]" />
                    بيان فواتير المبيعات المرتبطة بحساب العميل
                  </span>
                  <span>إجمالي الفواتير: {Number(totalCustomerInvoices).toLocaleString()} ج.م</span>
                </div>
                <table className="w-full text-right border-collapse text-xs">
                  <thead className="bg-[#0F172A] text-white">
                    <tr>
                      <th className="py-2 px-3 text-center w-12">م</th>
                      <th className="py-2 px-3">رقم الفاتورة</th>
                      <th className="py-2 px-3 text-center">التاريخ</th>
                      <th className="py-2 px-3 text-center">عدد الأصناف</th>
                      <th className="py-2 px-3 text-left">قيمة الفاتورة (ج.م)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] bg-white">
                    {customerInvoices.map((inv, idx) => (
                      <tr key={inv.id || idx} className="hover:bg-[#F8FAFC]">
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold text-[#2180B2]">#{inv.invoiceNumber}</td>
                        <td className="py-2 px-3 text-center text-slate-600 font-mono">
                          {new Date(inv.date).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-slate-700">{inv.items?.length || 0}</td>
                        <td className="py-2 px-3 text-left font-mono font-bold text-slate-900">
                          {Number(inv.total || 0).toLocaleString()} ج.م
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* CASE B: SALES INVOICE / QUOTE ITEMS TABLE                     */
          /* ------------------------------------------------------------- */
          <div className="rounded-xl border border-[#E2E8F0] mb-5 overflow-hidden print:overflow-visible print:border-none" style={{ border: '1px solid #E2E8F0', borderRadius: '12px', marginBottom: '20px' }}>
            <table className="w-full text-right border-collapse" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead className="print:table-header-group">
                <tr className="bg-[#0F172A] text-white print:bg-transparent print:text-black print:border-b-2 print:border-black">
                  <th className="py-2.5 px-3 text-xs font-extrabold text-center w-12 print:px-1">م</th>
                  <th className="py-2.5 px-3 text-xs sm:text-sm font-extrabold print:px-1">البيان / الصنف</th>
                  <th className="py-2.5 px-3 text-xs font-extrabold text-center w-20 print:px-1">الكمية</th>
                  <th className="py-2.5 px-3 text-xs font-extrabold text-center w-28 print:px-1">سعر الوحدة</th>
                  <th className="py-2.5 px-3 text-xs font-extrabold text-left w-32 print:px-1">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white print:table-row-group" style={{ backgroundColor: '#ffffff' }}>
                {(invoice.items || []).map((item, idx) => {
                  const invItem = inventory.find(i => i.id === item.itemId || i.id === (item as any).id);
                  const itemName = invItem?.name || (item as any).name || (item as any).itemName || (item as any).description || 'صنف';
                  const effectivePrice = getItemPrice(item);
                  const lineTotal = (item.quantity || 1) * effectivePrice;
                  const rowBg = idx % 2 === 0 ? '#ffffff' : '#F8FAFC';
                  return (
                    <tr key={`invoice-print-item-${idx}`} className="hover:bg-[#F8FAFC] transition-colors duration-150 break-inside-avoid" style={{ backgroundColor: rowBg, borderBottom: '1px solid #E2E8F0' }}>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-[#64748B] text-xs sm:text-sm print:text-black" style={{ color: '#64748B', backgroundColor: rowBg, padding: '10px 12px' }}>{idx + 1}</td>
                      <td className="py-2.5 px-3 align-top text-right" style={{ backgroundColor: rowBg, padding: '10px 12px' }}>
                        <span className="font-bold text-[#0F172A] text-xs sm:text-sm" style={{ color: '#0F172A', fontWeight: 700 }}>
                          {formatMixedText(itemName)}
                        </span>
                        {invItem?.code && (
                          <>
                            <br />
                            <span className="font-mono text-[11px] text-[#94A3B8] print:text-gray-700 mt-0.5 inline-block" dir="ltr" style={{ color: '#94A3B8' }}>{invItem.code}</span>
                          </>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-extrabold text-[#334155] text-xs sm:text-sm print:text-black" style={{ color: '#334155', backgroundColor: rowBg, padding: '10px 12px' }}>{item.quantity}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-[#475569] text-xs sm:text-sm print:text-black" dir="ltr" style={{ color: '#475569', backgroundColor: rowBg, padding: '10px 12px' }}>{Number(effectivePrice || 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-left font-mono font-extrabold text-[#0F172A] text-xs sm:text-sm print:text-black" style={{ color: '#0F172A', backgroundColor: rowBg, padding: '10px 12px' }}>
                        <div className="inline-flex items-center gap-1" dir="ltr" style={{ color: '#0F172A' }}>
                          <span style={{ color: '#0F172A' }}>{Number(lineTotal || 0).toLocaleString()}</span>
                          <span dir="rtl" style={{ color: '#0F172A' }}>ج.م</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals Section */}
        <div className="grid grid-cols-2 gap-5 items-end mb-6 pt-2 break-inside-avoid" style={{ marginBottom: '24px' }}>
          {/* Left: Notes / Remarks */}
          <div className="bg-[#FAFDFB] rounded-xl border border-[#DEF7EC] p-4 text-right" style={{ backgroundColor: '#FAFDFB', border: '1px solid #DEF7EC', borderRadius: '12px', padding: '16px' }}>
            <h4 className="text-xs sm:text-sm font-bold text-[#03543F] mb-1.5 flex items-center gap-1.5" style={{ color: '#03543F' }}>
              <ShieldCheck className="w-4 h-4 text-[#03543F]" /> 
              {isPaymentReceipt ? 'اعتماد وصحة السداد' : invoice.isQuote ? 'ملاحظات عرض السعر' : 'ضمان وجودة متميزة'}
            </h4>
            <p className="text-[11px] sm:text-xs text-[#046C4E] leading-relaxed" style={{ color: '#046C4E', lineHeight: '1.5' }}>
              {isPaymentReceipt ? 
                'تم قيد هذا المبلغ بحساب العميل رسمياً وتحديث رصيد الحساب المالي. هذا المستند يعد إيصالاً نقدياً رسمياً معتمداً من إدارة المبيعات والحسابات.' :
                invoice.isQuote ? 
                  'الأسعار الموضحة أعلاه سارية لمدة 7 أيام من تاريخ إطلاق عرض السعر، وتعتبر الفاتورة نافذة فور الاعتماد والتوريد. نشكر ثقتكم الغالية بنا!' :
                  'لا ترد أو تستبدل البضاعة المباعة إلا في حالة وجود عيب صناعة واضح، وذلك خلال 14 يوماً من تاريخ الفاتورة بشرط سلامة العبوة وإحضار الفاتورة الأصلية. نشكر ثقتكم الغالية بنا دائماً!'
              }
            </p>
          </div>

          {/* Right: Beautiful Bento-style Totals Summary */}
          <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-4 space-y-2 shadow-sm text-right" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
            {isPaymentReceipt ? (
              /* Receipt Financial Breakdown */
              <>
                <div className="flex justify-between items-center text-[#475569] border-b border-[#E2E8F0] pb-2 text-xs font-semibold">
                  <span className="text-xs text-slate-600">رصيد العميل السابق (قبل هذا السند):</span>
                  <div className="font-mono text-sm sm:text-base font-bold text-[#1E293B] inline-flex items-center gap-1" dir="ltr">
                    <span>{Number(customerBalanceBefore).toLocaleString()}</span>
                    <span dir="rtl" className="text-xs font-normal">ج.م</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[#16A34A] border-b border-[#E2E8F0] pb-2 text-xs font-bold bg-[#F0FDF4] px-2.5 py-1.5 rounded-lg border border-[#BBF7D0]">
                  <span className="text-xs font-black text-[#15803D]">المبلغ المسدد والمخصوم بهذا السند:</span>
                  <div className="font-mono text-base font-black text-[#166534] inline-flex items-center gap-1" dir="ltr">
                    <span>-{Number(paidThisReceipt).toLocaleString()}</span>
                    <span dir="rtl" className="text-xs font-normal">ج.م</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1.5">
                  <div className="flex flex-col text-right">
                    <span className="text-xs sm:text-sm font-black text-[#0F172A]">الرصيد المتبقي بذمة العميل بعد السداد:</span>
                    {customerBalanceAfter > 0 ? (
                      <span className="text-[10px] text-[#DC2626] font-bold">(متبقي على العميل)</span>
                    ) : (
                      <span className="text-[10px] text-[#16A34A] font-bold">(تمت التصفية بالكامل - خالص)</span>
                    )}
                  </div>
                  <div className={`font-mono text-base sm:text-lg font-black ${customerBalanceAfter > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'} inline-flex items-center gap-1`} dir="ltr">
                    <span>{Number(customerBalanceAfter).toLocaleString()}</span>
                    <span dir="rtl" className="text-xs font-normal">ج.م</span>
                  </div>
                </div>

                {calcTotalCustomerInvoices > 0 && (
                  <div className="flex justify-between items-center text-slate-500 border-t border-dashed border-[#CBD5E1] pt-1.5 text-[11px]">
                    <span>إجمالي الفواتير: {Number(calcTotalCustomerInvoices).toLocaleString()} ج.م</span>
                    <span className="font-semibold text-emerald-700">إجمالي المسدد: {Number(customerTotalPaid).toLocaleString()} ج.م</span>
                  </div>
                )}
              </>
            ) : (
              /* Regular Sales Invoice Breakdown */
              <>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-[#475569] border-b border-[#E2E8F0] pb-1.5 text-xs font-semibold" style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px' }}>
                    <span>الإجمالي قبل الخصم:</span>
                    <div className="font-mono text-xs text-[#475569] inline-flex items-center gap-1" dir="ltr" style={{ color: '#475569' }}>
                      <span>{Number(subtotal || 0).toLocaleString()}</span>
                      <span dir="rtl">ج.م</span>
                    </div>
                  </div>
                )}
                
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-[#DC2626] border-b border-[#E2E8F0] pb-1.5 text-xs font-bold bg-[#FEF2F2] px-2.5 py-1 rounded-md border border-[#FECACA]" style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', padding: '4px 10px' }}>
                    <span className="flex items-center gap-1">
                      <span>الخصم المطبق</span>
                      {invoice.discountValue && invoice.discountType === 'percentage' ? (
                        <span className="text-[10px] bg-[#FECACA] text-[#B91C1C] px-1 py-0.2 rounded font-mono" style={{ backgroundColor: '#FECACA', color: '#B91C1C' }}>({invoice.discountValue}%)</span>
                      ) : invoice.discountValue && invoice.discountType === 'fixed' ? (
                        <span className="text-[10px] bg-[#FECACA] text-[#B91C1C] px-1 py-0.2 rounded font-sans" style={{ backgroundColor: '#FECACA', color: '#B91C1C' }}>(مبلغ ثابت)</span>
                      ) : ''}
                      :
                    </span>
                    <div className="font-mono text-xs inline-flex items-center gap-1" dir="ltr" style={{ color: '#DC2626' }}>
                      <span>-{Number(discountAmount || 0).toLocaleString()}</span>
                      <span dir="rtl">ج.م</span>
                    </div>
                  </div>
                )}

                {/* 1. إجمالي الفاتورة كلها */}
                <div className="flex justify-between items-center text-[#1E293B] border-b border-[#E2E8F0] pb-2 text-xs font-bold" style={{ display: 'flex', justifyContent: 'space-between', color: '#1E293B', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
                  <span className="text-sm font-extrabold">
                    {invoice.isQuote ? (discountAmount > 0 ? 'إجمالي عرض السعر بعد الخصم:' : 'إجمالي عرض السعر:') : (discountAmount > 0 ? 'إجمالي الفاتورة بعد الخصم:' : 'إجمالي الفاتورة (المبلغ بالكامل):')}
                  </span>
                  <div className="font-mono text-base sm:text-lg font-black text-[#1E293B] inline-flex items-center gap-1" dir="ltr" style={{ color: '#1E293B', fontWeight: 900 }}>
                    <span>{Number(effectiveInvoiceTotal).toLocaleString()}</span>
                    <span dir="rtl" className="text-xs">ج.م</span>
                  </div>
                </div>

                {!invoice.isQuote && (
                  <>
                    {/* 2. المبلغ المدفوع */}
                    <div className="flex justify-between items-center text-[#16A34A] border-b border-[#E2E8F0] pb-2 text-xs font-bold" style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
                      <span className="text-xs font-bold">المبلغ المدفوع (المحصل):</span>
                      <div className="font-mono text-sm sm:text-base font-black inline-flex items-center gap-1" dir="ltr" style={{ color: '#16A34A', fontWeight: 800 }}>
                        <span>{Number(effectivePaid).toLocaleString()}</span>
                        <span dir="rtl" className="text-xs">ج.م</span>
                      </div>
                    </div>

                    {/* 3. المبلغ المتبقي */}
                    <div className="flex justify-between items-center pt-1.5" style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px' }}>
                      <div className="flex flex-col text-right">
                        <span className="text-xs sm:text-sm font-black text-[#0F172A]" style={{ color: '#0F172A', fontWeight: 900 }}>المبلغ المتبقي:</span>
                        {effectiveRemaining > 0 ? (
                          <span className="text-[10px] text-[#DC2626] font-bold" style={{ color: '#DC2626' }}>(متبقي على العميل)</span>
                        ) : (
                          <span className="text-[10px] text-[#16A34A] font-bold" style={{ color: '#16A34A' }}>(خالص بالكامل)</span>
                        )}
                      </div>
                      <div className={`font-mono text-base sm:text-lg font-black ${effectiveRemaining > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'} inline-flex items-center gap-1`} dir="ltr" style={{ color: effectiveRemaining > 0 ? '#DC2626' : '#16A34A', fontWeight: 900 }}>
                        <span>{Number(effectiveRemaining).toLocaleString()}</span>
                        <span dir="rtl" className="text-xs">ج.م</span>
                      </div>
                    </div>

                    {/* صافي رصيد حساب العميل المتبقي إن وجد */}
                    {customer && customerBalance !== effectiveRemaining && (
                      <div className="flex justify-between items-center text-[#475569] border-t border-[#E2E8F0] pt-1.5 text-[11px] font-semibold">
                        <span>إجمالي رصيد العميل الحالي بالدفتر:</span>
                        <span className="font-mono font-bold text-slate-800" dir="ltr">
                          {Number(customerBalance).toLocaleString()} ج.م
                        </span>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Footer Section: Signatures & Developer Bar */}
      <div className="mt-8 pt-4 border-t border-[#E2E8F0] break-inside-avoid space-y-4" style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px', marginTop: '32px' }}>
        <div className="flex justify-between items-center text-xs" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="text-center w-36">
            <p className="text-[#94A3B8] text-[11px] font-bold mb-3" style={{ color: '#94A3B8', marginBottom: '12px' }}>
              {isPaymentReceipt ? 'توقيع العميل / المقر بالدفع' : 'إمضاء العميل'}
            </p>
            <div className="border-b border-[#CBD5E1] w-full h-4" style={{ borderBottom: '1px solid #CBD5E1' }} />
          </div>
          <div className="text-center">
            <p className="font-extrabold text-xs sm:text-sm text-[#0F172A]" style={{ color: '#0F172A', fontWeight: 800 }}>شكراً جزيلاً لتعاملكم معنا!</p>
            <p className="text-[11px] text-[#64748B] mt-0.5" style={{ color: '#64748B' }}>{profile.name || 'Doctor Tools'} — إدارة المبيعات والحسابات</p>
          </div>
          <div className="text-center w-36">
            <p className="text-[#94A3B8] text-[11px] font-bold mb-3" style={{ color: '#94A3B8', marginBottom: '12px' }}>
              {isPaymentReceipt ? 'توقيع المستلم / الخزينة' : 'إمضاء الحسابات'}
            </p>
            <div className="border-b border-[#CBD5E1] w-full h-4" style={{ borderBottom: '1px solid #CBD5E1' }} />
          </div>
        </div>

        {/* Professional Developer Footer Bar */}
        <div 
          className="flex flex-row justify-between items-center text-xs text-[#64748B] px-4 py-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]"
          style={{ padding: '10px 16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div className="font-mono font-bold text-[#64748B] text-[11px]" dir="ltr" style={{ color: '#64748B', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px' }}>
            ALL RIGHTS RESERVED © 2026
          </div>
          <div className="font-extrabold text-[#2180B2] text-xs flex items-center gap-1.5" dir="ltr" style={{ color: '#2180B2', fontWeight: 800, fontSize: '12px' }}>
            <span>Developed by Fox Tech</span>
          </div>
          <div className="font-mono font-bold text-[#334155] text-xs flex items-center gap-1.5" dir="ltr" style={{ color: '#334155', fontFamily: 'monospace', fontWeight: 700, fontSize: '12px' }}>
            <Phone className="w-3.5 h-3.5 text-[#334155]" />
            <span>01034859313</span>
          </div>
        </div>
      </div>
    </div>
  );
}
