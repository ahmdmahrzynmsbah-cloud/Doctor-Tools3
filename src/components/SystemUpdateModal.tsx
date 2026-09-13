import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Zap, Printer, ShieldCheck, X } from 'lucide-react';

export default function SystemUpdateModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already seen and dismissed this update modal permanently
    const hasSeenNotice = localStorage.getItem('system_update_notice_dismissed_v4');
    if (!hasSeenNotice) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('system_update_notice_dismissed_v4', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0F172A]/50 backdrop-blur-xs animate-fade-in print:hidden" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] max-w-sm w-full overflow-hidden relative max-h-[85vh] flex flex-col my-auto">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 relative shrink-0">
          <button 
            onClick={handleClose}
            className="absolute top-3 left-3 p-1 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              تحديث النظام v3.5
            </span>
          </div>

          <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
            تم التحديث بنجاح!
          </h2>
          <p className="text-slate-300 text-xs mt-0.5">
            اكتملت أعمال الصيانة وترقية المحرك لضمان السرعة والدقة.
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 space-y-3 bg-slate-50 overflow-y-auto">
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-lg p-2.5 flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-emerald-900 text-xs font-bold">النظام جاهز للعمل بكفاءة 100%</p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-sky-600 shrink-0" />
              <div>
                <h4 className="font-bold text-slate-800">تحسين السرعة والأداء</h4>
                <p className="text-[11px] text-slate-500">استجابة أسرع للجداول والعمليات.</p>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 flex items-center gap-2.5">
              <Printer className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <h4 className="font-bold text-slate-800">تطوير الطباعة HD</h4>
                <p className="text-[11px] text-slate-500">طباعة الفواتير بدقة عالية دون مشاكل.</p>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-slate-800">صيانة وأمان السجلات</h4>
                <p className="text-[11px] text-slate-500">حفظ تلقائي واستقرار تام للبيانات.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            onClick={handleClose}
            className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer text-center"
          >
            متابعة العمل
          </button>
        </div>

      </div>
    </div>
  );
}

