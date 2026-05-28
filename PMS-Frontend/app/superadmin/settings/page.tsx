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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useRouter } from 'next/navigation';

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
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await axios.get(`${api}/auth/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/update-profile`,
        {
          full_name: formData.full_name,
          email: formData.email
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
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
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/update-profile`,
        { is_mfa_enabled: checked },
        { headers: { Authorization: `Bearer ${token}` } }
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
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/update-password`,
        {
          current_password: currentPassword,
          new_password: newPassword
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
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
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await axios.delete(`${api}/auth/sessions/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Logged out from all other devices successfully");
      fetchSessions();
    } catch (error) {
      toast.error("Failed to revoke other sessions");
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await axios.delete(`${api}/auth/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Session revoked successfully");
      fetchSessions();
    } catch (error) {
      toast.error("Failed to revoke session");
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase leading-none">Settings</h2>
          <p className="text-slate-500 font-medium text-sm mt-2">Manage your profile and account security.</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'profile' && (
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-slate-900 text-white hover:bg-slate-800 h-11 rounded-xl px-6 shadow-xl shadow-slate-900/10 font-bold text-[10px] uppercase tracking-widest transition-all hover:-translate-y-1 w-full sm:w-auto sm:min-w-[140px]"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                "Save Changes"
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Simple Navigation */}
        <div className="lg:col-span-3 flex lg:flex-col gap-2 sm:gap-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
           {[
             { id: 'profile', icon: User, label: 'Profile', desc: 'Your personal information' },
             { id: 'security', icon: Lock, label: 'Security', desc: 'Password and protection' },
           ].map((item) => (
             <button
               key={item.id}
               onClick={() => setActiveTab(item.id as any)}
               className={cn(
                  "min-w-[160px] lg:min-w-0 w-full text-left p-3 sm:p-4 rounded-xl transition-all group border flex-shrink-0 lg:flex-shrink",
                 activeTab === item.id 
                   ? "bg-white shadow-lg shadow-slate-200/40 border-slate-200" 
                   : "bg-transparent border-transparent hover:bg-slate-100/50"
               )}
             >
                <div className="flex items-start gap-3">
                   <div className={cn(
                     "p-2.5 rounded-lg transition-colors",
                     activeTab === item.id ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-900 group-hover:shadow-sm"
                   )}>
                      <item.icon className="h-4 w-4" />
                   </div>
                   <div>
                      <h3 className={cn(
                        "text-xs font-black uppercase tracking-widest",
                        activeTab === item.id ? "text-slate-900" : "text-slate-600 group-hover:text-slate-900"
                      )}>{item.label}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                   </div>
                </div>
             </button>
           ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
           {activeTab === 'profile' && (
             <motion.div
               initial={{ opacity: 0, y: 5 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0 }}
             >
                <Card className="border-none rounded-[1.5rem] shadow-xl shadow-slate-200/40 bg-white overflow-hidden">
                   <CardHeader className="p-4 sm:p-8 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-inner">
                          <UserCircle className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight">Personal Details</CardTitle>
                          <CardDescription className="text-xs font-medium mt-1">
                             Update your name and email address
                          </CardDescription>
                        </div>
                      </div>
                   </CardHeader>
                   <CardContent className="p-4 sm:p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-2xl">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                              <User className="h-3 w-3 text-indigo-500" /> Full Name
                            </Label>
                            <Input 
                              name="full_name"
                              value={formData.full_name}
                              onChange={handleChange}
                              placeholder="Enter your full name" 
                              className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-xs font-bold shadow-sm" 
                            />
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                              <Mail className="h-3 w-3 text-indigo-500" /> Email Address
                            </Label>
                            <Input 
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              type="email" 
                              placeholder="your.email@example.com" 
                              className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-xs font-bold shadow-sm" 
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
               transition={{ duration: 0 }}
               className="space-y-6 sm:space-y-8"
             >
                <Card className="border-none rounded-[1.5rem] shadow-xl shadow-slate-200/40 bg-white overflow-hidden">
                   <CardHeader className="p-4 sm:p-8 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20">
                          <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight">Security Credentials</CardTitle>
                          <CardDescription className="text-xs font-medium mt-1">
                             Update your password and protect your account
                          </CardDescription>
                        </div>
                      </div>
                   </CardHeader>
                    <CardContent className="p-4 sm:p-8 space-y-6">
                       <div className="grid grid-cols-1 gap-6 w-full sm:max-w-md">
                         <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                               Current Password
                             </Label>
                             <div className="relative">
                               <Input 
                                 type={showCurrentPassword ? "text" : "password"} 
                                 value={currentPassword}
                                 onChange={(e) => setCurrentPassword(e.target.value)}
                                 placeholder="••••••••" 
                                 className="h-12 pr-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-xs font-bold shadow-sm w-full" 
                               />
                               <button
                                 type="button"
                                 onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none flex items-center justify-center"
                               >
                                 {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                               </button>
                             </div>
                          </div>
                          <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                               New Password
                             </Label>
                             <div className="relative">
                               <Input 
                                 type={showNewPassword ? "text" : "password"} 
                                 value={newPassword}
                                 onChange={(e) => setNewPassword(e.target.value)}
                                 placeholder="••••••••" 
                                 className="h-12 pr-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-xs font-bold shadow-sm w-full" 
                               />
                               <button
                                 type="button"
                                 onClick={() => setShowNewPassword(!showNewPassword)}
                                 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none flex items-center justify-center"
                               >
                                 {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                               </button>
                             </div>
                          </div>
                          <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                               Confirm New Password
                             </Label>
                             <div className="relative">
                               <Input 
                                 type={showConfirmPassword ? "text" : "password"} 
                                 value={confirmPassword}
                                 onChange={(e) => setConfirmPassword(e.target.value)}
                                 placeholder="••••••••" 
                                 className="h-12 pr-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-xs font-bold shadow-sm w-full" 
                               />
                               <button
                                 type="button"
                                 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none flex items-center justify-center"
                               >
                                 {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                               </button>
                             </div>
                          </div>
                      </div>
                      <div className="pt-6 border-t border-slate-100">
                         <Button 
                           onClick={handleUpdatePassword}
                           disabled={isSaving}
                           className="bg-slate-900 text-white hover:bg-slate-800 h-11 rounded-xl px-8 font-bold text-[10px] uppercase tracking-widest transition-all"
                         >
                            {isSaving ? "Updating..." : "Update Password"}
                         </Button>
                      </div>
                   </CardContent>
                 </Card>

                 <Card className="border-none rounded-[1.5rem] shadow-xl shadow-slate-200/40 bg-white overflow-hidden p-4 sm:p-8 flex flex-col items-start gap-6 border border-white mt-6">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-4 sm:space-x-6">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                           <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                           <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Two-Factor Authentication</h4>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Require a 6-digit OTP sent to your email.</p>
                        </div>
                     </div>
                     <Switch 
                         checked={user?.is_mfa_enabled || false} 
                         onCheckedChange={handleToggleMFA} 
                     />
                    </div>
                 </Card>

                 <Card className="border-none rounded-[1.5rem] shadow-xl shadow-slate-200/40 bg-white overflow-hidden p-4 sm:p-8 flex flex-col items-start gap-6 border border-white mt-6">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-4 sm:space-x-6">
                        <div className="p-3 bg-red-50 rounded-xl text-red-600">
                           <LogOut className="h-6 w-6" />
                        </div>
                        <div>
                           <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Active Sessions</h4>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Logged in on other devices? You can sign out here.</p>
                        </div>
                     </div>
                      <Button 
                        onClick={handleLogoutAll}
                        className="bg-white text-red-600 hover:bg-red-50 border border-red-100 rounded-xl h-9 px-4 font-black text-[9px] uppercase tracking-widest shadow-sm w-full sm:w-auto"
                      >
                         Revoke All Others
                     </Button>
                    </div>

                    <div className="w-full space-y-3">
                      {isSessionsLoading ? (
                        <div className="py-4 flex justify-center text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
                      ) : sessions.length === 0 ? (
                        <div className="py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">No active sessions found</div>
                      ) : (
                        sessions.map((session) => (
                          <div key={session.session_id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 gap-4 hover:bg-white hover:border-slate-200 transition-colors">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800">{session.device_info || 'Unknown Device'}</span>
                                {session.is_current && (
                                  <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">This Device</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{session.ip_address}</span>
                                <span className="text-slate-300">•</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                  Last active: {new Date(session.last_active_at).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            {!session.is_current && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleRevokeSession(session.session_id)}
                                className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all w-full sm:w-auto"
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
        </div>
      </div>
    </div>
  );
}
