'use client';

import { cn } from '@/lib/utils';
import { 
  User, 
  Lock,
  Mail,
  Edit2,
  ShieldCheck,
  LogOut,
  UserCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SettingsLayout } from '@/components/layout/SettingsLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import { handleApiError } from '@/utils/handleApiError';
import { ErrorState } from '@/components/ui/error-state';
import { useRouter } from 'next/navigation';
import { UAParser } from 'ua-parser-js';

export default function SettingsPage() {
  const { user, token, updateUser, logout } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Session state
  const [sessions, setSessions] = useState<any[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);

  // Local state for form fields
  const [formData, setFormData] = useState({
    full_name: '',
    email: ''
  });

  const fetchSessions = async () => {
    if (!token) return;
    setIsSessionsLoading(true);
    try {
            const res = await api.get(`/auth/sessions`);
      setSessions(res.data);
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      setIsSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      console.log("Current User in Settings:", user);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        full_name: user.full_name || 'Not Set',
        email: user.email || 'Not Set'
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'security') {
      fetchSessions();
    }
  }, [activeTab, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!token) {
      toast.error("You must be logged in to update your profile");
      return;
    }

    const fullName = formData.full_name.trim();
    if (!fullName) {
      toast.error("Full name is required");
      return;
    }
    if (/\d/.test(fullName)) {
      toast.error("Full name cannot contain numbers");
      return;
    }

    const email = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      toast.error("Email is required");
      return;
    } else if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.put(
        `/auth/update-profile`,
        {
          full_name: formData.full_name,
          email: formData.email
        }
      );

      // Update global store with fresh data from server
      updateUser({
        full_name: response.data.full_name,
        email: response.data.email
      } as any);

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Update Error:", error);
      let message = "Failed to update profile";
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          message = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          message = error.response.data.detail[0]?.msg || "Validation error";
        }
      }
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleMFA = async (checked: boolean) => {
    try {
      await api.put(
        `/auth/update-profile`,
        { is_mfa_enabled: checked }
      );
      updateUser({ is_mfa_enabled: checked } as any);
      toast.success(checked ? "Two-Factor Authentication Enabled" : "Two-Factor Authentication Disabled");
    } catch (error) {
      toast.error("Failed to update Two-Factor Authentication");
    }
  };

  const handleUpdatePassword = async () => {
    if (!token) {
      toast.error("You must be logged in to update your password");
      return;
    }
    if (!currentPassword) {
      toast.error("Current password is required");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setIsSaving(true);
    try {
      await api.put(
        `/auth/update-password`,
        {
          current_password: currentPassword,
          new_password: newPassword
        }
      );
      toast.success("Password updated successfully!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error("Update Password Error:", error);
      let message = "Failed to update password";
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          message = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          message = error.response.data.detail[0]?.msg || "Validation error";
        }
      }
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoutAll = async () => {
    try {
            await api.delete(`/auth/sessions/all`);
      toast.success("Logged out from all other devices successfully");
      fetchSessions();
    } catch (error) {
      toast.error("Failed to revoke other sessions");
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
            await api.delete(`/auth/sessions/${sessionId}`);
      toast.success("Session revoked successfully");
      fetchSessions();
    } catch (error) {
      toast.error("Failed to revoke session");
    }
  };

  return (
    <SettingsLayout
      title="Settings"
      description="Manage your profile and account security."
      headerActions={
        activeTab === 'profile' && (
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary text-white hover:bg-indigo-700 h-9 rounded-md px-4 font-semibold text-sm transition-all"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </div>
            ) : (
              "Save Changes"
            )}
          </Button>
        )
      }
      navigation={
        <div className="flex lg:flex-col gap-2 sm:gap-3 overflow-x-auto overflow-y-hidden lg:overflow-visible pb-2 lg:pb-0 scroll-smooth snap-x">
           {[
             { id: 'profile', icon: User, label: 'Profile', desc: 'Your personal information' },
             { id: 'security', icon: Lock, label: 'Security', desc: 'Password and protection' },
           ].map((item) => (
             <button
               key={item.id}
               onClick={() => setActiveTab(item.id as any)}
               className={cn(
                  "flex-shrink-0 snap-start flex items-center gap-3 lg:w-full text-left p-3 sm:p-4 rounded-xl transition-all group border lg:flex-shrink",
                 activeTab === item.id 
                   ? "bg-background shadow-sm border-border" 
                   : "bg-transparent border-transparent hover:bg-muted"
               )}
             >
                <div className={cn(
                  "p-2.5 rounded-lg transition-colors shrink-0",
                  activeTab === item.id ? "bg-indigo-50 text-primary" : "bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground group-hover:shadow-sm"
                )}>
                   <item.icon className="h-4 w-4" />
                </div>
                <div className="whitespace-nowrap pr-2">
                   <h3 className={cn(
                     "text-sm font-semibold",
                     activeTab === item.id ? "text-foreground" : "text-slate-600 group-hover:text-foreground"
                   )}>{item.label}</h3>
                   <p className="text-xs text-muted-foreground mt-0.5 hidden lg:block">{item.desc}</p>
                </div>
             </button>
           ))}
        </div>
      }
    >
       {activeTab === 'profile' && (
         <motion.div
           initial={{ opacity: 0, y: 5 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.2 }}
         >
            <Card className="rounded-xl shadow-sm border-border bg-background overflow-hidden">
               <CardHeader className="p-6 border-b border-border bg-background">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-indigo-50 text-primary flex items-center justify-center border border-indigo-100">
                      <UserCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-foreground">Personal Details</CardTitle>
                      <CardDescription className="text-sm mt-1">
                         Update your name and email address
                      </CardDescription>
                    </div>
                  </div>
               </CardHeader>
               <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-2xl">
                     <div className="space-y-2">
                        <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" /> Full Name
                        </Label>
                        <Input 
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          placeholder="Enter your full name" 
                          className="h-10 rounded-md border-border focus:bg-background transition-all text-sm" 
                        />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" /> Email Address
                        </Label>
                        <Input 
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          type="email" 
                          placeholder="your.email@example.com" 
                          className="h-10 rounded-md border-border focus:bg-background transition-all text-sm" 
                        />
                     </div>
                  </div>
               </CardContent>
            </Card>
         </motion.div>
       )}

       {activeTab === 'security' && (
         <motion.div
           initial={{ opacity: 0, y: 5 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.2 }}
           className="space-y-6"
         >
            <Card className="rounded-xl shadow-sm border-border bg-background overflow-hidden">
               <CardHeader className="p-6 border-b border-border bg-background">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-muted text-muted-foreground flex items-center justify-center border border-border">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-foreground">Security Credentials</CardTitle>
                      <CardDescription className="text-sm mt-1">
                         Update your password and protect your account
                      </CardDescription>
                    </div>
                  </div>
               </CardHeader>
                <CardContent className="p-6 space-y-6">
                   <div className="grid grid-cols-1 gap-6 w-full sm:max-w-md">
                     <div className="space-y-2">
                         <Label className="text-sm font-semibold text-foreground">
                           Current Password
                         </Label>
                         <div className="relative">
                           <Input 
                             type={showCurrentPassword ? "text" : "password"} 
                             value={currentPassword}
                             onChange={(e) => setCurrentPassword(e.target.value)}
                             placeholder="••••••••" 
                             className="h-10 pr-10 rounded-md border-border transition-all text-sm w-full" 
                           />
                           <button
                             type="button"
                             onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                             className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-600 focus:outline-none flex items-center justify-center"
                           >
                             {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                           </button>
                         </div>
                      </div>
                      <div className="space-y-2">
                         <Label className="text-sm font-semibold text-foreground">
                           New Password
                         </Label>
                         <div className="relative">
                           <Input 
                             type={showNewPassword ? "text" : "password"} 
                             value={newPassword}
                             onChange={(e) => setNewPassword(e.target.value)}
                             placeholder="••••••••" 
                             className="h-10 pr-10 rounded-md border-border transition-all text-sm w-full" 
                           />
                           <button
                             type="button"
                             onClick={() => setShowNewPassword(!showNewPassword)}
                             className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-600 focus:outline-none flex items-center justify-center"
                           >
                             {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                           </button>
                         </div>
                      </div>
                      <div className="space-y-2">
                         <Label className="text-sm font-semibold text-foreground">
                           Confirm New Password
                         </Label>
                         <div className="relative">
                           <Input 
                             type={showConfirmPassword ? "text" : "password"} 
                             value={confirmPassword}
                             onChange={(e) => setConfirmPassword(e.target.value)}
                             placeholder="••••••••" 
                             className="h-10 pr-10 rounded-md border-border transition-all text-sm w-full" 
                           />
                           <button
                             type="button"
                             onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                             className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-600 focus:outline-none flex items-center justify-center"
                           >
                             {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                           </button>
                         </div>
                      </div>
                  </div>
                  <div className="pt-6 border-t border-border">
                     <Button 
                       onClick={handleUpdatePassword}
                       disabled={isSaving}
                       className="bg-slate-900 text-white hover:bg-slate-800 h-9 rounded-md px-6 font-semibold text-sm transition-all"
                     >
                        {isSaving ? "Updating..." : "Update Password"}
                     </Button>
                  </div>
               </CardContent>
             </Card>

             <Card className="rounded-xl shadow-sm border-border bg-background overflow-hidden p-6 flex flex-col items-start gap-6">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
                       <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                       <h4 className="text-base font-bold text-foreground">Two-Factor Authentication</h4>
                       <p className="text-sm text-muted-foreground mt-0.5">Require a 6-digit OTP sent to your email.</p>
                    </div>
                 </div>
                 <Switch 
                     checked={user?.is_mfa_enabled || false} 
                     onCheckedChange={handleToggleMFA} 
                 />
                </div>
             </Card>

             <Card className="rounded-xl shadow-sm border-border bg-background overflow-hidden p-6 flex flex-col items-start gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="p-2 bg-red-50 rounded-lg text-red-600 border border-red-100 flex-shrink-0">
                       <LogOut className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                       <h4 className="text-base font-bold text-foreground truncate">Active Sessions</h4>
                       <p className="text-sm text-muted-foreground mt-0.5 truncate">Logged in on other devices? You can sign out here.</p>
                    </div>
                 </div>
                  <Button 
                    onClick={handleLogoutAll}
                    variant="outline"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 rounded-md h-9 px-4 font-semibold text-sm w-full sm:w-auto flex-shrink-0"
                  >
                     Revoke All Others
                 </Button>
                </div>

                <div className="w-full space-y-3">
                  {isSessionsLoading ? (
                    <div className="py-4 flex justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
                  ) : sessions.length === 0 ? (
                    <div className="py-4 text-sm text-muted-foreground text-center">No active sessions found</div>
                  ) : (
                    sessions.map((session) => (
                      <div key={session.session_id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border border-border bg-slate-50/50 gap-4 hover:bg-muted transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {(() => {
                                if (!session.device_info || session.device_info === 'Unknown Device') return 'Unknown Device';
                                const parser = new UAParser(session.device_info);
                                const browser = parser.getBrowser();
                                const os = parser.getOS();
                                const device = parser.getDevice();
                                
                                const browserStr = browser.name ? `${browser.name} ${browser.version?.split('.')[0] || ''}` : '';
                                const osStr = os.name ? `${os.name} ${os.version || ''}` : '';
                                const isMobile = os.name === 'iOS' || os.name === 'Android' || device.type === 'mobile';
                                const deviceType = device.vendor || device.model ? `${device.vendor || ''} ${device.model || ''}`.trim() : (isMobile ? 'Mobile Device' : 'Desktop/Laptop');
                                
                                return [browserStr, osStr, deviceType].filter(Boolean).join(' • ') || session.device_info;
                              })()}
                            </span>
                            {session.is_current && (
                              <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">This Device</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{session.ip_address}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs text-muted-foreground">
                              Last active: {new Date(session.last_active_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        {!session.is_current && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRevokeSession(session.session_id)}
                            className="h-8 rounded-md text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all w-full sm:w-auto"
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
            </Card>
         </motion.div>
       )}
    </SettingsLayout>
  );
}
