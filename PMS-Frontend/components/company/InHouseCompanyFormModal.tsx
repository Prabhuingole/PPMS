'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Company } from '@/types';
import { useCreateCompany, useUpdateCompany } from '@/services/companyService';
import { Loader2, Wifi, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

interface InHouseCompanyFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company | null;
  defaultCompanyType?: string;
  onSuccessCreate?: (company: Company) => void;
  onSuccess?: () => void;
}

export function InHouseCompanyFormModal({ open, onOpenChange, company, defaultCompanyType, onSuccessCreate, onSuccess }: InHouseCompanyFormModalProps) {
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
    company_type: defaultCompanyType || 'in_house',
    company_owner: ''
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
          company_type: company.company_type || defaultCompanyType || 'in_house',
          company_owner: company.company_owner || ''
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
          company_type: defaultCompanyType || 'in_house',
          company_owner: ''
        });
      }
      setErrors({});
    }
  }, [open, company]);

  const addIpAddress = () => {
    setFormData({
      ...formData,
      office_ip_addresses: [...(formData.office_ip_addresses || []), '']
    });
  };

  const removeIpAddress = (index: number) => {
    const newIps = [...(formData.office_ip_addresses || [])];
    newIps.splice(index, 1);
    setFormData({
      ...formData,
      office_ip_addresses: newIps
    });
  };

  const updateIpAddress = (index: number, value: string) => {
    const newIps = [...(formData.office_ip_addresses || [])];
    newIps[index] = value;
    setFormData({
      ...formData,
      office_ip_addresses: newIps
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    let hasError = false;

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Company Name is required';
      hasError = true;
    }

    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      hasError = true;
    }

    const phoneDigits = formData.phone ? formData.phone.replace(/\D/g, '') : '';
    if (formData.phone && !(phoneDigits.startsWith('91') && phoneDigits.length === 12)) {
      newErrors.phone = 'Please enter a valid 10-digit Indian mobile number';
      hasError = true;
    }

    const lettersOnlyRegex = /^[a-zA-Z\s]+$/;
    if (formData.contact_person && !lettersOnlyRegex.test(formData.contact_person)) {
      newErrors.contact_person = 'Contact person can only contain letters and spaces';
      hasError = true;
    }

    if (formData.company_owner && !lettersOnlyRegex.test(formData.company_owner)) {
      newErrors.company_owner = 'Company owner can only contain letters and spaces';
      hasError = true;
    }

    if (formData.gst_number) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
      if (!gstRegex.test(formData.gst_number)) {
        newErrors.gst_number = 'Please enter a valid GST Number format (e.g., 22AAAAA0000A1Z5)';
        hasError = true;
      }
    }

    if (formData.restrict_clockin_to_office_ip) {
      if (!formData.office_ip_addresses || formData.office_ip_addresses.length === 0) {
        newErrors.office_ip_addresses = 'Please add at least one allowed IP address, or disable the restriction.';
        hasError = true;
      } else {
        const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
        formData.office_ip_addresses.forEach((ip, idx) => {
          if (!ip.trim()) {
            newErrors[`office_ip_${idx}`] = 'IP address cannot be empty';
            hasError = true;
          } else if (!ipRegex.test(ip)) {
            newErrors[`office_ip_${idx}`] = 'Invalid IP format (e.g., 192.168.1.1)';
            hasError = true;
          } else {
            const parts = ip.split('.');
            const isValid = parts.every(p => parseInt(p, 10) >= 0 && parseInt(p, 10) <= 255);
            if (!isValid) {
              newErrors[`office_ip_${idx}`] = 'Invalid IP range (0-255)';
              hasError = true;
            }
          }
        });
      }
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    try {
      if (company) {
        await updateMutation.mutateAsync({ id: company.id, payload: formData });
        toast.success('In house company updated successfully');
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        const newCompany = await createMutation.mutateAsync(formData);
        toast.success('In house company created successfully');
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

  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setShowConfirmClose(true);
    } else {
      onOpenChange(newOpen);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange} disablePointerDismissal={true}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{company ? 'Edit In house Company' : 'Add In house Company'}</DialogTitle>
          <DialogDescription>
            {company ? 'Update the details for this in-house company.' : 'Add a new in-house company team.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className={errors.name ? "text-red-500" : ""}>Company Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={formData.name || ''}
                className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                  setFormData({ ...formData, name: val });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Company Code</Label>
              <Input
                id="code"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                disabled={!!company} // Cannot change code once created
                placeholder="e.g. ACME"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_person" className={errors.contact_person ? "text-red-500" : ""}>Contact Person</Label>
              <Input
                id="contact_person"
                value={formData.contact_person || ''}
                className={errors.contact_person ? "border-red-500 focus-visible:ring-red-500" : ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                  setFormData({ ...formData, contact_person: val });
                  if (errors.contact_person) setErrors({ ...errors, contact_person: '' });
                }}
              />
              {errors.contact_person && <p className="text-xs text-red-500 mt-1">{errors.contact_person}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_owner" className={errors.company_owner ? "text-red-500" : ""}>Company Owner</Label>
              <Input
                id="company_owner"
                value={formData.company_owner || ''}
                className={errors.company_owner ? "border-red-500 focus-visible:ring-red-500" : ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                  setFormData({ ...formData, company_owner: val });
                  if (errors.company_owner) setErrors({ ...errors, company_owner: '' });
                }}
              />
              {errors.company_owner && <p className="text-xs text-red-500 mt-1">{errors.company_owner}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="email" className={errors.email ? "text-red-500" : ""}>Email <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                onKeyDown={(e) => {
                  if (e.key === ' ') {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z0-9@.\-_+]/g, '');
                  setFormData({ ...formData, email: val });
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className={errors.phone ? "text-red-500" : ""}>Phone</Label>
              <PhoneInput
                country={'in'}
                onlyCountries={['in']}
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
              />
              {errors.gst_number && <p className="text-xs text-red-500 mt-1">{errors.gst_number}</p>}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-blue-600" />
                  Office Wi-Fi Restriction
                </Label>
                <p className="text-sm text-muted-foreground mt-1">Restrict employee clock-ins to specific office IP addresses.</p>
              </div>
              <Switch
                checked={formData.restrict_clockin_to_office_ip || false}
                onCheckedChange={(checked) => {
                  setFormData({ 
                    ...formData, 
                    restrict_clockin_to_office_ip: checked,
                    office_ip_addresses: checked && (!formData.office_ip_addresses || formData.office_ip_addresses.length === 0) ? [''] : formData.office_ip_addresses
                  });
                }}
              />
            </div>

            {formData.restrict_clockin_to_office_ip && (
              <div className="p-4 border rounded-lg bg-slate-50 dark:bg-muted/30 space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label className={errors.office_ip_addresses ? "text-red-500" : ""}>Allowed Public IP Addresses</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addIpAddress}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add IP
                    </Button>
                  </div>
                  {errors.office_ip_addresses && <p className="text-xs text-red-500">{errors.office_ip_addresses}</p>}
                  
                  {formData.office_ip_addresses?.map((ip, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1 space-y-1">
                        <Input
                          placeholder="e.g. 203.0.113.45"
                          value={ip}
                          onChange={(e) => updateIpAddress(index, e.target.value.replace(/[^0-9.]/g, ''))}
                          className={errors[`office_ip_${index}`] ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors[`office_ip_${index}`] && <p className="text-xs text-red-500">{errors[`office_ip_${index}`]}</p>}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIpAddress(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            <Button type="button" variant="outline" onClick={() => setShowConfirmClose(true)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {company ? 'Save Changes' : 'Create Company'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
      <DialogContent className="sm:max-w-[340px] p-0 overflow-hidden border-none shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] rounded-[2rem] bg-card" showCloseButton={false}>
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
           <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>
           
           <div className="flex flex-col items-center text-center relative z-10">
             <div className="h-16 w-16 bg-white/10 rounded-[1.25rem] backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl mb-3 relative">
                <div className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-rose-500 rounded-full flex items-center justify-center animate-ping opacity-75"></div>
                <div className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-rose-500 rounded-full flex items-center justify-center shadow-lg border border-white/20">
                  <div className="h-1.5 w-1.5 bg-white rounded-full"></div>
                </div>
               <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white drop-shadow-md"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
             </div>
             <DialogTitle className="text-xl font-black tracking-tight text-white mb-1.5">
               Are you sure?
             </DialogTitle>
             <DialogDescription className="text-blue-100 font-medium text-xs leading-relaxed px-2">
               You are about to quit creating this company. Unsaved data will be lost.
             </DialogDescription>
           </div>
        </div>
        <div className="p-5 bg-card flex flex-col gap-2">
          <Button className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm h-10" onClick={() => {
            setShowConfirmClose(false);
            onOpenChange(false);
          }}>
            Yes, Quit
          </Button>
          <Button variant="outline" onClick={() => setShowConfirmClose(false)} className="w-full rounded-xl h-10">
            Continue Editing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
