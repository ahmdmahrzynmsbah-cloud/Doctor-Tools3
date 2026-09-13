import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import SystemUpdateModal from '../SystemUpdateModal';

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F0F4F8] print:bg-white text-[#1E293B] font-sans overflow-hidden print:overflow-visible print:h-auto print:block" dir="rtl">
      {/* System Update Announcement Popup */}
      <SystemUpdateModal />

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-[#0F172A]/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar wrapper */}
      <div className={`fixed inset-y-0 right-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} print:hidden`}>
        <Sidebar onCloseMobile={() => setIsMobileMenuOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 print:block">
        <Header 
          onMenuClick={() => setIsMobileMenuOpen(true)} 
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <main className="flex-1 p-3.5 sm:p-5 md:p-8 pb-24 md:pb-8 print:p-0 overflow-y-auto print:overflow-visible print:h-auto space-y-4 sm:space-y-6 print:space-y-0 no-scrollbar">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav onOpenMore={() => setIsMobileMenuOpen(true)} />
    </div>
  );
}

