'use client';

import { Bell, Search, User, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();

  const getBreadcrumb = () => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) return 'Internal System';
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' ')).join(' / ');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm shadow-slate-100">
      <div className="flex items-center space-x-2 text-slate-500 text-sm">
        <span className="hidden md:inline">Internal System</span>
        <span className="opacity-40 hidden md:inline">/</span>
        <span className="text-slate-900 font-medium">{getBreadcrumb()}</span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative group">
          <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none">
            <Avatar className="h-10 w-10 border-2 border-slate-100 hover:border-slate-200 transition-all cursor-pointer">
              <AvatarFallback className="bg-slate-900 text-white font-bold text-xs">
                {user?.full_name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl shadow-xl border-slate-200">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-semibold text-slate-900">
                <p>{user?.full_name}</p>
                <p className="text-[10px] text-slate-500 font-normal">{user?.email}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="py-2.5 cursor-pointer">
              <User className="mr-2 h-4 w-4 text-slate-400" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2.5 cursor-pointer">
              <SettingsIcon className="mr-2 h-4 w-4 text-slate-400" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="py-2.5 text-red-600 focus:text-red-600 cursor-pointer"
              onClick={() => {
                logout();
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
