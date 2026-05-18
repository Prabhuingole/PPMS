'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, ArrowUpRight } from 'lucide-react';
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
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  
  // Get state from Zustand store
  const { isAuthenticated, user, _hasHydrated, setAuth } = useAuthStore();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Avoid hydration mismatch — but cap the wait at 500ms to prevent infinite spinner
  useEffect(() => {
    setIsMounted(true);
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
      if (user?.role === 'superadmin') {
        router.replace('/superadmin/dashboard');
      } else if (['employee', 'intern'].includes(user?.role || '')) {
        router.replace('/employee/dashboard');
      }
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  /**
   * BACKEND INTEGRATION: POST credentials to FastAPI
   */
  async function onSubmit(values: LoginValues) {
    setIsLoading(true);
    try {
      // Connect to your FastAPI endpoint
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/login`, {
        email: values.email,
        password: values.password,
      });

      const { user, access_token } = response.data;

      // Update Zustand store
      setAuth(user, access_token);

      toast.success(`Access Granted. Welcome back, ${user.full_name}`);

      // Router handles the redirection in the useEffect above
    } catch (error: any) {
      console.error("Login Error:", error);
      const errorMessage = error.response?.data?.detail || 'Authentication failed. Please check your credentials.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  // Prevent UI flickering while checking hydration or auth status
  if (!isMounted || !_hasHydrated || isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 relative overflow-hidden">
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
        <div className="mb-10 text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200 mb-4">
             <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">
            SAMBHAV<span className="text-blue-600">PMS</span>
          </h1>
          <p className="text-slate-400 font-medium text-xs tracking-widest uppercase">
            Project Management System
          </p>
        </div>

        <Card className="border-slate-200 shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-8">
            <CardTitle className="text-2xl font-bold text-slate-800">Secure Sign In</CardTitle>
            <CardDescription className="text-slate-500">
              Enter your Sambhav credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* EMAIL FIELD */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Corporate Email
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="admin@sambhav.com"
                            className="h-12 pl-11 rounded-xl border-slate-200 bg-slate-50/50 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0 focus-visible:border-blue-500 transition-all"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                {/* PASSWORD FIELD */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Access Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            className="h-12 pl-11 pr-12 rounded-xl border-slate-200 bg-slate-50/50 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0 focus-visible:border-blue-500 transition-all"
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
                      <FormMessage className="text-[10px]" />
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
                          className="rounded-md border-slate-300 data-[state=checked]:bg-blue-600"
                        />
                        <label
                          htmlFor="rememberMe"
                          className="text-xs font-semibold text-slate-600 cursor-pointer"
                        >
                          Keep me signed in
                        </label>
                      </div>
                    )}
                  />
                  <Button type="button" variant="link" className="text-xs font-bold text-blue-600 px-0 h-auto hover:text-blue-700">
                    Recover Password
                  </Button>
                </div>

                {/* SUBMIT BUTTON */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all duration-300 font-bold text-sm shadow-xl shadow-blue-200 group"
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
          </CardContent>
        </Card>

        <div className="mt-12 text-center">
           <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">
             Protected by Sambhav Security &bull; 256-bit Encryption
           </p>
        </div>
      </motion.div>
    </div>
  );
}