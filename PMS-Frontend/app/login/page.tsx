'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, ArrowUpRight, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

/**
 * Zod Schema for validation
 */
const loginSchema = z.object({
  email: z.string({ required_error: 'This field is required' }).trim().toLowerCase().email('Please enter a valid email address'),
  password: z.string({ required_error: 'This field is required' }).min(1, 'This field is required'),
  rememberMe: z.boolean().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;

const resetSchema = z.object({
  password: z.string({ required_error: 'This field is required' }).min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string({ required_error: 'This field is required' })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetValues = z.infer<typeof resetSchema>;

export default function LoginPage() {
  const router = useRouter();

  // Get state from Zustand store
  const { isAuthenticated, user, _hasHydrated, setAuth, logout } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Password Reset State
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Forgot Password State
  const [viewMode, setViewMode] = useState<'login' | 'forgot'>('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  // MFA State
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaEmail, setMfaEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);

  // Avoid hydration mismatch — but cap the wait at 500ms to prevent infinite spinner
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const savedTemp = sessionStorage.getItem('sam_temp_pass');
      if (savedTemp) {
        setTempPassword(savedTemp);
      }
    }
    // Safety net: if Zustand hasn't hydrated in 500ms (Edge strict mode / empty localStorage),
    // force-unblock the UI so the login form actually renders.
    const timer = setTimeout(() => {
      if (!useAuthStore.getState()._hasHydrated) {
        useAuthStore.setState({ _hasHydrated: true });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      if (!user || !user.role) {
        // Safe check: if authenticated but user info is missing/corrupted, force logout
        logout();
        localStorage.removeItem('auth-storage');
        return;
      }
      if (user.must_change_password) {
        router.replace('/setup-account');
        return;
      }
      if (['superadmin', 'admin'].includes(user.role)) {
        router.replace('/superadmin/dashboard');
      } else if (['employee', 'intern', 'reporting_manager', 'team_member', 'consultant'].includes(user.role)) {
        router.replace('/employee/dashboard');
      } else {
        // Unknown role, force logout
        logout();
        localStorage.removeItem('auth-storage');
      }
    }
  }, [_hasHydrated, isAuthenticated, user, router, logout]);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const [loginError, setLoginError] = useState<string | null>(null);

  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  /**
   * BACKEND INTEGRATION: POST credentials to FastAPI
   */
  async function onSubmit(values: LoginValues) {
    setIsLoading(true);
    setLoginError(null);
    try {
      if (typeof window !== 'undefined') {
        if (values.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.setItem('rememberMe', 'false');
        }
      }

      const sanitizedPassword = values.password.replace(/[\u200B-\u200D\uFEFF]/g, '');

      // Connect to your FastAPI endpoint
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/login`, {
        email: values.email,
        password: sanitizedPassword,
      }, { withCredentials: true });

      if (response.data.mfa_required) {
        setMfaEmail(response.data.email);
        setMfaRequired(true);
        setTempPassword(sanitizedPassword); // store temp in case of reset later
        toast.success(response.data.message || 'OTP sent to your email.');
        return;
      }

      const { user, access_token } = response.data;

      setTempPassword(sanitizedPassword); // Store temp password to use it for reset later
      sessionStorage.setItem('sam_temp_pass', sanitizedPassword);
      setAuth(user, access_token);

      if (user.must_change_password) {
        router.replace('/setup-account');
        toast.info("Please complete your account setup.");
      } else {
        toast.success(`Access Granted. Welcome back, ${user.full_name}`);
      }

      // Router handles the redirection in the useEffect above
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Authentication failed. Please check your credentials.';
      setLoginError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  async function onVerifyMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }

    setIsVerifyingMfa(true);
    setLoginError(null);
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/verify-mfa`, {
        email: mfaEmail,
        otp: otp
      }, { withCredentials: true });

      const { user, access_token } = response.data;
      sessionStorage.setItem('sam_temp_pass', tempPassword);
      setAuth(user, access_token);

      if (user.must_change_password) {
        router.replace('/setup-account');
        toast.info("Authentication successful. Please complete your account setup.");
      } else {
        toast.success(`Access Granted. Welcome back, ${user.full_name}`);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Invalid OTP.';
      setLoginError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsVerifyingMfa(false);
    }
  }

  async function onForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error('Please enter your corporate email address');
      return;
    }

    setIsForgotLoading(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/forgot-password`, {
        email: forgotEmail,
      }, { withCredentials: true });
      toast.success('If an account exists, a password reset link has been sent to your email.');
      setViewMode('login');
      setForgotEmail('');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to send reset link. Please try again.');
    } finally {
      setIsForgotLoading(false);
    }
  }

  async function onResetSubmit(values: ResetValues) {
    setIsResetting(true);
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/update-password`,
        {
          current_password: tempPassword,
          new_password: values.password,
        },
        {
          headers: {
            Authorization: `Bearer ${useAuthStore.getState().token}`
          },
          withCredentials: true
        }
      );

      // Update local state to reflect password change
      if (user) {
        setAuth({ ...user, must_change_password: false }, useAuthStore.getState().token!);
      }

      toast.success('Password updated successfully. Access Granted.');
      sessionStorage.removeItem('sam_temp_pass');
      setRequiresPasswordChange(false);

    } catch (error: any) {
      console.error("Password Reset Error:", error);
      toast.error(error.response?.data?.detail || 'Failed to update password.');
    } finally {
      setIsResetting(false);
    }
  }

  // Prevent UI flickering while checking hydration or auth status
  if (!isMounted || !_hasHydrated || (isAuthenticated && !requiresPasswordChange)) {
    return (
      <div suppressHydrationWarning className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-background p-4 sm:p-6 relative overflow-hidden">
      {/* Bento Grid Visual Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 border-r border-b border-slate-900 dark:border-white/10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 border-l border-b border-slate-900 dark:border-white/10"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 border-r border-t border-slate-900 dark:border-white/10"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 border-l border-t border-slate-900 dark:border-white/10"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="mb-6 sm:mb-10 text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200 mb-4">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-foreground">
            SAMBHAV<span className="text-blue-600">PMS</span>
          </h1>
          <p className="text-slate-400 dark:text-muted-foreground font-medium text-xs tracking-wider">
            Project Management System
          </p>
        </div>

        <Card className="border-slate-200 dark:border-border shadow-2xl shadow-slate-200/50 dark:shadow-none rounded-3xl overflow-hidden bg-white/80 dark:bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4 sm:pb-8">
            <CardTitle className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-foreground">
              {viewMode === 'forgot'
                ? 'Recover Password'
                : requiresPasswordChange
                  ? 'Set New Password'
                  : 'Sign In'}
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-muted-foreground">
              {viewMode === 'forgot'
                ? 'Enter your corporate email and we will send you a reset link.'
                : requiresPasswordChange
                  ? 'Please set a new secure password to continue.'
                  : mfaRequired
                    ? 'Enter the 6-digit code sent to your email.'
                    : 'Enter your credentials to continue'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loginError && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-rose-800 leading-relaxed">
                  {loginError}
                </p>
              </div>
            )}
            {requiresPasswordChange ? (
              <Form {...resetForm}>
                <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-6">
                  <FormField
                    control={resetForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel required className="text-xs font-bold tracking-wider text-slate-400 dark:text-muted-foreground">
                          New Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              className="h-12 pl-11 pr-12 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0 focus-visible:border-blue-500 transition-all"
                              {...field}
                            />
                            <button
                              type="button"
                              className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-muted-foreground hover:text-slate-600 focus:outline-none transition-colors"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={resetForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel required className="text-xs font-bold tracking-wider text-slate-400 dark:text-muted-foreground">
                          Confirm Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                            <Input
                              type={showConfirmPassword ? 'text' : 'password'}
                              className="h-12 pl-11 pr-12 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0 focus-visible:border-blue-500 transition-all"
                              {...field}
                            />
                            <button
                              type="button"
                              className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-muted-foreground hover:text-slate-600 focus:outline-none transition-colors"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full h-12 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-all duration-300 font-bold text-sm shadow-xl shadow-emerald-200 dark:shadow-none"
                    disabled={isResetting}
                  >
                    {isResetting ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Updating...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <span>Save Password & Continue</span>
                      </div>
                    )}
                  </Button>
                </form>
              </Form>
            ) : viewMode === 'forgot' ? (
              <form onSubmit={onForgotSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-wider text-slate-400 dark:text-muted-foreground">
                    Corporate Email
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="h-12 pl-11 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0 focus-visible:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  <Button
                    type="submit"
                    className="w-full h-12 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all duration-300 font-bold text-sm shadow-xl shadow-blue-200 dark:shadow-none"
                    disabled={isForgotLoading}
                  >
                    {isForgotLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Sending Link...</span>
                      </div>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setViewMode('login')}
                    className="w-full h-12 font-bold text-xs text-slate-500 hover:text-slate-700 rounded-xl"
                  >
                    Back to Login
                  </Button>
                </div>
              </form>
            ) : mfaRequired ? (
              <form onSubmit={onVerifyMfa} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-wider text-slate-400 dark:text-muted-foreground">
                    Verification Code (OTP)
                  </label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit code"
                      required
                      className="h-12 pl-11 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0 focus-visible:border-blue-500 transition-all tracking-[0.5em] font-mono text-center"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  <Button
                    type="submit"
                    className="w-full h-12 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all duration-300 font-bold text-sm shadow-xl shadow-blue-200 dark:shadow-none"
                    disabled={isVerifyingMfa}
                  >
                    {isVerifyingMfa ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      "Verify OTP"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setMfaRequired(false); setOtp(''); setLoginError(null); }}
                    className="w-full h-12 font-bold text-xs text-slate-500 hover:text-slate-700 rounded-xl"
                  >
                    Back to Login
                  </Button>
                </div>
              </form>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                  {/* EMAIL FIELD */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel required className="text-xs font-bold tracking-wider text-slate-400 dark:text-muted-foreground">
                          Corporate Email
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                            <Input
                              type={showEmail ? 'text' : 'password'}
                              placeholder="Enter your email"
                              className="h-12 pl-11 pr-12 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0 focus-visible:border-blue-500 transition-all"
                              {...field}
                            />
                            <button
                              type="button"
                              className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-muted-foreground hover:text-slate-600 focus:outline-none transition-colors"
                              onClick={() => setShowEmail(!showEmail)}
                            >
                              {showEmail ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* PASSWORD FIELD */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel required className="text-xs font-bold tracking-wider text-slate-400 dark:text-muted-foreground">
                          Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              className="h-12 pl-11 pr-12 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0 focus-visible:border-blue-500 transition-all"
                              {...field}
                            />
                            <button
                              type="button"
                              className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* EXTRA CONTROLS */}
                  <div className="flex items-center justify-between pb-2">
                    <FormField
                      control={form.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="rememberMe"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="rounded-md border-slate-300 dark:border-border data-[state=checked]:bg-blue-600"
                          />
                          <label
                            htmlFor="rememberMe"
                            className="text-xs font-semibold text-slate-600 dark:text-muted-foreground cursor-pointer"
                          >
                            Keep me signed in
                          </label>
                        </div>
                      )}
                    />
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setViewMode('forgot')}
                      className="text-xs font-bold text-blue-600 px-0 h-auto hover:text-blue-700"
                    >
                      Recover Password
                    </Button>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all duration-300 font-bold text-sm shadow-xl shadow-blue-200 dark:shadow-none group"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <span>Authenticate</span>
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </motion.div>
                      </div>
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 sm:mt-12 text-center">
          <p className="text-slate-400 dark:text-muted-foreground text-xs font-bold tracking-wider">
            Protected by Sambhav Security &bull;
          </p>
        </div>
      </motion.div>
    </div>
  );
}
