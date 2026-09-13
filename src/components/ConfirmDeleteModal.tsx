import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string;
  itemName?: string;
  itemDetails?: string | React.ReactNode;
  warningNote?: string;
  confirmText?: string;
  cancelText?: string;
  isDeleting?: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'تأكيد الحذف النهائي',
  message = 'هل أنت متأكد من رغبتك في حذف هذا العنصر بشكل نهائي؟',
  itemName,
  itemDetails,
  warningNote = 'تنبيه: لا يمكن التراجع عن هذه العملية أو استعادة البيانات بعد تأكيد الحذف.',
  confirmText = 'نعم، حذف نهائي',
  cancelText = 'إلغاء التراجع',
  isDeleting = false
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#FEE2E2] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header with Warning Icon */}
        <div className="bg-gradient-to-r from-red-50 via-rose-50 to-orange-50 px-6 py-5 border-b border-red-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-red-700 font-medium">إجراء حساس يتطلب التأكيد</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition-colors disabled:opacity-50 cursor-pointer border-none bg-transparent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm font-medium text-slate-700 leading-relaxed">
            {message}
          </p>

          {/* Highlighted Item Badge if provided */}
          {itemName && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-1 text-right">
              <span className="text-[11px] font-bold text-slate-500">العنصر المحدد للحذف:</span>
              <span className="text-sm font-bold text-slate-900 break-words">{itemName}</span>
              {itemDetails && (
                <div className="text-xs text-slate-600 mt-0.5">
                  {itemDetails}
                </div>
              )}
            </div>
          )}

          {/* Warning Note */}
          {warningNote && (
            <div className="bg-red-50/70 border border-red-200/80 rounded-xl p-3 flex items-start gap-2.5 text-right">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <p className="text-xs font-semibold text-red-800 leading-normal">
                {warningNote}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-colors cursor-pointer bg-white disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors shadow-sm hover:shadow flex items-center gap-2 cursor-pointer border-none disabled:opacity-75 disabled:cursor-wait"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري الحذف...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
