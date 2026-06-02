'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Users, AlertCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createEmployeeSchema, updateEmployeeSchema, profileUpdateSchema } from '@/lib/validators/employee';

type FormMode = 'create' | 'edit' | 'profile_edit';

interface EmployeeFormProps {
  mode: FormMode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultValues?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function EmployeeForm({
  mode,
  isOpen = true,
  onOpenChange,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false
}: EmployeeFormProps) {
  // Select schema based on mode
  const schema = mode === 'create' ? createEmployeeSchema 
               : mode === 'edit' ? updateEmployeeSchema 
               : profileUpdateSchema;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || {
      employee_id: '',
      full_name: '',
      email: '',
      mobile_number: '',
      role: 'employee',
      designation: '',
    },
    mode: 'onChange', // enable dirty state detection easily
  });

  // Reset form when defaultValues change or modal opens
  useEffect(() => {
    if (defaultValues && isOpen) {
      form.reset(defaultValues);
    } else if (!isOpen) {
      form.reset();
    }
  }, [defaultValues, isOpen, form]);

  const handleSubmit = async (data: any) => {
    await onSubmit(data);
  };

  const isProfileEdit = mode === 'profile_edit';
  const isCreate = mode === 'create';
  
  const isDirty = form.formState.isDirty;

  const content = (
    <>
      <div className="bg-slate-900 p-6 text-white relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <Users className="w-24 h-24" />
        </div>
        <DialogHeader className="relative z-10">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white">
            {isCreate ? 'Add Employee' : isProfileEdit ? 'Edit Profile Details' : 'Edit Employee Details'}
          </DialogTitle>
          <DialogDescription className="text-slate-400 font-medium text-xs mt-1">
            {isProfileEdit 
              ? 'Update your personal and professional information.' 
              : `Configure parameters for the ${isCreate ? 'new' : 'existing'} human resource inside the network.`}
          </DialogDescription>
        </DialogHeader>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-full max-h-[80vh]">
          {/* Scrollable form content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/30">
            
            {/* Section 1: Identity Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="h-4 w-1 bg-indigo-500 rounded-full" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Identity Information</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="employee_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identifier <span className="text-rose-500">*</span></FormLabel>
                        <FormControl>
                          <Input
                            placeholder="SAM001"
                            {...field}
                            readOnly={isCreate}
                            disabled={mode === 'edit' || mode === 'profile_edit'} // usually ID cannot be edited once created
                            className="h-10 rounded-lg border-slate-100 bg-slate-50 cursor-not-allowed text-slate-500 font-bold"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name <span className="text-rose-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} className="h-10 rounded-lg border-slate-200 bg-white focus-visible:bg-white focus-visible:ring-indigo-500 transition-colors font-semibold text-sm shadow-sm" />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section 2: Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="h-4 w-1 bg-emerald-500 rounded-full" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contact Information</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address <span className="text-rose-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="name@gmail.com" {...field} className="h-10 rounded-lg border-slate-200 bg-white focus-visible:bg-white focus-visible:ring-emerald-500 transition-colors font-semibold text-sm shadow-sm" />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mobile_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mobile Number <span className="text-rose-500">*</span></FormLabel>
                      <FormControl>
                        <Input
                          placeholder="9876543210"
                          {...field}
                          maxLength={10}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            field.onChange(value);
                          }}
                          className="h-10 rounded-lg border-slate-200 bg-white focus-visible:bg-white focus-visible:ring-emerald-500 transition-colors font-semibold text-sm shadow-sm"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section 3: Professional Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="h-4 w-1 bg-amber-500 rounded-full" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Professional Details</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!isProfileEdit && (
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">User Type <span className="text-rose-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || defaultValues?.role}>
                          <FormControl>
                            <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white focus-visible:bg-white focus-visible:ring-amber-500 transition-colors font-semibold text-sm shadow-sm">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                            <SelectItem value="employee" className="rounded-lg py-2">Employee</SelectItem>
                            <SelectItem value="intern" className="rounded-lg py-2">Intern</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem className={isProfileEdit ? "sm:col-span-2" : ""}>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Designation <span className="text-rose-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Software Engineer" {...field} className="h-10 rounded-lg border-slate-200 bg-white focus-visible:bg-white focus-visible:ring-amber-500 transition-colors font-semibold text-sm shadow-sm" />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {isCreate && (
              <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50 flex items-start gap-4">
                <div className="bg-indigo-100 p-2 rounded-xl shrink-0">
                  <AlertCircle className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h5 className="text-[11px] font-black text-indigo-900 uppercase tracking-widest">Security Protocol</h5>
                  <p className="text-xs font-semibold text-indigo-700/80 mt-1 leading-relaxed">
                    A secure temporary password will be auto-generated and dispatched to the resource's email inbox immediately upon creation.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t border-slate-100 bg-white shrink-0 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] z-10">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (onCancel) onCancel();
                if (onOpenChange) onOpenChange(false);
              }}
              className="rounded-lg h-10 px-4 font-black uppercase tracking-widest text-[10px] text-slate-500 hover:text-slate-900"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (!isDirty && !isCreate)}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg h-10 px-6 font-black uppercase tracking-widest text-[10px] shadow-sm transition-all"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isCreate ? 'Deploying...' : 'Saving...'}</span>
                </div>
              ) : isCreate ? (
                'Add Employee'
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  <span>Update Details</span>
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );

  // If onOpenChange is provided, wrap in Dialog, otherwise just return content
  // This allows the component to be used inside a page or as a modal
  if (onOpenChange) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] rounded-[24px] p-0 overflow-hidden border-none shadow-2xl flex flex-col">
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="bg-white rounded-[24px] overflow-hidden shadow-xl border border-slate-100 flex flex-col h-full">
      {content}
    </div>
  );
}
