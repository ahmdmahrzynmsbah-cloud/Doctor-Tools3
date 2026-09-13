import React, { useState } from 'react';
import { Mic, Sparkles, PhoneCall, MessageCircle, Zap, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

export default function VoiceFeatureBanner() {
  const [isExpanded, setIsExpanded] = useState(true);

  const whatsappUrl = `https://wa.me/201034859313?text=${encodeURIComponent(
    'السلام عليكم، حابب استفسر وافعل ميزة الفواتير والأوامر الصوتية (Voice Invoicing) في برنامج Doctor Tools.'
  )}`;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white p-5 sm:p-6 border border-[#38BDF8]/30 shadow-xl">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[#0284C7]/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-[#38BDF8]/15 blur-3xl pointer-events-none" />

      {/* Header section of banner */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0284C7] to-[#38BDF8] flex items-center justify-center shadow-lg shadow-[#0284C7]/40 text-white">
              <Mic className="w-6 h-6" />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40">
                <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
                ميزة جديدة متوفرة الآن
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white leading-tight">
              تعبت من الكتابة والتدوير اليدوي؟ اعمل فواتيرك وابحث بصوتك في ثواني!
            </h2>
          </div>
        </div>

        {/* Action / Toggle buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20bd5a] hover:to-[#0f7a6e] text-white text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-[#25D366]/20 transition-all flex items-center gap-2 cursor-pointer no-underline"
          >
            <MessageCircle className="w-4 h-4" />
            <span>فعّل الميزة على واتساب</span>
          </a>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#94A3B8] hover:text-white transition-all text-xs font-bold flex items-center gap-1 cursor-pointer border-none"
            title={isExpanded ? 'طي التفاصيل' : 'عرض التفاصيل'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content with persuasive Egyptian dialect details */}
      {isExpanded && (
        <div className="relative z-10 mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          
          {/* Feature 1 */}
          <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8] shrink-0 mt-0.5">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white mb-1">
                فاتورة كاملة بصوتك من غير ما تلمس الكيبورد
              </h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                قول بس: <span className="text-[#38BDF8] font-bold">"ضيف 3 علب بسعر 50 جنيه لعميل كذا واعمل خصم 10%"</span>، والسيستم هيفهم كل كلمة وينزل الصنف والكمية والأسعار ويحسب الإجمالي أوتوماتيك فوراً!
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8] shrink-0 mt-0.5">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white mb-1">
                بحث صوتي فوري عن أي فاتورة أو عميل
              </h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                بدل ما تقعد تدور وتكتب.. انطق اسم العميل أو رقم الفاتورة بصوتك وفي أقل من ثانية الفاتورة هتظهر قدامك بكل تفاصيلها!
              </p>
            </div>
          </div>

          {/* Feature 3 & CTA Call */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#0284C7]/20 to-[#38BDF8]/10 border border-[#38BDF8]/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-black text-[#38BDF8] mb-1">
                <CheckCircle2 className="w-4 h-4 text-[#38BDF8]" />
                جاهزة للتفعيل في حسابك فوراً
              </div>
              <p className="text-xs text-[#E2E8F0] leading-relaxed mb-3">
                ريح بالك وسرّع شغلك ووفّر وقت البيع! كلمنا حالاً واطلب تفعيل ميزة الأوامر الصوتية:
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
              <a
                href="tel:01034859313"
                dir="ltr"
                className="flex-1 py-1.5 px-3 bg-white text-[#0F172A] hover:bg-[#F8FAFC] text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2 shadow no-underline"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#0284C7]" />
                <span className="font-bold font-mono text-sm">01034859313</span>
              </a>
              <span className="text-[11px] font-bold text-[#94A3B8] w-full text-center">
                فريق الدعم والتطوير — Fox Tech
              </span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
