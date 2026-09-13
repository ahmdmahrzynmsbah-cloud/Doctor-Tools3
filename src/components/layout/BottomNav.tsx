import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Package, Users, Factory, MoreHorizontal, Settings } from 'lucide-react';
import { cn } from '@/src/utils/cn';
import { useAppData } from '@/src/context/AppDataContext';

interface BottomNavProps {
  onOpenMore?: () => void;
}

export default function BottomNav({ onOpenMore }: BottomNavProps) {
  const { inventory } = useAppData();
  const lowStockCount = inventory.filter(i => (i.quantity || 0) <= 5).length;

  const navItems = [
    { name: 'الرئيسية', to: '/', icon: LayoutDashboard },
    { name: 'الفواتير', to: '/invoices', icon: FileText },
    { name: 'المخزن', to: '/inventory', icon: Package, badge: lowStockCount > 0 ? lowStockCount : undefined },
    { name: 'العملاء', to: '/customers', icon: Users },
    { name: 'الموردون', to: '/suppliers', icon: Factory },
  ];

  return (
    <nav 
      className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 dark:bg-[#141E33]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#24344D] z-30 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.06)] print:hidden"
      aria-label="شريط التنقل السفلي للهاتف"
    >
      <div className="grid grid-cols-6 items-center h-16 px-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center h-full py-1 text-[11px] font-bold transition-all relative select-none rounded-xl active:scale-95',
                isActive
                  ? 'text-[#2180B2] dark:text-[#38BDF8]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative mb-0.5">
                  <item.icon className={cn('w-5 h-5 transition-transform', isActive ? 'scale-110 stroke-[2.5]' : 'stroke-2')} />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1 -left-2 bg-red-500 text-white text-[9px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shadow-sm animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={cn('truncate max-w-[50px] leading-tight', isActive ? 'font-extrabold text-[#2180B2] dark:text-[#38BDF8]' : 'font-medium')}>
                  {item.name}
                </span>
                {isActive && (
                  <span className="absolute top-1 w-6 h-1 bg-[#2180B2] dark:bg-[#38BDF8] rounded-full" />
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* More Options / Sidebar trigger */}
        <button
          type="button"
          onClick={onOpenMore}
          className="flex flex-col items-center justify-center h-full py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all rounded-xl active:scale-95 bg-transparent border-none cursor-pointer"
        >
          <div className="mb-0.5">
            <MoreHorizontal className="w-5 h-5 stroke-2" />
          </div>
          <span className="truncate max-w-[50px] leading-tight">المزيد</span>
        </button>
      </div>
    </nav>
  );
}
