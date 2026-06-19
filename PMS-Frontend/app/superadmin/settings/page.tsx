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
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  X,
  Save,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SettingsLayout } from '@/components/layout/SettingsLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import api from '@/services/api';
import { useRouter } from 'next/navigation';
import { UAParser } from 'ua-parser-js';

// ─── Tiny inline dialog helper ───────────────────────────────────────────────
function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="bg-background rounded-xl shadow-2xl w-full max-w-sm border border-border overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1 h-10 text-sm font-semibold" onClick={onCancel}>
              Go Back
            </Button>
            <Button
              className={cn('flex-1 h-10 text-sm font-semibold text-white', confirmClass || 'bg-primary hover:bg-indigo-700')}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
function EditProfileModal({
  isOpen,
  initialValues,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  initialValues: { full_name: string; email: string };
  onClose: () => void;
  onSaved: (data: { full_name: string; email: string }) => void;
}) {
  const [formData, setFormData] = useState({ full_name: '', email: '' });
  const [errors, setErrors] = useState<{ full_name?: string; email?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setFormData({ ...initialValues });
      setErrors({});
      setShowCancelConfirm(false);
      setShowSaveConfirm(false);
    }
  }, [isOpen, initialValues]);

  const isDirty =
    formData.full_name.trim() !== initialValues.full_name.trim() ||
    formData.email.trim().toLowerCase() !== initialValues.email.trim().toLowerCase();

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: { full_name?: string; email?: string } = {};

    const name = formData.full_name.trim();
    if (!name) {
      newErrors.full_name = 'Full name is required.';
    } else if (name.length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters.';
    } else if (!/^[a-zA-Z\s]+$/.test(name)) {
      newErrors.full_name = 'Full name can only contain letters and spaces.';
    }

    const email = formData.email.trim();
    if (!email) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', ' '];
    if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) return;
    if (!/^[a-zA-Z\s]$/.test(e.key)) e.preventDefault();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^a-zA-Z\s]/g, '');
    setFormData(prev => ({ ...prev, full_name: cleaned }));
    if (errors.full_name) setErrors(prev => ({ ...prev, full_name: undefined }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, email: e.target.value.replace(/\s/g, '') }));
    if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
  };

  // Request close: dirty check
  const handleRequestClose = () => {
    if (isDirty) {
      setShowCancelConfirm(true);
    } else {
      onClose();
    }
  };

  // Request save: validate → show confirm
  const handleRequestSave = () => {
    if (!validate()) return;
    setShowSaveConfirm(true);
  };

  const doSave = async () => {
    setShowSaveConfirm(false);
    setIsSaving(true);
    try {
      const res = await api.put('/auth/update-profile', {
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
      });
      onSaved({ full_name: res.data.full_name, email: res.data.email });
      onClose();
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      let message = 'Failed to update profile.';
      if (error.response?.data?.detail) {
        message = typeof error.response.data.detail === 'string'
          ? error.response.data.detail
          : error.response.data.detail[0]?.msg || message;
      }
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-background rounded-xl shadow-2xl w-full max-w-lg border border-border overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-50 text-primary flex items-center justify-center border border-indigo-100">
                <UserCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Edit Profile</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Update your personal details</p>
              </div>
            </div>
            <button
              onClick={handleRequestClose}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-6 space-y-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Full Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={formData.full_name}
                onKeyDown={handleNameKeyDown}
                onChange={handleNameChange}
                placeholder="John Doe"
                className={cn(
                  'h-10 text-sm transition-colors',
                  errors.full_name ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30' : ''
                )}
              />
              {errors.full_name && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {errors.full_name}
                </p>
              )}
              <p className="text-xs text-muted-foreground">Only letters and spaces allowed.</p>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email Address <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={handleEmailChange}
                placeholder="you@example.com"
                className={cn(
                  'h-10 text-sm transition-colors',
                  errors.email ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30' : ''
                )}
              />
              {errors.email && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Info notice */}
            {isDirty && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 font-medium">You have unsaved changes. Click "Save Changes" to apply them.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 pb-6 border-t border-border pt-4">
            <Button variant="outline" className="h-10 px-5 text-sm font-semibold" onClick={handleRequestClose}>
              Cancel
            </Button>
            <Button
              onClick={handleRequestSave}
              disabled={isSaving || !isDirty}
              className="h-10 px-6 text-sm font-semibold bg-primary text-white hover:bg-indigo-700"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </div>
              )}
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Cancel confirmation (dirty check) */}
      <ConfirmDialog
        open={showCancelConfirm}
        title="Discard Changes?"
        description="You have unsaved changes. Are you sure you want to close without saving? All changes will be lost."
        confirmLabel="Discard"
        confirmClass="bg-rose-600 hover:bg-rose-700"
        onConfirm={() => { setShowCancelConfirm(false); onClose(); }}
        onCancel={() => setShowCancelConfirm(false)}
      />

      {/* Save confirmation */}
      <ConfirmDialog
        open={showSaveConfirm}
        title="Save Changes?"
        description="Are you sure you want to update your profile details? This will update your name and email across the system."
        confirmLabel="Yes, Save"
        confirmClass="bg-primary hover:bg-indigo-700"
        onConfirm={doSave}
        onCancel={() => setShowSaveConfirm(false)}
      />
    </>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Session state
  const [sessions, setSessions] = useState<any[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);

  const fetchSessions = async () => {
    if (!token) return;
    setIsSessionsLoading(true);
    try {
      const res = await api.get(`/auth/sessions`);
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to fetch sessions', err);
    } finally {
      setIsSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'security') {
      fetchSessions();
    }
  }, [activeTab, token]);

  const handleToggleMFA = async (checked: boolean) => {
    try {
      await api.put(`/auth/update-profile`, { is_mfa_enabled: checked });
      updateUser({ is_mfa_enabled: checked } as any);
      toast.success(checked ? 'Two-Factor Authentication Enabled' : 'Two-Factor Authentication Disabled');
    } catch {
      toast.error('Failed to update Two-Factor Authentication');
    }
  };

  const handleUpdatePassword = async () => {
    if (!token) { toast.error('You must be logged in to update your password'); return; }
    if (!currentPassword) { toast.error('Current password is required'); return; }
    if (newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('New passwords do not match'); return; }
    setIsSaving(true);
    try {
      await api.put(`/auth/update-password`, { current_password: currentPassword, new_password: newPassword });
      toast.success('Password updated successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (error: any) {
      let message = 'Failed to update password';
      if (error.response?.data?.detail) {
        message = typeof error.response.data.detail === 'string'
          ? error.response.data.detail
          : error.response.data.detail[0]?.msg || message;
      }
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await api.delete(`/auth/sessions/all`);
      toast.success('Logged out from all other devices successfully');
      fetchSessions();
    } catch {
      toast.error('Failed to revoke other sessions');
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      toast.success('Session revoked successfully');
      fetchSessions();
    } catch {
      toast.error('Failed to revoke session');
    }
  };

  return (
    <>
      <SettingsLayout
        title="Settings"
        description="Manage your profile and account security."
        headerActions={
          activeTab === 'profile' && (
            <Button
              onClick={() => setIsEditModalOpen(true)}
              className="bg-primary text-white hover:bg-indigo-700 h-9 rounded-md px-4 font-semibold text-sm transition-all flex items-center gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit Profile
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
                  'flex-shrink-0 snap-start flex items-center gap-3 lg:w-full text-left p-3 sm:p-4 rounded-xl transition-all group border lg:flex-shrink',
                  activeTab === item.id
                    ? 'bg-background shadow-sm border-border'
                    : 'bg-transparent border-transparent hover:bg-muted'
                )}
              >
                <div className={cn(
                  'p-2.5 rounded-lg transition-colors shrink-0',
                  activeTab === item.id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground group-hover:shadow-sm'
                )}>
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="whitespace-nowrap pr-2">
                  <h3 className={cn('text-sm font-semibold', activeTab === item.id ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground')}>{item.label}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 hidden lg:block">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        }
      >
        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <Card className="rounded-xl shadow-sm border-border bg-background overflow-hidden">
              <CardHeader className="p-6 border-b border-border bg-background">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                    <UserCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-foreground">Personal Details</CardTitle>
                    <CardDescription className="text-sm mt-1">Your name and email address on record</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-2xl">
                  {/* Read-only Full Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" /> Full Name
                    </Label>
                    <div className="h-10 px-3 flex items-center rounded-md border border-border bg-muted text-sm text-foreground font-medium">
                      {user?.full_name || '—'}
                    </div>
                  </div>
                  {/* Read-only Email */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" /> Email Address
                    </Label>
                    <div className="h-10 px-3 flex items-center rounded-md border border-border bg-muted text-sm text-foreground font-medium">
                      {user?.email || '—'}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                  <Edit2 className="h-3 w-3" />
                  Click "Edit Profile" at the top to update your details.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
            {/* Password Change */}
            <Card className="rounded-xl shadow-sm border-border bg-background overflow-hidden">
              <CardHeader className="p-6 border-b border-border bg-background">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-muted text-muted-foreground flex items-center justify-center border border-border">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-foreground">Security Credentials</CardTitle>
                    <CardDescription className="text-sm mt-1">Update your password and protect your account</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 gap-6 w-full sm:max-w-md">
                  {[
                    { label: 'Current Password', value: currentPassword, setter: setCurrentPassword, show: showCurrentPassword, toggle: () => setShowCurrentPassword(v => !v) },
                    { label: 'New Password', value: newPassword, setter: setNewPassword, show: showNewPassword, toggle: () => setShowNewPassword(v => !v) },
                    { label: 'Confirm New Password', value: confirmPassword, setter: setConfirmPassword, show: showConfirmPassword, toggle: () => setShowConfirmPassword(v => !v) },
                  ].map(({ label, value, setter, show, toggle }) => (
                    <div className="space-y-2" key={label}>
                      <Label className="text-sm font-semibold text-foreground">{label}</Label>
                      <div className="relative">
                        <Input
                          type={show ? 'text' : 'password'}
                          value={value}
                          onChange={e => setter(e.target.value)}
                          placeholder="••••••••"
                          className="h-10 pr-10 rounded-md border-border transition-all text-sm w-full"
                        />
                        <button
                          type="button"
                          onClick={toggle}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none flex items-center justify-center"
                        >
                          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-6 border-t border-border">
                  <Button
                    onClick={handleUpdatePassword}
                    disabled={isSaving}
                    className="bg-foreground text-background hover:opacity-90 h-9 rounded-md px-6 font-semibold text-sm transition-all"
                  >
                    {isSaving ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* MFA */}
            <Card className="rounded-xl shadow-sm border-border bg-background overflow-hidden p-6 flex flex-col items-start gap-6">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 border border-blue-500/20">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-foreground">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">Require a 6-digit OTP sent to your email.</p>
                  </div>
                </div>
                <Switch checked={user?.is_mfa_enabled || false} onCheckedChange={handleToggleMFA} />
              </div>
            </Card>

            {/* Active Sessions */}
            <Card className="rounded-xl shadow-sm border-border bg-background overflow-hidden p-6 flex flex-col items-start gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="p-2 bg-red-500/10 rounded-lg text-red-500 border border-red-500/20 flex-shrink-0">
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
                  className="text-red-500 hover:bg-red-500/10 hover:text-red-600 border-red-500/30 rounded-md h-9 px-4 font-semibold text-sm w-full sm:w-auto flex-shrink-0"
                >
                  Revoke All Others
                </Button>
              </div>

              <div className="w-full space-y-3">
                {isSessionsLoading ? (
                  <div className="py-4 flex justify-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="py-4 text-sm text-muted-foreground text-center">No active sessions found</div>
                ) : (
                  sessions.map((session) => (
                    <div key={session.session_id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border border-border bg-muted/40 gap-4 hover:bg-muted transition-colors">
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
                            <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-2 py-0.5 rounded-full">This Device</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{session.ip_address}</span>
                          <span className="text-muted-foreground/50">•</span>
                          <span className="text-xs text-muted-foreground">Last active: {new Date(session.last_active_at).toLocaleString()}</span>
                        </div>
                      </div>
                      {!session.is_current && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokeSession(session.session_id)}
                          className="h-8 rounded-md text-xs font-medium text-muted-foreground hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all w-full sm:w-auto"
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

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <EditProfileModal
            isOpen={isEditModalOpen}
            initialValues={{ full_name: user?.full_name || '', email: user?.email || '' }}
            onClose={() => setIsEditModalOpen(false)}
            onSaved={(data) => updateUser(data as any)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
