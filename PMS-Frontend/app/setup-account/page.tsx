'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Eye, EyeOff, Loader2, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
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
import { toast } from 'sonner';

const setupSchema = z.object({
  new_email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string()
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type SetupValues = z.infer<typeof setupSchema>;

export default function SetupAccountPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, logout, setAuth } = useAuthStore();

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Redirect away if already setup or not authenticated
    if (!isAuthenticated || !user) {
      router.replace('/login');
    } else if (!user.must_change_password) {
      if (['superadmin', 'admin'].includes(user.role)) {
        router.replace('/superadmin/dashboard');
      } else {
        router.replace('/employee/dashboard');
      }
    }
  }, [user, isAuthenticated, router]);

  const form = useForm<SetupValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      new_email: user?.email || '',
      new_password: '',
      confirm_password: '',
    },
  });

  async function onSubmit(values: SetupValues) {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/setup-account`,
        values,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success("Account setup complete! Welcome.");
      
      // The backend now returns a fresh token and user object with the new email
      const { access_token, user: updatedUser } = response.data;
      
      // Update local state with the brand new token and user
      setAuth(updatedUser, access_token);

      // Reroute them to correct dashboard
      if (['superadmin', 'admin'].includes(user?.role || '')) {
        router.replace('/superadmin/dashboard');
      } else {
        router.replace('/employee/dashboard');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to complete account setup.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  // Prevent flashing content if we are going to redirect
  if (!isAuthenticated || !user || !user.must_change_password) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="bg-slate-900 p-3 rounded-2xl shadow-xl shadow-slate-900/20 mb-4">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Account Setup</h1>
            <p className="text-slate-500 font-medium text-xs mt-2 uppercase tracking-widest text-center">
              Please secure your account to continue
            </p>
          </div>

          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white/80 backdrop-blur-xl">
            <CardHeader className="space-y-1 p-8 pb-4 border-b border-slate-100 bg-white">
              <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-900">
                Welcome, {user.full_name}
              </CardTitle>
              <CardDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Update your email and password
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="new_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Corporate Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                              placeholder="name@company.com" 
                              {...field} 
                              disabled
                              className="pl-11 h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-colors text-sm font-semibold disabled:opacity-75 disabled:cursor-not-allowed"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold uppercase tracking-widest" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="new_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showNewPassword ? "text" : "password"}
                              placeholder="••••••••"
                              {...field}
                              className="h-12 pr-12 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-colors text-sm font-semibold"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold uppercase tracking-widest" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirm_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="••••••••"
                              {...field}
                              className="h-12 pr-12 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-colors text-sm font-semibold"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold uppercase tracking-widest" />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-widest shadow-xl shadow-slate-900/20 transition-all group"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Complete Setup
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center">
                <button 
                  onClick={handleLogout}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                >
                  Cancel and Sign Out
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
