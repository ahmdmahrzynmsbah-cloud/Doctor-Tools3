import React from 'react';
import { Invoice, Customer, InventoryItem, BusinessProfile } from '@/src/context/AppDataContext';
import { MapPin, Phone, ShieldCheck } from 'lucide-react';

type InvoicePrintProps = {
  invoice: Invoice;
  customer?: Customer;
  inventory: InventoryItem[];
  profile: BusinessProfile;
};

export default function InvoicePrint({ invoice, customer, inventory, profile }: InvoicePrintProps) {
  const remaining = invoice.total - invoice.paid;
  const subtotal = invoice.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  const discountAmount = Math.max(0, subtotal - invoice.total);

  const formatMixedText = (text: string) => {
    if (!text) return text;
    // Add a space between numbers and Arabic characters to prevent html2canvas overlapping bugs
    return text
      .replace(/(\d)([\u0600-\u06FF])/g, '$1 $2')
      .replace(/([\u0600-\u06FF])(\d)/g, '$1 $2');
  };

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
          className={`w-full h-2 rounded-t ${invoice.isQuote ? 'bg-gradient-to-r from-[#D97706] to-[#F59E0B]' : 'bg-gradient-to-r from-[#2180B2] to-[#2ECC71]'}`} 
          style={{ height: '8px', width: '100%', background: invoice.isQuote ? 'linear-gradient(to right, #D97706, #F59E0B)' : 'linear-gradient(to right, #2180B2, #2ECC71)' }}
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

          {/* Invoice Title & Quick Specs (Left) */}
          <div className="flex flex-col justify-start items-end border-r border-[#E2E8F0] pr-6 mr-2 text-left print:flex print:flex-col print:items-end print:justify-start" style={{ borderRight: '1px solid #E2E8F0', paddingRight: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start' }}>
            <div className="text-left">
              <div 
                className={`inline-block text-xs font-bold px-3 py-0.5 rounded-full mb-1 border ${invoice.isQuote ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]' : 'bg-[#EFF6FF] text-[#1D4ED8] border-[#DBEAFE]'}`}
                style={{ backgroundColor: invoice.isQuote ? '#FFFBEB' : '#EFF6FF', color: invoice.isQuote ? '#D97706' : '#1D4ED8', borderColor: invoice.isQuote ? '#FDE68A' : '#DBEAFE' }}
              >
                {invoice.isQuote ? 'عرض سعر معتمد' : 'فاتورة مبيعات معتمدة'}
              </div>
              <h2 className="text-2xl font-extrabold text-[#0F172A]" style={{ color: '#0F172A', fontSize: '24px', fontWeight: 800 }}>{invoice.isQuote ? 'عرض سعر رقم' : 'فاتورة رقم'}</h2>
              <p className="font-mono text-lg font-black text-[#2180B2] mt-0.5 tracking-wider" dir="ltr" style={{ color: '#2180B2', fontSize: '18px', fontWeight: 900 }}>#{invoice.invoiceNumber}</p>
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
            <p className="font-extrabold text-sm sm:text-base text-[#0F172A]" style={{ color: '#0F172A', fontWeight: 800 }}>{invoice.isQuote && invoice.customCustomerName ? invoice.customCustomerName : (customer?.name || 'عميل نقدي/عرض سعر')}</p>
          </div>
          <div>
            <span className="text-[#94A3B8] text-xs font-bold block mb-0.5" style={{ color: '#94A3B8' }}>رقم الهاتف</span>
            <p className="font-mono font-bold text-xs sm:text-sm text-[#334155]" dir="ltr" style={{ color: '#334155' }}>{invoice.isQuote && invoice.customCustomerName ? '—' : (customer?.phone || '—')}</p>
          </div>
          <div>
            <span className="text-[#94A3B8] text-xs font-bold block mb-0.5" style={{ color: '#94A3B8' }}>كود العميل</span>
            <p className="font-mono font-bold text-xs sm:text-sm text-[#334155]" dir="ltr" style={{ color: '#334155' }}>{invoice.isQuote && invoice.customCustomerName ? '—' : (customer?.serialNumber || '—')}</p>
          </div>
        </div>

        {/* Items Table Container */}
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
              {invoice.items.slice(0).map((item, idx) => {
                const invItem = inventory.find(i => i.id === item.itemId);
                const lineTotal = item.quantity * item.price;
                const rowBg = idx % 2 === 0 ? '#ffffff' : '#F8FAFC';
                return (
                  <tr key={`invoice-print-item-${idx}`} className="hover:bg-[#F8FAFC] transition-colors duration-150 break-inside-avoid" style={{ backgroundColor: rowBg, borderBottom: '1px solid #E2E8F0' }}>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-[#64748B] text-xs sm:text-sm print:text-black" style={{ color: '#64748B', backgroundColor: rowBg, padding: '10px 12px' }}>{idx + 1}</td>
                    <td className="py-2.5 px-3 align-top text-right" style={{ backgroundColor: rowBg, padding: '10px 12px' }}>
                      <span className="font-bold text-[#0F172A] text-xs sm:text-sm" style={{ color: '#0F172A', fontWeight: 700 }}>
                        {formatMixedText(invItem?.name || 'صنف محذوف')}
                      </span>
                      {invItem?.code && (
                        <>
                          <br />
                          <span className="font-mono text-[11px] text-[#94A3B8] print:text-gray-700 mt-0.5 inline-block" dir="ltr" style={{ color: '#94A3B8' }}>{invItem.code}</span>
                        </>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-extrabold text-[#334155] text-xs sm:text-sm print:text-black" style={{ color: '#334155', backgroundColor: rowBg, padding: '10px 12px' }}>{item.quantity}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-[#475569] text-xs sm:text-sm print:text-black" dir="ltr" style={{ color: '#475569', backgroundColor: rowBg, padding: '10px 12px' }}>{Number(item.price || 0).toLocaleString()}</td>
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

        {/* Totals Section */}
        <div className="grid grid-cols-2 gap-5 items-end mb-6 pt-2 break-inside-avoid" style={{ marginBottom: '24px' }}>
          {/* Left: Notes / Remarks */}
          <div className="bg-[#FAFDFB] rounded-xl border border-[#DEF7EC] p-4 text-right" style={{ backgroundColor: '#FAFDFB', border: '1px solid #DEF7EC', borderRadius: '12px', padding: '16px' }}>
            <h4 className="text-xs sm:text-sm font-bold text-[#03543F] mb-1.5 flex items-center gap-1.5" style={{ color: '#03543F' }}>
              <ShieldCheck className="w-4 h-4 text-[#03543F]" /> {invoice.isQuote ? 'ملاحظات عرض السعر' : 'ضمان وجودة متميزة'}
            </h4>
            <p className="text-[11px] sm:text-xs text-[#046C4E] leading-relaxed" style={{ color: '#046C4E', lineHeight: '1.5' }}>
              {invoice.isQuote ? 
                'الأسعار الموضحة أعلاه سارية لمدة 7 أيام من تاريخ إطلاق عرض السعر، وتعتبر الفاتورة نافذة فور الاعتماد والتوريد. نشكر ثقتكم الغالية بنا!' :
                'لا ترد أو تستبدل البضاعة المباعة إلا في حالة وجود عيب صناعة واضح، وذلك خلال 14 يوماً من تاريخ الفاتورة بشرط سلامة العبوة وإحضار الفاتورة الأصلية. نشكر ثقتكم الغالية بنا دائماً!'
              }
            </p>
          </div>

          {/* Right: Beautiful Bento-style Totals Summary */}
          <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-4 space-y-2 shadow-sm text-right" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
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

            <div className="flex justify-between items-center text-[#1E293B] border-b border-[#E2E8F0] pb-1.5 text-xs font-bold" style={{ display: 'flex', justifyContent: 'space-between', color: '#1E293B', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px' }}>
              <span>{invoice.isQuote ? (discountAmount > 0 ? 'إجمالي عرض السعر بعد الخصم:' : 'إجمالي عرض السعر:') : (discountAmount > 0 ? 'الإجمالي النهائي بعد الخصم:' : 'إجمالي الفاتورة:')}</span>
              <div className="font-mono text-sm sm:text-base font-black text-[#1E293B] inline-flex items-center gap-1" dir="ltr" style={{ color: '#1E293B', fontWeight: 900 }}>
                <span>{Number(invoice.total || 0).toLocaleString()}</span>
                <span dir="rtl">ج.م</span>
              </div>
            </div>
            {!invoice.isQuote && (
              <>
                <div className="flex justify-between items-center text-[#16A34A] border-b border-[#E2E8F0] pb-1.5 text-xs font-bold" style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px' }}>
                  <span>المبلغ المدفوع:</span>
                  <div className="font-mono text-xs sm:text-sm inline-flex items-center gap-1" dir="ltr" style={{ color: '#16A34A' }}>
                    <span>{Number(invoice.paid || 0).toLocaleString()}</span>
                    <span dir="rtl">ج.م</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-0.5" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-xs font-black text-[#0F172A]" style={{ color: '#0F172A', fontWeight: 900 }}>المبلغ المتبقي:</span>
                  <div className={`font-mono text-sm sm:text-base font-black ${remaining > 0 ? 'text-[#DC2626]' : 'text-[#0D9488]'} inline-flex items-center gap-1`} dir="ltr" style={{ color: remaining > 0 ? '#DC2626' : '#0D9488', fontWeight: 900 }}>
                    <span>{Number(remaining || 0).toLocaleString()}</span>
                    <span dir="rtl">ج.م</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Footer Section: Signatures & Developer Bar */}
      <div className="mt-8 pt-4 border-t border-[#E2E8F0] break-inside-avoid space-y-4" style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px', marginTop: '32px' }}>
        <div className="flex justify-between items-center text-xs" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="text-center w-36">
            <p className="text-[#94A3B8] text-[11px] font-bold mb-3" style={{ color: '#94A3B8', marginBottom: '12px' }}>إمضاء العميل</p>
            <div className="border-b border-[#CBD5E1] w-full h-4" style={{ borderBottom: '1px solid #CBD5E1' }} />
          </div>
          <div className="text-center">
            <p className="font-extrabold text-xs sm:text-sm text-[#0F172A]" style={{ color: '#0F172A', fontWeight: 800 }}>شكراً جزيلاً لتعاملكم معنا!</p>
            <p className="text-[11px] text-[#64748B] mt-0.5" style={{ color: '#64748B' }}>{profile.name || 'Doctor Tools'} — إدارة المبيعات</p>
          </div>
          <div className="text-center w-36">
            <p className="text-[#94A3B8] text-[11px] font-bold mb-3" style={{ color: '#94A3B8', marginBottom: '12px' }}>إمضاء الحسابات</p>
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
