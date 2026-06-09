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
} from "@/components/ui/dialog";
import { createEmployeeSchema, updateEmployeeSchema, profileUpdateSchema } from '@/lib/validators/employee';
import { EnterpriseModalHeader } from '@/components/ui/enterprise-modal-header';
import { EnterpriseModalFooter } from '@/components/ui/enterprise-modal-footer';
import { FormSection } from '@/components/ui/form-section';
import { FormGrid } from '@/components/ui/form-grid';

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
      <EnterpriseModalHeader
        title={isCreate ? 'Add Employee' : isProfileEdit ? 'Edit Profile Details' : 'Edit Employee Details'}
        subtitle={isProfileEdit 
          ? 'Update your personal and professional information.' 
          : `Configure parameters for the ${isCreate ? 'new' : 'existing'} human resource inside the network.`}
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
                    name="employee_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-foreground">Identifier <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input
                            placeholder="SAM001"
                            {...field}
                            readOnly={isCreate}
                            disabled={mode === 'edit' || mode === 'profile_edit'} // usually ID cannot be edited once created
                            className="h-10 bg-muted cursor-not-allowed text-muted-foreground"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                      <FormLabel className="text-sm font-semibold text-foreground">Full Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} className="h-10" />
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
                      <FormLabel className="text-sm font-semibold text-foreground">Email Address <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="name@gmail.com" {...field} className="h-10" />
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
                      <FormLabel className="text-sm font-semibold text-foreground">Mobile Number <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input
                          placeholder="9876543210"
                          {...field}
                          maxLength={10}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            field.onChange(value);
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
                        <FormLabel className="text-sm font-semibold text-foreground">User Type <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || defaultValues?.role}>
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="employee">Employee</SelectItem>
                            <SelectItem value="intern">Intern</SelectItem>
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
                      <FormLabel className="text-sm font-semibold text-foreground">Designation <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Software Engineer" {...field} className="h-10" />
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
                  <h5 className="text-sm font-semibold text-primary">Security Protocol</h5>
                  <p className="text-sm text-primary/80 mt-1">
                    A secure temporary password will be auto-generated and dispatched to the resource's email inbox immediately upon creation.
                  </p>
                </div>
              </div>
            )}
          </div>

          <EnterpriseModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (onCancel) onCancel();
                if (onOpenChange) onOpenChange(false);
              }}
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
          </EnterpriseModalFooter>
        </form>
      </Form>
    </>
  );

  // If onOpenChange is provided, wrap in Dialog, otherwise just return content
  // This allows the component to be used inside a page or as a modal
  if (onOpenChange) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden border-border gap-0">
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="bg-background rounded-xl overflow-hidden shadow-sm border border-border flex flex-col h-full">
      {content}
    </div>
  );
}
