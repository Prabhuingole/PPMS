'use client';

import { Bell, Search, User, LogOut, Settings as SettingsIcon, Menu, Check, CheckCircle2, Info, AlertCircle, Clock, Trash2, CheckSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { usePathname, useRouter } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';
export function Navbar() {
  const { user, isAuthenticated, logout, _hasHydrated, token } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const isAdminOrSuperadmin = ['superadmin', 'admin'].includes(user?.role || '');
  const profilePath = isAdminOrSuperadmin ? '/superadmin/settings' : '/employee/profile';
  const settingsPath = isAdminOrSuperadmin ? '/superadmin/settings' : '/employee/profile';

  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = async () => {
    if (!isAuthenticated || !token) return;
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await axios.get(`${api}/inbox/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const sorted = res.data.sort((a: any, b: any) => {
        const priorityScore: Record<string, number> = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        const pA = priorityScore[a.priority || 'LOW'] || 0;
        const pB = priorityScore[b.priority || 'LOW'] || 0;
        if (pA !== pB) return pB - pA;
        const dateA = new Date(a.created_at + (!a.created_at.endsWith('Z') ? 'Z' : '')).getTime();
        const dateB = new Date(b.created_at + (!b.created_at.endsWith('Z') ? 'Z' : '')).getTime();
        return dateB - dateA;
      });
      setNotifications(sorted);
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error(error.response?.data?.detail || 'Session expired or access denied.');
        logout();
        localStorage.removeItem('auth-storage');
        router.push('/login');
      } else {
        console.error('Failed to fetch notifications', error.response?.data || error.message);
      }
    }
  };

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      fetchNotifications();

      const handleWsUpdate = (e: any) => {
        if (e.detail?.event === 'TIMESHEETS_UPDATED') {
          fetchNotifications();
        }
        if (e.detail?.event === 'ACCOUNT_DEACTIVATED' && String(e.detail?.user_id) === String(user?.id)) {
          toast.error('Your account has been deactivated. Logging out...', { duration: 5000 });
          logout();
          localStorage.removeItem('auth-storage');
          window.location.href = '/login';
        }
      };

      window.addEventListener('WS_UPDATE', handleWsUpdate);
      return () => window.removeEventListener('WS_UPDATE', handleWsUpdate);
    }
  }, [_hasHydrated, isAuthenticated]);

  const markAsRead = async (id: number) => {
    if (!token) return;
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await axios.put(`${api}/inbox/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleNotificationClick = async (notif: any) => {
    if (notif.action_url) {
      router.push(notif.action_url);
    }
    await markAsRead(notif.id);
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await axios.put(`${api}/inbox/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to clear notifications');
    }
  };

  const getBreadcrumb = () => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) return 'Internal System';
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' ')).join(' / ');
  };

  const { toggleSidebar } = useUIStore();

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
      <div className="flex items-center space-x-2 md:space-x-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        <ThemeToggle />
        <Popover>
          <PopoverTrigger className="relative group cursor-pointer outline-none border-none bg-transparent">
            <div className="w-10 h-10 bg-muted/30 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative">
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-white">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 rounded-xl shadow-xl border-border" sideOffset={8}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50 rounded-t-xl">
              <div className="flex flex-col">
                <span className="font-bold text-foreground text-sm">Notifications</span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {notifications.length} Unread
                </span>
              </div>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={markAllAsRead}
                    className="h-8 text-xs text-primary hover:text-indigo-700 hover:bg-indigo-50 font-semibold px-2"
                  >
                    <CheckSquare className="mr-1.5 h-3.5 w-3.5" />
                    Clear All
                  </Button>
                )}
                <PopoverClose className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-8 w-8 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </PopoverClose>
              </div>
            </div>
            
            <div className="max-h-[350px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-12 h-12 bg-muted/30 rounded-full flex items-center justify-center mb-3">
                    <Bell className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground">All caught up!</p>
                  <p className="text-xs text-muted-foreground mt-1">No new notifications to show.</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      onClick={() => handleNotificationClick(notif)}
                      className="flex items-start gap-3 p-4 hover:bg-muted transition-colors group relative cursor-pointer"
                    >
                      <div className="shrink-0 mt-0.5">
                        {notif.type === 'success' ? (
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          </div>
                        ) : notif.type === 'warning' ? (
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                          </div>
                        ) : notif.type === 'error' ? (
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Info className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center flex-wrap gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {notif.title}
                          </p>
                          {notif.priority && notif.priority !== 'LOW' && (
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest shrink-0",
                              notif.priority === 'URGENT' ? "bg-red-100 text-red-700" :
                              notif.priority === 'HIGH' ? "bg-orange-100 text-orange-700" :
                              "bg-amber-100 text-amber-700"
                            )}>
                              {notif.priority}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[10px] font-medium text-muted-foreground mt-2 flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          {new Date(notif.created_at + (!notif.created_at.endsWith('Z') ? 'Z' : '')).toLocaleDateString()} {new Date(notif.created_at + (!notif.created_at.endsWith('Z') ? 'Z' : '')).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notif.id);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
                        title="Dismiss"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none">
            <Avatar className="h-10 w-10 border-2 border-border hover:border-border transition-all cursor-pointer">
              <AvatarFallback className="bg-muted text-muted-foreground font-bold text-xs">
                {user?.full_name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl shadow-xl border-border">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-semibold text-foreground">
                <p>{user?.full_name}</p>
                <p className="text-[10px] text-muted-foreground font-normal">{user?.email}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="py-2.5 cursor-pointer" onClick={() => router.push(profilePath)}>
              <User className="mr-2 h-4 w-4 text-muted-foreground" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2.5 cursor-pointer" onClick={() => router.push(settingsPath)}>
              <SettingsIcon className="mr-2 h-4 w-4 text-muted-foreground" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="py-2.5 text-red-600 focus:text-red-600 cursor-pointer"
              onClick={() => {
                logout();
                localStorage.removeItem('auth-storage');
                window.location.href = '/login';
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
