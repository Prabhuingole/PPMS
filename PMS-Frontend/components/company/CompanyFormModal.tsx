'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Company } from '@/types';
import { useCreateCompany, useUpdateCompany } from '@/services/companyService';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

interface CompanyFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company | null;
  defaultCompanyType?: string;
  onSuccessCreate?: (company: Company) => void;
  onSuccess?: () => void;
}

export function CompanyFormModal({ open, onOpenChange, company, defaultCompanyType, onSuccessCreate, onSuccess }: CompanyFormModalProps) {
  const [formData, setFormData] = useState<Partial<Company>>({
    name: '',
    code: '',
    email: '',
    phone: '',
    contact_person: '',
    address: '',
    city: '',
    gst_number: '',
    status: 'active',
    company_type: defaultCompanyType || 'client',
    company_name: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      if (company) {
        setFormData({
          ...company,
          address: company.address || '',
          city: company.city || '',
          gst_number: company.gst_number || '',
          status: company.status || 'active',
          company_type: company.company_type || defaultCompanyType || 'client',
          company_name: company.company_name || ''
        });
      } else {
        setFormData({
          name: '',
          code: '',
          email: '',
          phone: '',
          contact_person: '',
          address: '',
          city: '',
          gst_number: '',
          status: 'active',
          company_type: defaultCompanyType || 'client',
          company_name: ''
        });
      }
      setErrors({});
    }
  }, [open, company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    let hasError = false;

    const emailToValidate = (formData.email || '').trim();
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (emailToValidate && !emailRegex.test(emailToValidate)) {
      newErrors.email = 'Please enter a valid email address';
      hasError = true;
    }

    if (formData.phone && formData.phone.replace(/\D/g, '').length < 8) {
      newErrors.phone = 'Please enter a valid phone number';
      hasError = true;
    }

    if (formData.gst_number && formData.gst_number.length !== 15) {
      newErrors.gst_number = 'GST Number must be exactly 15 alphanumeric characters';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    const payloadToSubmit = {
      ...formData,
      email: emailToValidate
    };

    try {
      if (company) {
        await updateMutation.mutateAsync({ id: company.id, payload: payloadToSubmit });
        toast.success('Client updated successfully');
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        const newCompany = await createMutation.mutateAsync(payloadToSubmit);
        toast.success('Client created successfully');
        onOpenChange(false);
        if (onSuccessCreate) {
          onSuccessCreate(newCompany);
        }
        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'An error occurred');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{company ? 'Edit Client' : 'Create New Client'}</DialogTitle>
          <DialogDescription>
            {company ? 'Update the details' : 'Onboard a new tenant client.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Client Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                  setFormData({ ...formData, name: val });
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={formData.company_name || ''}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Client Code</Label>
              <Input
                id="code"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                disabled={!!company} // Cannot change code once created
                placeholder="e.g. ACME"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                value={formData.contact_person || ''}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className={errors.email ? "text-red-500" : ""}>Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className={errors.phone ? "text-red-500" : ""}>Phone</Label>
              <PhoneInput
                country={'in'}
                enableSearch={true}
                value={formData.phone || ''}
                onChange={(phone) => {
                  setFormData({ ...formData, phone });
                  if (errors.phone) setErrors({ ...errors, phone: '' });
                }}
                inputStyle={{
                  width: '100%',
                  height: '40px',
                  borderRadius: '0.375rem',
                  borderColor: errors.phone ? 'red' : '#e2e8f0',
                  backgroundColor: 'transparent'
                }}
                buttonStyle={{
                  borderColor: errors.phone ? 'red' : '#e2e8f0',
                  backgroundColor: 'transparent',
                  borderTopLeftRadius: '0.375rem',
                  borderBottomLeftRadius: '0.375rem'
                }}
                containerStyle={{ width: '100%' }}
                searchPlaceholder="Search country..."
                searchNotFound="No country found"
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gst_number" className={errors.gst_number ? "text-red-500" : ""}>GST Number</Label>
              <Input
                id="gst_number"
                value={formData.gst_number || ''}
                className={errors.gst_number ? "border-red-500 focus-visible:ring-red-500 uppercase" : "uppercase"}
                maxLength={15}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 15);
                  setFormData({ ...formData, gst_number: val });
                  if (errors.gst_number) setErrors({ ...errors, gst_number: '' });
                }}
                placeholder="e.g. 22AAAAA0000A1Z5"
              />
              {errors.gst_number && <p className="text-xs text-red-500 mt-1">{errors.gst_number}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {company ? 'Save Changes' : 'Create Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
