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
  Settings, 
  Users,
  UserCheck,
  BookOpen,
  Sparkles,
  StickyNote,
  ShieldAlert,
  Fingerprint
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/superadmin/dashboard' },
  { icon: ShieldAlert, label: 'Admins', href: '/superadmin/admins' },
  { icon: Users, label: 'Employees', href: '/superadmin/employees' },
  { icon: UserCheck, label: 'Reporting Managers', href: '/superadmin/reporting-managers' },
  { icon: Briefcase, label: 'Projects', href: '/superadmin/projects' },
  { icon: ClipboardList, label: 'Timesheets', href: '/superadmin/timesheets' },
  { icon: Fingerprint, label: 'Attendance', href: '/superadmin/attendance' },
  { icon: BookOpen, label: 'Templates', href: '/superadmin/templates' },
  { icon: Sparkles, label: 'Activity Logs', href: '/superadmin/logs' },
  { icon: StickyNote, label: 'Employee To Do List', href: '/superadmin/notes' },
  { icon: Settings, label: 'Settings', href: '/superadmin/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebarCollapse, sidebarOpen, setSidebarOpen } = useUIStore();
  const collapsed = sidebarCollapsed;

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside 
        className={cn(
          "fixed left-0 top-0 z-40 h-screen flex flex-col shrink-0 transition-all duration-300 md:translate-x-0",
          "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950",
          collapsed ? "w-20" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Decorative glow */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-indigo-500/5 to-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-indigo-500/3 to-transparent" />

        {/* Brand */}
        <div className={cn(
          "relative z-10 flex items-center gap-3 border-b border-white/5 transition-all",
          collapsed ? "px-5 py-5 justify-center" : "px-6 py-5"
        )}>
          <div className="relative">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center font-black text-white text-xs shrink-0 shadow-lg shadow-indigo-500/25 ring-1 ring-white/10">
              S
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-950" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="text-white font-black text-base tracking-tight truncate">
                Sambhav<span className="text-indigo-400">PMS</span>
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Admin Panel</span>
            </div>
          )}
        </div>

        {/* Section label */}
        {!collapsed && (
          <div className="px-7 pt-6 pb-2">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Main Menu</span>
          </div>
        )}

        {/* Navigation */}
        <nav className={cn("flex-1 px-3 space-y-0.5 relative z-10", collapsed ? "pt-4" : "pt-1")}>
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            
            return (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 relative",
                    collapsed && "justify-center px-0",
                    isActive 
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/20" 
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full -ml-3" />
                  )}
                  <item.icon className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-all",
                    isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                  )} />
                  {!collapsed && (
                    <span className={cn(
                      "text-[13px] whitespace-nowrap transition-colors",
                      isActive ? "font-bold" : "font-medium"
                    )}>
                      {item.label}
                    </span>
                  )}
                  {isActive && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
                  )}
                </Link>

                {/* Tooltip for collapsed mode */}
                {collapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 ring-1 ring-white/10">
                    {item.label}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-800 rotate-45 ring-1 ring-white/10 ring-r-0 ring-t-0" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer / Account */}
        <div className="relative z-10 p-3 mt-auto border-t border-white/5">
          {!collapsed ? (
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.03] ring-1 ring-white/5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] text-white uppercase font-black shrink-0 shadow-sm ring-1 ring-white/10">
                {user?.full_name?.charAt(0) || 'A'}
              </div>
              <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                <span className="text-xs font-bold text-white truncate">
                  {user?.full_name || 'Admin User'}
                </span>
                <span className="text-[10px] text-slate-500 truncate font-medium">
                  {user?.email || 'admin@sambhav.io'}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="shrink-0 h-8 w-8 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                onClick={() => {
                  logout();
                  window.location.href = '/login';
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] text-white uppercase font-black shrink-0 ring-1 ring-white/10">
                {user?.full_name?.charAt(0) || 'A'}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                onClick={() => {
                  logout();
                  window.location.href = '/login';
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute -right-3.5 top-10 hidden md:flex h-7 w-7 rounded-full border border-slate-200 bg-white text-slate-400 shadow-lg hover:bg-slate-50 hover:text-slate-600 hover:shadow-xl transition-all z-50"
          onClick={toggleSidebarCollapse}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </Button>
      </aside>
    </>
  );
}
