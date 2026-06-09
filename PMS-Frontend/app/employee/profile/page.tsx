'use client';

import { formatDistanceToNow } from 'date-fns';

import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Mail, 
  Building2, 
  ShieldCheck, 
  Smartphone, 
  Edit, 
  Lock,
  CloudLightning,
  Loader2,
  X,
  Check,
  Clock,
  CheckCircle2,
  Briefcase,
  BarChart3,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmployeeForm } from '@/components/employees/EmployeeForm';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '@/services/api';
import { handleApiError } from '@/utils/handleApiError';
import { ErrorState } from '@/components/ui/error-state';
import { useWebSocketEvent } from '@/hooks/useWebSocketEvent';

export default function EmployeeProfilePage() {
  const { user, token, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useWebSocketEvent('TIMESHEETS_UPDATED', () => setRefreshTrigger(prev => prev + 1));
  useWebSocketEvent('PROJECTS_UPDATED', () => setRefreshTrigger(prev => prev + 1));

  const [stats, setStats] = useState({
    totalHours: 0,
    monthHours: 0,
    completedTasks: 0,
    activeProjects: 0,
    totalLogs: 0
  });

  useEffect(() => {
    if (user) {
      // Data is handled by EmployeeForm defaultValues
    }
  }, [user]);

  // Fetch real activity stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;
      try {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const [tsRes, projRes] = await Promise.all([
          api.get(`/timesheets/me?limit=10000`),
          api.get(`/projects/?limit=1`)
        ]);

        const timesheets = (tsRes.data.items || tsRes.data || []) as any[];

        const totalHours = Math.round(timesheets.reduce((sum: number, ts: any) => sum + (ts.hours || 0), 0));
        const monthHours = Math.round(
          timesheets
            .filter((ts: any) => {
              const d = new Date(ts.date);
              return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            })
            .reduce((sum: number, ts: any) => sum + (ts.hours || 0), 0)
        );
        const completedTasks = timesheets.filter((ts: any) => ts.task_status === 'Completed').length;
        const totalProjects = projRes.data.total || 0;
        const totalLogs = timesheets.length;

        setStats({ totalHours, monthHours, completedTasks, activeProjects: totalProjects, totalLogs });
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [token, refreshTrigger]);

  const handleToggleMFA = async (checked: boolean) => {
    try {
      await api.put(
        `/auth/update-profile`,
        { is_mfa_enabled: checked }
      );
      updateUser({ is_mfa_enabled: checked });
      toast.success(checked ? "Two-Factor Authentication Enabled" : "Two-Factor Authentication Disabled");
    } catch (error) {
      toast.error("Failed to update Two-Factor Authentication");
    }
  };

  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      const response = await api.put(
        `/auth/update-profile`,
        {
          full_name: data.full_name,
          email: data.email,
          mobile_number: data.mobile_number,
          designation: data.designation
        }
      );

      updateUser({
        employee_id: response.data.employee_id,
        full_name: response.data.full_name,
        email: response.data.email,
        mobile_number: response.data.mobile_number,
        designation: response.data.designation
      });

      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      let message = 'Failed to update profile.';
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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (passwordData.new_password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await api.put(`/auth/update-password`, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      toast.success('Password updated successfully');
      setIsPasswordModalOpen(false);
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error: any) {
      let message = 'Failed to update password';
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          message = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          message = error.response.data.detail[0]?.msg || "Validation error";
        }
      }
      setPasswordError(message);
      toast.error(message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
         <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground leading-none">Identity Core</h2>
         <p className="text-muted-foreground font-medium text-sm mt-2">Personal parameters within the synchronization network</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
         {/* Profile Card */}
         <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="md:col-span-4">
            <Card className="rounded-xl border-border shadow-sm overflow-hidden bg-background h-full flex flex-col">
               <div className="h-24 bg-slate-900 relative">
                  <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 p-2 bg-background rounded-xl shadow-xl">
                     <div className="w-20 h-20 bg-primary rounded-xl flex items-center justify-center font-bold text-2xl text-white shadow-inner">
                        {user?.full_name?.charAt(0) || 'E'}
                     </div>
                  </div>
               </div>
               <div className="pt-16 pb-8 px-8 text-center flex-1">
                  <h3 className="text-xl font-bold text-foreground truncate">{user?.full_name}</h3>
                  <p className="text-xs font-bold tracking-wider text-muted-foreground mt-1 mb-6">Resource Node</p>
                  
                  <div className="space-y-3">
                     <Badge className="w-full justify-center bg-indigo-50 text-primary border-none py-2 text-xs font-bold tracking-wider rounded-xl hover:bg-indigo-100 cursor-default">
                        {user?.designation || 'Software Engineer'}
                     </Badge>
                     <Badge className="w-full justify-center bg-muted/30 text-muted-foreground border-none py-2 text-xs font-bold tracking-wider rounded-xl hover:bg-muted cursor-default">
                        {user?.role || 'Product Engineering'}
                     </Badge>
                  </div>
               </div>
               <div className="p-6 bg-muted/30 border-t border-border text-center">
                  <span className="text-xs font-bold text-muted-foreground tracking-tighter">Status: Fully Synchronized</span>
               </div>
            </Card>
         </motion.div>

         {/* Settings & Details */}
         <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="md:col-span-8 space-y-6">
            <Card className="rounded-xl border-border shadow-sm p-4 sm:p-8 bg-background">
               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
                  <h4 className="text-sm font-bold tracking-tight text-slate-800">Account Parameters</h4>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                    className="rounded-xl h-9 border-border text-xs font-bold tracking-wider text-muted-foreground hover:bg-muted transition-all"
                  >
                     <Edit className="mr-2 h-3 w-3" /> Edit Details
                  </Button>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Employee ID */}
                  <div className="space-y-2">
                     <p className="text-xs font-bold tracking-wider text-muted-foreground flex items-center">
                        <Briefcase className="h-3 w-3 mr-2 text-indigo-500" /> Employee ID
                     </p>
                     <div className="h-11 rounded-xl bg-muted/30 border border-border px-3 flex items-center font-bold text-xs text-foreground cursor-not-allowed">
                        {user?.employee_id || '-'}
                     </div>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-2">
                     <p className="text-xs font-bold tracking-wider text-muted-foreground flex items-center">
                        <User className="h-3 w-3 mr-2 text-indigo-500" /> Full Name
                     </p>
                     <div className="h-11 rounded-xl bg-muted/30 border border-border px-3 flex items-center font-bold text-xs text-foreground">
                        {user?.full_name || '-'}
                     </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                     <p className="text-xs font-bold tracking-wider text-muted-foreground flex items-center">
                        <Mail className="h-3 w-3 mr-2 text-indigo-500" /> Email
                     </p>
                     <div className="h-11 rounded-xl bg-muted/30 border border-border px-3 flex items-center font-bold text-xs text-foreground">
                        {user?.email || '-'}
                     </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                     <p className="text-xs font-bold tracking-wider text-muted-foreground flex items-center">
                        <Smartphone className="h-3 w-3 mr-2 text-indigo-500" /> Phone Number
                     </p>
                     <div className="h-11 rounded-xl bg-muted/30 border border-border px-3 flex items-center font-bold text-xs text-foreground">
                        {user?.mobile_number || '-'}
                     </div>
                  </div>

                  {/* Designation */}
                  <div className="space-y-2">
                     <p className="text-xs font-bold tracking-wider text-muted-foreground flex items-center">
                        <Building2 className="h-3 w-3 mr-2 text-indigo-500" /> Designation
                     </p>
                     <div className="h-11 rounded-xl bg-muted/30 border border-border px-3 flex items-center font-bold text-xs text-foreground">
                        {user?.designation || '-'}
                     </div>
                  </div>
               </div>
            </Card>

            <Card className="rounded-xl border-border shadow-sm p-4 sm:p-8 bg-background border-l-4 border-l-indigo-600">
               <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="space-y-1">
                     <h4 className="text-sm font-bold tracking-tight text-slate-800">Security Credentials</h4>
                     <p className="text-xs font-medium text-muted-foreground italic">
                       {user?.password_updated_at 
                         ? `Last password reset: ${formatDistanceToNow(new Date(user.password_updated_at + (user.password_updated_at.endsWith('Z') ? '' : 'Z')), { addSuffix: true })}` 
                         : 'Ensure your password is secure and updated regularly.'}
                     </p>
                  </div>
                  <Button onClick={() => setIsPasswordModalOpen(true)} className="rounded-xl h-10 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-wider group">
                     <Lock className="mr-2 h-3 w-3 group-hover:scale-110 transition-transform" /> Change Password
                  </Button>
               </div>
               <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <div className="space-y-1">
                     <h4 className="text-sm font-bold text-slate-800">Two-Factor Authentication (Email)</h4>
                     <p className="text-xs font-medium text-muted-foreground">Require a 6-digit OTP sent to your email when logging in.</p>
                  </div>
                  <Switch 
                     checked={user?.is_mfa_enabled || false} 
                     onCheckedChange={handleToggleMFA} 
                  />
               </div>
            </Card>

            {/* Real stats card */}
            <Card className="rounded-xl border-border shadow-sm p-4 sm:p-8 bg-indigo-50 relative overflow-hidden group">
               <CloudLightning className="absolute -right-8 -bottom-8 h-32 w-32 text-indigo-100 group-hover:scale-110 transition-transform duration-500" />
               <div className="relative z-10 space-y-4">
                  <h4 className="text-sm font-bold tracking-tight text-indigo-900">Activity Stats</h4>
                  {statsLoading ? (
                    <div className="flex items-center gap-2 text-indigo-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs font-bold tracking-wider">Loading stats...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      <div className="bg-white/60 rounded-xl p-4 text-center">
                        <span className="text-2xl font-bold text-indigo-900">{stats.totalLogs}</span>
                        <span className="text-[9px] font-bold text-indigo-400 block mt-1">Total Logs</span>
                      </div>
                      <div className="bg-white/60 rounded-xl p-4 text-center">
                        <span className="text-2xl font-bold text-indigo-900">{stats.totalHours}h</span>
                        <span className="text-[9px] font-bold text-indigo-400 block mt-1">Total Hours</span>
                      </div>
                      <div className="bg-white/60 rounded-xl p-4 text-center">
                        <span className="text-2xl font-bold text-indigo-900">{stats.monthHours}h</span>
                        <span className="text-[9px] font-bold text-indigo-400 block mt-1">This Month</span>
                      </div>
                      <div className="bg-white/60 rounded-xl p-4 text-center">
                        <span className="text-2xl font-bold text-indigo-900">{stats.completedTasks}</span>
                        <span className="text-[9px] font-bold text-indigo-400 block mt-1">Tasks Done</span>
                      </div>
                      <div className="bg-white/60 rounded-xl p-4 text-center">
                        <span className="text-2xl font-bold text-indigo-900">{stats.activeProjects}</span>
                        <span className="text-[9px] font-bold text-indigo-400 block mt-1">Projects</span>
                      </div>
                    </div>
                  )}
               </div>
            </Card>
         </motion.div>
      </div>

      {/* Password Update Modal */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-background rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-xl">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-foreground">Change Password</h3>
                    <p className="text-xs font-bold text-muted-foreground tracking-wider">Update your password</p>
                  </div>
                </div>
                <button onClick={() => setIsPasswordModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handleUpdatePassword} className="p-6 space-y-4">
                {passwordError && (
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold tracking-wider text-center border border-rose-100">
                    {passwordError}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold tracking-wider text-muted-foreground">Current Password</Label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      required
                      value={passwordData.current_password}
                      onChange={e => setPasswordData(prev => ({...prev, current_password: e.target.value}))}
                      className="h-11 rounded-xl bg-muted/30 border-border font-medium pr-10"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-600 focus:outline-none flex items-center justify-center"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold tracking-wider text-muted-foreground">New Password</Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={passwordData.new_password}
                      onChange={e => setPasswordData(prev => ({...prev, new_password: e.target.value}))}
                      className="h-11 rounded-xl bg-muted/30 border-border font-medium pr-10"
                      placeholder="Min 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-600 focus:outline-none flex items-center justify-center"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold tracking-wider text-muted-foreground">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={passwordData.confirm_password}
                      onChange={e => setPasswordData(prev => ({...prev, confirm_password: e.target.value}))}
                      className="h-11 rounded-xl bg-muted/30 border-border font-medium pr-10"
                      placeholder="Must match new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-600 focus:outline-none flex items-center justify-center"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsPasswordModalOpen(false)} className="flex-1 h-11 rounded-xl border-border text-xs font-bold tracking-wider">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUpdatingPassword} className="flex-1 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold tracking-wider">
                    {isUpdatingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Update'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <EmployeeForm 
        mode="profile_edit"
        isOpen={isEditing}
        onOpenChange={setIsEditing}
        defaultValues={{
          employee_id: user?.employee_id || '',
          full_name: user?.full_name || '',
          email: user?.email || '',
          mobile_number: user?.mobile_number || '',
          designation: user?.designation || '',
        }}
        onSubmit={handleSave}
        isSubmitting={isSaving}
      />
    </div>
  );
}
