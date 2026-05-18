'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Briefcase, 
  ChevronLeft, 
  ChevronRight, 
  ClipboardList, 
  LayoutDashboard, 
  LogOut, 
  User, 
  PlusCircle
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/employee/dashboard' },
  { icon: Briefcase, label: 'My Projects', href: '/employee/projects' },
  { icon: PlusCircle, label: 'Fill Timesheet', href: '/employee/timesheets/add' },
  { icon: ClipboardList, label: 'My Timesheets', href: '/employee/timesheets' },
  { icon: User, label: 'Profile', href: '/employee/profile' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-slate-900 flex flex-col shrink-0 transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand */}
      <div className="p-6 flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white shrink-0 shadow-lg shadow-indigo-500/20">
          TP
        </div>
        {!collapsed && (
          <span className="text-white font-bold text-lg tracking-tight truncate animate-in fade-in duration-500">
            ChronosSync
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/employee/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0 transition-transform group-hover:scale-110", isActive ? "opacity-100" : "opacity-60")} />
              {!collapsed && (
                <span className={cn("text-sm font-medium whitespace-nowrap", isActive ? "font-semibold" : "")}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Account */}
      <div className="p-4 mt-auto border-t border-slate-800">
        {!collapsed ? (
          <div className="flex items-center space-x-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs text-white uppercase font-bold shrink-0">
              {user?.full_name?.charAt(0) || 'E'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-semibold text-white truncate">{user?.full_name || 'Employee'}</span>
              <span className="text-[10px] text-slate-500 truncate">{user?.email || 'user@chronos.io'}</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto text-slate-500 hover:text-red-400 hover:bg-transparent"
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex justify-center py-4">
             <Button 
              variant="ghost" 
              size="icon" 
              className="text-slate-500 hover:text-red-400"
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute -right-4 top-10 h-8 w-8 rounded-full border border-slate-200 bg-white text-slate-500 shadow-md hover:bg-slate-50"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>
    </aside>
  );
}
