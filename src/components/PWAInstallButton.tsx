import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-lg bg-[#2180B2] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#1A6B94] transition w-full sm:w-auto justify-center"
      >
        <Download className="w-4 h-4" />
        تثبيت كبرنامج (سطح المكتب/موبايل)
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-lg bg-[#2180B2] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#1A6B94] transition w-full sm:w-auto justify-center"
        >
          <Download className="w-4 h-4" />
          تثبيت التطبيق
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl relative" dir="rtl">
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 left-4 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-lg font-bold text-gray-900 mb-4">تثبيت على الآيفون / الآيباد</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>١. اضغط على زر <strong>المشاركة (Share)</strong> في شريط سفاري السفلي.</p>
                <p>٢. انزل لأسفل واضغط على <strong>الإضافة للشاشة الرئيسية (Add to Home Screen)</strong>.</p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-lg bg-gray-100 py-2.5 text-sm font-bold text-gray-800 hover:bg-gray-200"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
