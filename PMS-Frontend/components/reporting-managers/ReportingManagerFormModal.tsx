'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { employeeService } from '@/services/employeeService';
import { Employee } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { companyService } from '@/services/companyService';
import { Company } from '@/types';

interface ReportingManagerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editingManager?: Employee | null;
}

export function ReportingManagerFormModal({ open, onOpenChange, onSuccess, editingManager }: ReportingManagerFormModalProps) {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile_number: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, setIsPending] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  useEffect(() => {
    if (user?.role === 'superadmin') {
      companyService.getCompanies({ company_type: 'in_house' }).then(setCompanies).catch(console.error);
    } else if (user?.company_id) {
      setSelectedCompanyId(user.company_id.toString());
    }
  }, [user]);

  useEffect(() => {
    if (open) {
      if (editingManager) {
        setFormData({
          full_name: editingManager.full_name,
          email: editingManager.email,
          mobile_number: editingManager.mobile_number || ''
        });
        setErrors({});
        if (editingManager.company_id) {
          setSelectedCompanyId(editingManager.company_id.toString());
        } else {
          setSelectedCompanyId('');
        }
      } else {
        setFormData({
          full_name: '',
          email: '',
          mobile_number: ''
        });
        setErrors({});
        if (user?.role === 'superadmin') {
          setSelectedCompanyId('');
        } else if (user?.company_id) {
          setSelectedCompanyId(user.company_id.toString());
        }
      }
    }
  }, [open, user, editingManager]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    let hasError = false;

    const lettersOnlyRegex = /^[a-zA-Z\s]+$/;
    if (!formData.full_name || !lettersOnlyRegex.test(formData.full_name)) {
      newErrors.full_name = 'Name can only contain letters and spaces';
      hasError = true;
    }

    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      hasError = true;
    }

    const phoneDigits = formData.mobile_number ? formData.mobile_number.replace(/\D/g, '') : '';
    if (!formData.mobile_number || !(phoneDigits.startsWith('91') && phoneDigits.length === 12)) {
      newErrors.mobile_number = 'Please enter a valid 10-digit Indian mobile number';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    const submitData = {
      full_name: formData.full_name,
      email: formData.email,
      mobile_number: formData.mobile_number,
    };

    try {
      setIsPending(true);
      if (editingManager) {
        await employeeService.updateEmployee(editingManager.id, {
          ...submitData,
          company_id: selectedCompanyId ? parseInt(selectedCompanyId) : null,
        });
        toast.success('Reporting manager updated successfully');
      } else {
        await employeeService.createEmployee({
          ...submitData,
          company_id: selectedCompanyId ? parseInt(selectedCompanyId) : null,
          role: 'reporting_manager',
          designation: 'Reporting Manager'
        });
        toast.success('Reporting manager created successfully');
      }
      
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || `An error occurred while ${editingManager ? 'updating' : 'creating'} manager`);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal={true}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingManager ? 'Edit' : 'Add'} Reporting Manager</DialogTitle>
          <DialogDescription>
            {editingManager ? 'Update reporting manager details.' : 'Create a new reporting manager.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="full_name" className={errors.full_name ? "text-red-500" : ""}>Name <span className="text-red-500">*</span></Label>
            <Input
              id="full_name"
              value={formData.full_name}
              className={errors.full_name ? "border-red-500 focus-visible:ring-red-500" : ""}
              onChange={(e) => {
                const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                setFormData({ ...formData, full_name: val });
                if (errors.full_name) setErrors({ ...errors, full_name: '' });
              }}
              placeholder="e.g. Jane Doe"
              required
            />
            {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className={errors.email ? "text-red-500" : ""}>Email <span className="text-red-500">*</span></Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              placeholder="jane.doe@example.com"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile_number" className={errors.mobile_number ? "text-red-500" : ""}>Phone Number <span className="text-red-500">*</span></Label>
            <PhoneInput
              country={'in'}
              onlyCountries={['in']}
              value={formData.mobile_number}
              onChange={(phone) => {
                setFormData({ ...formData, mobile_number: phone });
                if (errors.mobile_number) setErrors({ ...errors, mobile_number: '' });
              }}
              inputStyle={{
                width: '100%',
                height: '40px',
                borderRadius: '0.375rem',
                borderColor: errors.mobile_number ? 'red' : '#e2e8f0',
                backgroundColor: 'transparent'
              }}
              buttonStyle={{
                borderColor: errors.mobile_number ? 'red' : '#e2e8f0',
                backgroundColor: 'transparent',
                borderTopLeftRadius: '0.375rem',
                borderBottomLeftRadius: '0.375rem'
              }}
              containerStyle={{ width: '100%' }}
              searchPlaceholder="Search country..."
              searchNotFound="No country found"
            />
            {errors.mobile_number && <p className="text-xs text-red-500 mt-1">{errors.mobile_number}</p>}
          </div>

          {user?.role === 'superadmin' && (
            <div className="space-y-2">
              <Label htmlFor="company_id">Company (Optional)</Label>
              <Select 
                value={selectedCompanyId} 
                onValueChange={setSelectedCompanyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingManager ? 'Update' : 'Create'} Reporting Manager
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
