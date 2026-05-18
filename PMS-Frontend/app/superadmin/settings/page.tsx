'use client';

import { cn } from '@/lib/utils';
import { 
  User, 
  Lock,
  Mail,
  Edit2,
  ShieldCheck,
  LogOut,
  UserCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function SettingsPage() {
  const { user, token, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for form fields
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    about: ''
  });

  useEffect(() => {
    if (user) {
      console.log("Current User in Settings:", user);
      setFormData({
        full_name: user.full_name || 'Not Set',
        email: user.email || 'Not Set',
        about: (user as any).about || 'Not Set'
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!token) {
      toast.error("You must be logged in to update your profile");
      return;
    }

    setIsSaving(true);
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/update-profile`,
        {
          full_name: formData.full_name,
          email: formData.email,
          bio: formData.about
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
        email: response.data.email,
        bio: response.data.bio
      } as any);

      toast.success("Settings saved successfully!");
    } catch (error: any) {
      console.error("Save Error:", error);
      const message = error.response?.data?.detail || "Failed to save changes";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase leading-none">Settings</h2>
          <p className="text-slate-500 font-medium text-sm mt-2">Manage your profile and account security.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-slate-900 text-white hover:bg-slate-800 h-11 rounded-xl px-6 shadow-xl shadow-slate-900/10 font-bold text-[10px] uppercase tracking-widest transition-all hover:-translate-y-1 min-w-[140px]"
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Simple Navigation */}
        <div className="lg:col-span-3 space-y-3">
           {[
             { id: 'profile', icon: User, label: 'Profile', desc: 'Your personal information' },
             { id: 'security', icon: Lock, label: 'Security', desc: 'Password and protection' },
           ].map((item) => (
             <button
               key={item.id}
               onClick={() => setActiveTab(item.id as any)}
               className={cn(
                 "w-full text-left p-4 rounded-xl transition-all group border",
                 activeTab === item.id 
                   ? "bg-white shadow-lg shadow-slate-200/40 border-slate-200" 
                   : "bg-transparent border-transparent hover:bg-slate-100/50"
               )}
             >
               <div className="flex items-center space-x-3">
                  <div className={cn(
                    "p-2.5 rounded-lg transition-colors",
                    activeTab === item.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-slate-900"
                  )}>
                     <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className={cn("text-[10px] font-black uppercase tracking-widest", activeTab === item.id ? "text-slate-900" : "text-slate-500")}>{item.label}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">{item.desc}</div>
                  </div>
               </div>
             </button>
           ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
           {activeTab === 'profile' ? (
             <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               key="profile"
             >
                <Card className="border-none rounded-[1.5rem] shadow-xl shadow-slate-200/40 bg-white overflow-hidden border border-white">
                   <CardHeader className="p-8 border-b border-slate-100 bg-slate-50/30">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20">
                          <UserCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-black uppercase tracking-tight">Personal Details</CardTitle>
                          <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                             Update your primary identity information
                          </CardDescription>
                        </div>
                      </div>
                   </CardHeader>
                   <CardContent className="p-8 space-y-8">
                      <div className="flex flex-col md:flex-row gap-8 items-start">
                         <div className="relative group">
                            <div className="w-32 h-32 rounded-[1.5rem] bg-slate-100 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 transition-all cursor-pointer overflow-hidden group">
                               <User className="h-10 w-10 mb-2 opacity-50 group-hover:scale-110 transition-transform" />
                               <span className="text-[8px] font-black uppercase tracking-widest">Change Photo</span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-slate-900 text-white h-8 w-8 rounded-xl flex items-center justify-center shadow-xl cursor-pointer hover:scale-110 transition-all">
                               <Edit2 className="h-3.5 w-3.5" />
                            </div>
                         </div>
                         
                         <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                            <div className="space-y-2">
                               <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                 <User className="h-3 w-3" /> Full Name
                               </Label>
                               <Input 
                                 name="full_name"
                                 value={formData.full_name}
                                 onChange={handleChange}
                                 placeholder="Full Name" 
                                 className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-xs font-bold shadow-sm" 
                               />
                            </div>
                            <div className="space-y-2">
                               <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                 <Mail className="h-3 w-3" /> Email Address
                               </Label>
                               <Input 
                                 name="email"
                                 value={formData.email}
                                 onChange={handleChange}
                                 placeholder="Email Address" 
                                 className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-xs font-bold shadow-sm" 
                               />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                               <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                 <Edit2 className="h-3 w-3" /> About You
                               </Label>
                               <textarea 
                                 name="about"
                                 value={formData.about}
                                 onChange={handleChange}
                                 placeholder="Tell us a bit about yourself..."
                                 className="w-full min-h-[100px] p-4 text-xs font-medium rounded-xl border border-slate-200 outline-none focus:border-slate-900 transition-all bg-slate-50/50 focus:bg-white shadow-sm"
                               ></textarea>
                            </div>
                         </div>
                      </div>

                      <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                              <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                               <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Account Status</h4>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Your account is fully verified</p>
                            </div>
                         </div>
                         <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      </div>
                   </CardContent>
                </Card>
             </motion.div>
           ) : (
             <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               key="security"
               className="space-y-8"
             >
                <Card className="border-none rounded-[1.5rem] shadow-xl shadow-slate-200/40 bg-white overflow-hidden border border-white">
                   <CardHeader className="p-8 border-b border-slate-100 bg-slate-50/30">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20">
                          <Lock className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-black uppercase tracking-tight">Security Settings</CardTitle>
                          <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                             Update your password and protect your account
                          </CardDescription>
                        </div>
                      </div>
                   </CardHeader>
                   <CardContent className="p-8 space-y-6">
                      <div className="grid grid-cols-1 gap-6 max-w-md">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                               Current Password
                            </Label>
                            <Input type="password" placeholder="••••••••" className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-xs font-bold shadow-sm" />
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                               New Password
                            </Label>
                            <Input type="password" placeholder="••••••••" className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-xs font-bold shadow-sm" />
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                               Confirm New Password
                            </Label>
                            <Input type="password" placeholder="••••••••" className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-xs font-bold shadow-sm" />
                         </div>
                      </div>
                      <div className="pt-6 border-t border-slate-100">
                         <Button className="bg-slate-900 text-white hover:bg-slate-800 h-11 rounded-xl px-8 font-bold text-[10px] uppercase tracking-widest transition-all">
                            Update Password
                         </Button>
                      </div>
                   </CardContent>
                </Card>

                <Card className="border-none rounded-[1.5rem] shadow-xl shadow-slate-200/40 bg-white overflow-hidden p-8 flex items-center justify-between border border-white">
                   <div className="flex items-center space-x-6">
                      <div className="p-3 bg-red-50 rounded-xl text-red-600">
                         <LogOut className="h-6 w-6" />
                      </div>
                      <div>
                         <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Active Sessions</h4>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Logged in on other devices? You can sign out here.</p>
                      </div>
                   </div>
                   <Button className="bg-white text-red-600 hover:bg-red-50 border border-red-100 rounded-xl h-11 px-6 font-black text-[9px] uppercase tracking-widest shadow-sm">
                      Logout from All Devices
                   </Button>
                </Card>
             </motion.div>
           )}
        </div>
      </div>
    </div>
  );
}
