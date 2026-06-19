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
  FileText,
  Fingerprint,
  CheckSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/employee/dashboard' },
  { icon: Briefcase, label: 'My Projects', href: '/employee/projects' },
  { icon: CheckSquare, label: 'My Tasks', href: '/employee/tasks' },
  { icon: ClipboardList, label: 'My Timesheets', href: '/employee/timesheets' },
  { icon: Fingerprint, label: 'Attendance', href: '/employee/attendance' },
  { icon: FileText, label: 'To Do List', href: '/employee/notes' },
  { icon: User, label: 'Profile', href: '/employee/profile' },
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
          "fixed left-0 top-0 z-40 h-screen flex flex-col shrink-0 transition-all duration-300 md:translate-x-0 bg-background border-r border-border",
          collapsed ? "w-20" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >

        {/* Brand */}
        <div className={cn(
          "relative z-10 flex items-center gap-3 border-b border-border transition-all",
          collapsed ? "px-5 py-5 justify-center" : "px-6 py-5"
        )}>
          <div className="relative">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center font-bold text-primary text-xs shrink-0 ring-1 ring-border">
              S
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-background" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="text-foreground font-bold text-base tracking-tight truncate">
                Sambhav<span className="text-primary">PMS</span>
              </span>
              <span className="text-xs font-semibold text-muted-foreground">Employee Portal</span>
            </div>
          )}
        </div>

        {/* Section label */}
        {!collapsed && (
          <div className="px-7 pt-6 pb-2">
            <span className="text-xs font-semibold text-muted-foreground">Main Menu</span>
          </div>
        )}

        {/* Navigation */}
        <nav className={cn("flex-1 px-3 space-y-0.5 relative z-10 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full", collapsed ? "pt-4" : "pt-1")}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/employee/dashboard' && pathname.startsWith(item.href));
            return (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 relative",
                    collapsed && "justify-center px-0",
                    isActive 
                      ? "border-l-2 border-primary bg-primary/[0.03] text-primary" 
                      : "border-l-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-all",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  {!collapsed && (
                    <span className={cn(
                      "text-sm whitespace-nowrap transition-colors",
                      isActive ? "font-semibold" : "font-medium"
                    )}>
                      {item.label}
                    </span>
                  )}
                  {isActive && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary/60" />
                  )}
                </Link>


              </div>
            );
          })}
        </nav>

        {/* Footer / Account */}
        <div className="p-4 mt-auto border-t border-border bg-card">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {user?.full_name?.charAt(0) || 'E'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                <span className="text-sm font-bold text-foreground truncate">
                  {user?.full_name || 'Employee'}
                </span>
                <span className="text-xs text-muted-foreground truncate font-medium">
                  {user?.email || 'user@sambhav.io'}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="shrink-0 h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                onClick={() => {
                  logout();
                  window.location.href = '/login';
                }}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {user?.full_name?.charAt(0) || 'E'}
                </AvatarFallback>
              </Avatar>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                onClick={() => {
                  logout();
                  window.location.href = '/login';
                }}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute -right-3.5 top-10 hidden md:flex h-7 w-7 rounded-full border border-border bg-background text-muted-foreground shadow-lg hover:bg-muted hover:text-foreground hover:shadow-xl transition-all z-50"
          onClick={toggleSidebarCollapse}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </Button>
      </aside>
    </>
  );
}
