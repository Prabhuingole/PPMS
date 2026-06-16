'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Eye, EyeOff, Loader2, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
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
import { toast } from 'sonner';

const resetSchema = z.object({
  password: z.string({ required_error: 'This field is required' }).min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string({ required_error: 'This field is required' })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetValues = z.infer<typeof resetSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setErrorMsg("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, [token]);

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: ResetValues) {
    if (!token) return;
    setIsResetting(true);
    setErrorMsg(null);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/reset-password`,
        {
          token: token,
          new_password: values.password,
        }
      );

      toast.success('Password reset successfully! You can now sign in.');
      router.push('/login');
    } catch (error: any) {
      console.error("Password Reset Error:", error);
      const msg = error.response?.data?.detail || 'Failed to update password. Link may have expired.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <Card className="border-slate-200 shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-4 sm:pb-8">
        <CardTitle className="text-xl sm:text-2xl font-bold text-slate-800">
          Reset Your Password
        </CardTitle>
        <CardDescription className="text-slate-500">
          Create a new, secure password for your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-rose-800 leading-relaxed">
              {errorMsg}
            </p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel required className="text-xs font-bold tracking-wider text-slate-400">
                    New Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        className="h-12 pl-11 pr-12 rounded-xl border-slate-200 bg-slate-50/50 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0 focus-visible:border-blue-500 transition-all"
                        placeholder="Min 8 characters"
                        disabled={!token}
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
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel required className="text-xs font-bold tracking-wider text-slate-400">
                    Confirm Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="h-12 pl-11 pr-12 rounded-xl border-slate-200 bg-slate-50/50 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0 focus-visible:border-blue-500 transition-all"
                        placeholder="Confirm new password"
                        disabled={!token}
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
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
              className="w-full h-12 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all duration-300 font-bold text-sm shadow-xl shadow-blue-200"
              disabled={isResetting || !token}
            >
              {isResetting ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Resetting...</span>
                </div>
              ) : (
                <span>Reset Password</span>
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => router.push('/login')}
              className="w-full h-12 font-bold text-xs text-slate-500 hover:text-slate-700 rounded-xl mt-2"
            >
              Back to Login
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-6 relative overflow-hidden">
      {/* Bento Grid Visual Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 border-r border-b border-slate-900"></div>
        <div className="absolute top-0 right-0 w-64 h-64 border-l border-b border-slate-900"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 border-r border-t border-slate-900"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 border-l border-t border-slate-900"></div>
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
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
            SAMBHAV<span className="text-blue-600">PMS</span>
          </h1>
          <p className="text-slate-400 font-medium text-xs tracking-wider">
            Project Management System
          </p>
        </div>

        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>}>
          <ResetPasswordForm />
        </Suspense>

        <div className="mt-8 sm:mt-12 text-center">
          <p className="text-slate-400 text-xs font-bold tracking-wider">
            Protected by Sambhav Security &bull;
          </p>
        </div>
      </motion.div>
    </div>
  );
}
