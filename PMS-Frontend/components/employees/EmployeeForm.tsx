'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Users, AlertCircle, Save, AlertTriangle } from 'lucide-react';
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
} from "@/components/ui/dialog";
import { createEmployeeSchema, updateEmployeeSchema, profileUpdateSchema } from '@/lib/validators/employee';
import { EnterpriseModalHeader } from '@/components/ui/enterprise-modal-header';
import { EnterpriseModalFooter } from '@/components/ui/enterprise-modal-footer';
import { FormSection } from '@/components/ui/form-section';
import { FormGrid } from '@/components/ui/form-grid';

import { useAuthStore } from '@/store/authStore';
import { companyService } from '@/services/companyService';
import { Company } from '@/types';
import api from '@/services/api';

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
      company_id: '',
    },
    mode: 'onChange',
  });

  const { user } = useAuthStore();
  const [companies, setCompanies] = useState<Company[]>([]);
  // Confirmation dialog state for miss-touch prevention
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (user?.role === 'superadmin') {
      companyService.getCompanies({ company_type: 'in_house' }).then(setCompanies).catch(console.error);
    }
  }, [user?.role]);

  // Reset form when defaultValues change or modal opens
  useEffect(() => {
    if (defaultValues && isOpen) {
      form.reset(defaultValues);
    } else if (!isOpen) {
      form.reset();
      setShowCancelConfirm(false);
    }
  }, [defaultValues, isOpen, form]);

  const handleSubmit = async (data: any) => {
    const payload = { ...data };
    if (payload.company_id === '') {
      payload.company_id = null;
    } else if (typeof payload.company_id === 'string' && payload.company_id) {
      payload.company_id = parseInt(payload.company_id, 10);
    }
    await onSubmit(payload);
  };

  // Handle close/cancel with dirty check
  const handleRequestClose = () => {
    if (form.formState.isDirty) {
      setShowCancelConfirm(true);
    } else {
      doClose();
    }
  };

  const doClose = () => {
    setShowCancelConfirm(false);
    form.reset();
    if (onCancel) onCancel();
    if (onOpenChange) onOpenChange(false);
  };

  const isProfileEdit = mode === 'profile_edit';
  const isCreate = mode === 'create';
  
  const isDirty = form.formState.isDirty;

  // Block numbers and special characters from name input
  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, arrow keys, home, end, ctrl+a/c/v/x
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', ' '];
    if (allowedKeys.includes(e.key)) return;
    if (e.ctrlKey || e.metaKey) return;
    // Block digits and special characters (only allow letters and spaces)
    if (!/^[a-zA-Z\s]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>, fieldOnChange: (v: string) => void) => {
    // Strip any numbers or special characters that might be pasted
    const cleaned = e.target.value.replace(/[^a-zA-Z\s]/g, '');
    fieldOnChange(cleaned);
  };

  // Async duplicate check for email
  const validateEmailUnique = async (email: string) => {
    if (!email || !email.includes('@')) return true;
    // Skip duplicate check when editing (same record)
    if (mode === 'edit' && defaultValues?.email?.toLowerCase() === email.toLowerCase()) return true;
    try {
      const res = await api.get(`/employees/?limit=1&search=${encodeURIComponent(email)}`);
      const items = res.data?.items || [];
      const match = items.find((emp: any) => emp.email?.toLowerCase() === email.toLowerCase());
      if (match) {
        form.setError('email', { type: 'manual', message: 'This email is already registered in the system.' });
        return false;
      }
      return true;
    } catch {
      return true; // allow on error
    }
  };

  // Async duplicate check for phone
  const validatePhoneUnique = async (phone: string) => {
    if (!phone || phone.length < 10) return true;
    if (mode === 'edit' && defaultValues?.mobile_number === phone) return true;
    try {
      const res = await api.get(`/employees/?limit=1&search=${encodeURIComponent(phone)}`);
      const items = res.data?.items || [];
      const match = items.find((emp: any) => emp.mobile_number === phone);
      if (match) {
        form.setError('mobile_number', { type: 'manual', message: 'This phone number is already registered in the system.' });
        return false;
      }
      return true;
    } catch {
      return true;
    }
  };

  const content = (
    <>
      <EnterpriseModalHeader
        title={isCreate ? 'Add Team Member' : isProfileEdit ? 'Edit Profile Details' : 'Edit Team Member Details'}
        subtitle={isProfileEdit 
          ? 'Update your personal and professional information.' 
          : `Fill in the details for the ${isCreate ? 'new' : 'existing'} team member.`}
        icon={Users}
        intent="normal"
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-full max-h-[80vh]">
          {/* Scrollable form content */}
          <div className="flex-1 overflow-y-auto p-6 bg-background">
            
            <FormSection title="Personal Information">
              <FormGrid>

                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem className={isCreate ? "md:col-span-2" : ""}>
                    <FormLabel required className="text-sm font-semibold text-foreground">Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        {...field}
                        onKeyDown={handleNameKeyDown}
                        onChange={(e) => handleNameChange(e, field.onChange)}
                        className="h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </FormGrid>
            </FormSection>

            <FormSection title="Contact Information">
              <FormGrid>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required className="text-sm font-semibold text-foreground">Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="name@gmail.com" 
                          {...field}
                          onChange={(e) => {
                            // strip spaces
                            field.onChange(e.target.value.replace(/\s/g, ''));
                          }}
                          onBlur={async (e) => {
                            field.onBlur();
                            await validateEmailUnique(e.target.value.trim());
                          }}
                          disabled={isProfileEdit} 
                          className={isProfileEdit ? "h-10 bg-muted cursor-not-allowed text-muted-foreground" : "h-10"} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mobile_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required className="text-sm font-semibold text-foreground">Mobile Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="9876543210"
                          {...field}
                          maxLength={10}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            field.onChange(value);
                          }}
                          onBlur={async (e) => {
                            field.onBlur();
                            await validatePhoneUnique(e.target.value);
                          }}
                          className="h-10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormGrid>
            </FormSection>

            <FormSection title="Professional Information">
              <FormGrid>
                {!isProfileEdit && (
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required className="text-sm font-semibold text-foreground">User Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || defaultValues?.role}>
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="employee">Team Member</SelectItem>
                            <SelectItem value="intern">Intern</SelectItem>
                            <SelectItem value="consultant">Consultant</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {user?.role === 'superadmin' && !isProfileEdit && (
                  <FormField
                    control={form.control}
                    name="company_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-foreground">Company</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ? field.value.toString() : undefined}>
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select company (Optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {companies.map(c => (
                              <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem className={isProfileEdit ? "md:col-span-2" : ""}>
                      <FormLabel required className="text-sm font-semibold text-foreground">Designation</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Software Engineer" 
                          {...field} 
                          className="h-10" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormGrid>
            </FormSection>

            {isCreate && (
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-md shrink-0">
                  <AlertCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-primary">Welcome Email</h5>
                  <p className="text-sm text-primary/80 mt-1">
                    A temporary password will be auto-generated and sent to the team member's email address immediately upon creation.
                  </p>
                </div>
              </div>
            )}
          </div>

          <EnterpriseModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleRequestClose}
              className="h-10 px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (!isDirty && !isCreate)}
              className="h-10 px-6"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isCreate ? 'Adding...' : 'Saving...'}</span>
                </div>
              ) : isCreate ? (
                'Add Team Member'
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  <span>Update Details</span>
                </div>
              )}
            </Button>
          </EnterpriseModalFooter>
        </form>
      </Form>
    </>
  );

  const cancelConfirmDialog = (
    <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm p-0 overflow-hidden border-border bg-background">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Discard Changes?</h3>
              <p className="text-xs text-muted-foreground mt-0.5">You have unsaved changes that will be lost.</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Are you sure you want to close this form? All unsaved information will be discarded.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-10 text-sm font-semibold"
              onClick={() => setShowCancelConfirm(false)}
            >
              Keep Editing
            </Button>
            <Button
              className="flex-1 h-10 text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white"
              onClick={doClose}
            >
              Discard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // If onOpenChange is provided, wrap in Dialog, otherwise just return content
  if (onOpenChange) {
    return (
      <>
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleRequestClose(); }}>
          <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden border-border gap-0">
            {content}
          </DialogContent>
        </Dialog>
        {cancelConfirmDialog}
      </>
    );
  }

  return (
    <>
      <div className="bg-background rounded-xl overflow-hidden shadow-sm border border-border flex flex-col h-full">
        {content}
      </div>
      {cancelConfirmDialog}
    </>
  );
}
