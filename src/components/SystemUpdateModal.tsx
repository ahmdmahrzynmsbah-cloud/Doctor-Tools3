import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Zap, ShieldCheck } from 'lucide-react';

export default function SystemUpdateModal() {
  const [isOpen, setIsOpen] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Auto-dismiss after 3 seconds (3000ms)
    const startTime = Date.now();
    const duration = 3000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (elapsed >= duration) {
        clearInterval(interval);
        setIsOpen(false);
      }
    }, 30);

    const timer = setTimeout(() => {
      setIsOpen(false);
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in print:hidden" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden relative transform animate-scale-up transition-all duration-300">
        
        {/* Top Progress Bar for 3 seconds auto-dismiss */}
        <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
          <div 
            className="bg-emerald-500 h-full transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-inner">
              <Sparkles className="w-3.5 h-3.5" />
              تحديث المحرك الأضخم v3.8 (فائق السرعة)
            </span>
          </div>

          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            تم تحديث ومزامنة النظام بنجاح!
          </h2>
          <p className="text-slate-300 text-xs mt-1 leading-relaxed">
            تمت ترقية السرعة وتطبيق أحدث تحسينات الأداء وقاعدة البيانات الفورية.
          </p>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-3.5 bg-slate-50/70">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-900">سداد ومزامنة حسابات الموردين</h4>
              <p className="text-[11px] text-emerald-700">تم تثبيت حفظ الدفعات ومطابقة الأرصدة فورياً وبشكل دائم دون تراجع</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 flex items-center gap-2.5 shadow-2xs">
              <Zap className="w-4 h-4 text-sky-600 shrink-0" />
              <div>
                <h5 className="font-bold text-slate-800 text-[11px]">سرعة فائقة</h5>
                <p className="text-[10px] text-slate-500">استجابة فورية بدون تأخير</p>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 flex items-center gap-2.5 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <h5 className="font-bold text-slate-800 text-[11px]">مزامنة فورية</h5>
                <p className="text-[10px] text-slate-500">تحديث سحابي آمن ودقيق</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">جاري الانتقال للسيستم المحسن...</span>
          <button
            onClick={() => setIsOpen(false)}
            className="px-5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-500/20 transition-all cursor-pointer"
          >
            متابعة فورية
          </button>
        </div>

      </div>
    </div>
  );
}
