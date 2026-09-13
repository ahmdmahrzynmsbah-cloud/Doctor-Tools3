import React, { useState } from 'react';
import { Bell, Menu, Cloud, RefreshCw, CheckCircle2, Moon, Sun } from 'lucide-react';
import { useAppData } from '@/src/context/AppDataContext';
import { useTheme } from '@/src/context/ThemeContext';
import { PWAInstallButton } from '@/src/components/PWAInstallButton';

export default function Header({ onMenuClick, isMobileMenuOpen }: { onMenuClick?: () => void, isMobileMenuOpen?: boolean }) {
  const { notifications, markAllNotificationsRead, syncStatus, syncNow, lastSyncTime } = useAppData();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSyncingManual, setIsSyncingManual] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleManualSync = async () => {
    setIsSyncingManual(true);
    await syncNow();
    setTimeout(() => setIsSyncingManual(false), 800);
  };

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-4 md:px-8 flex items-center justify-between flex-shrink-0 z-10 sticky top-0 print:hidden">
      <div className="flex items-center gap-4 flex-1">
        
        {onMenuClick && (
          <button 
            onClick={onMenuClick}
            className="md:hidden p-2 -mr-2 text-[#475569] hover:bg-[#F1F5F9] rounded-lg cursor-pointer transition-colors bg-transparent border-none block"
            aria-label="القائمة الجانبية"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="hidden sm:block">
          <PWAInstallButton />
        </div>

        {/* Real-Time Multi-Device Sync Indicator with Click-to-Sync */}
        <button 
          onClick={handleManualSync}
          title="اضغط للتحديث والمزامنة الفورية مع جميع الأجهزة والهواتف"
          className="hidden md:flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 px-3 py-1.5 rounded-full text-xs text-emerald-800 transition-colors cursor-pointer"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Cloud className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-semibold">المزامنة السحابية اللحظية متصلة</span>
          <RefreshCw className={`w-3 h-3 text-emerald-600 ${isSyncingManual || syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
          {lastSyncTime && (
            <span className="text-[10px] text-emerald-600/90 font-mono">
              ({lastSyncTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
            </span>
          )}
        </button>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 md:gap-5">
        {/* Mobile sync status pill with tap-to-sync */}
        <button 
          onClick={handleManualSync}
          className="flex md:hidden items-center gap-1.5 bg-emerald-50 active:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] text-emerald-700 font-medium cursor-pointer"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
          <span>متزامن سحابياً</span>
          <RefreshCw className={`w-2.5 h-2.5 text-emerald-600 ${isSyncingManual || syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
        </button>
        
        {/* Quick Dark Mode Toggle Button */}
        <button
          onClick={toggleDarkMode}
          title={isDarkMode ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن (Dark Mode)'}
          className="p-2 text-[#475569] hover:text-[#2563EB] hover:bg-[#F1F5F9] rounded-lg cursor-pointer transition-colors border-none bg-transparent flex items-center justify-center"
          aria-label="تبديل الوضع الداكن"
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-[#F59E0B]" />
          ) : (
            <Moon className="w-5 h-5 text-[#64748B]" />
          )}
        </button>

        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-[#475569] hover:text-[#2563EB] hover:bg-[#F1F5F9] rounded-lg cursor-pointer transition-colors border-none bg-transparent"
          >
            <Bell className="h-6 w-6" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-[#DC2626] rounded-full border-2 border-white"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute left-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-[#E2E8F0] overflow-hidden z-20">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <h3 className="font-bold text-sm text-[#1E293B]">الإشعارات</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => {
                      markAllNotificationsRead();
                      setShowNotifications(false);
                    }} 
                    className="text-[11px] text-[#2563EB] hover:underline font-bold bg-transparent border-none cursor-pointer"
                  >
                    تحديد الكل كمقروء
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div key={n.id} className={`px-4 py-3 border-b border-[#E2E8F0] last:border-0 ${!n.read ? 'bg-[#EFF6FF]' : 'bg-white'}`}>
                      <p className="text-sm font-bold text-[#1E293B]">{n.message}</p>
                      <span className="text-[10px] text-[#94A3B8] mt-1 block" dir="ltr">{new Date(n.date).toLocaleString('ar-EG')}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-[#94A3B8] text-sm">
                    لا توجد إشعارات حالياً
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
