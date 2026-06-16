'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Company } from '@/types';
import { Building2, Mail, Phone, MapPin, Hash, Calendar, FileText, Users, UserCheck, Briefcase, ExternalLink, RefreshCw, Edit2, ChevronRight } from 'lucide-react';
import { CompanyStatusBadge } from './CompanyStatusBadge';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { companyService } from '@/services/companyService';
import { toast } from 'sonner';
import { useState } from 'react';

interface CompanyDetailsDrawerProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReactivateSuccess?: () => void;
  onEdit?: (company: Company) => void;
}

export function CompanyDetailsDrawer({ company, open, onOpenChange, onReactivateSuccess, onEdit }: CompanyDetailsDrawerProps) {
  const router = useRouter();
  const [isReactivating, setIsReactivating] = useState(false);

  if (!company) return null;

  const handleReactivate = async () => {
    try {
      setIsReactivating(true);
      await companyService.updateCompany({ id: company.id, payload: { status: 'active' } });
      toast.success('Client reactivated successfully');
      if (onReactivateSuccess) onReactivateSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to reactivate client');
    } finally {
      setIsReactivating(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[500px] overflow-y-auto p-0 bg-slate-50/50">
        
        {/* Dynamic Gradient Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 px-6 pt-10 pb-16">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
          <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4">
             <Building2 className="w-48 h-48 text-white" />
          </div>
          
          <div className="relative z-10 flex flex-col gap-3 mt-6">
            <div className="flex items-center gap-3">
              <CompanyStatusBadge status={company.status} />
              <div className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-semibold tracking-wider flex items-center gap-1.5 shadow-sm">
                <Hash className="w-3 h-3" />
                {company.code || 'NO CODE'}
              </div>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md break-words">{company.name}</h2>
            {company.company_name && (
              <p className="text-white/80 font-medium text-lg mt-0.5">{company.company_name}</p>
            )}
          </div>
        </div>

        <div className="px-6 pb-8 -mt-8 relative z-20 space-y-6">
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-3 bg-white p-2 rounded-2xl shadow-lg border border-slate-100 backdrop-blur-xl">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 justify-between bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 hover:from-indigo-100 hover:to-blue-100 border border-indigo-100 shadow-sm transition-all duration-300 rounded-xl font-semibold h-11"
                onClick={() => {
                  const path = company.company_type === 'in_house' ? 'in-house-companies' : 'companies';
                  onOpenChange(false);
                  router.push(`/superadmin/${path}/${company.id}`);
                }}
              >
                <span>View Full Details</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
              {onEdit && (
                <Button 
                  className="flex-1 bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 hover:from-slate-100 hover:to-slate-200 border border-slate-200 shadow-sm transition-all duration-300 rounded-xl font-semibold h-11" 
                  variant="outline" 
                  onClick={() => { onOpenChange(false); onEdit(company); }}
                >
                  <Edit2 className="h-4 w-4 mr-2 text-slate-500" />
                  Edit Details
                </Button>
              )}
            </div>
            {company.status === 'inactive' && (
              <Button 
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl font-semibold h-11 border-none" 
                onClick={handleReactivate} 
                disabled={isReactivating}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isReactivating ? 'animate-spin' : ''}`} />
                Reactivate Client
              </Button>
            )}
          </div>

          {/* Operational Metrics Grid */}
          {company.metrics && (
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => { onOpenChange(false); router.push(`/superadmin/employees?company_id=${company.id}`); }}
                className="group relative p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10 flex flex-col gap-2">
                  <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-slate-800 tracking-tight">{company.metrics.team_member_count}</p>
                    <p className="text-[11px] font-bold uppercase text-indigo-600/80 tracking-widest mt-0.5">Team Members</p>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => { onOpenChange(false); router.push(`/superadmin/employees?company_id=${company.id}&role=consultant`); }}
                className="group relative p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10 flex flex-col gap-2">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-slate-800 tracking-tight">{company.metrics.consultant_count}</p>
                    <p className="text-[11px] font-bold uppercase text-emerald-600/80 tracking-widest mt-0.5">Consultants</p>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => { onOpenChange(false); router.push(`/superadmin/reporting-managers?company_id=${company.id}`); }}
                className="group relative p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10 flex flex-col gap-2">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-slate-800 tracking-tight">{company.metrics.reporting_manager_count}</p>
                    <p className="text-[11px] font-bold uppercase text-amber-600/80 tracking-widest mt-0.5">Managers</p>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => { onOpenChange(false); router.push(`/superadmin/projects?company_id=${company.id}`); }}
                className="group relative p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10 flex flex-col gap-2">
                  <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-slate-800 tracking-tight">{company.metrics.project_count}</p>
                    <p className="text-[11px] font-bold uppercase text-blue-600/80 tracking-widest mt-0.5">Projects</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 group">
                <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-0.5">Contact Person</p>
                  <p className="text-sm font-semibold text-slate-800">{company.contact_person || 'Not provided'}</p>
                </div>
                {company.company_owner && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-0.5">Company Owner</p>
                    <p className="text-sm font-semibold text-slate-800">{company.company_owner}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 group">
                <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-500 group-hover:bg-pink-50 group-hover:text-pink-600 group-hover:border-pink-100 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-0.5">Email Address</p>
                  <p className="text-sm font-semibold text-slate-800">{company.email || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-0.5">Phone Number</p>
                  <p className="text-sm font-semibold text-slate-800">{company.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Location & Billing */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Location & Billing</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4 group">
                <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-500 group-hover:bg-amber-50 group-hover:text-amber-600 group-hover:border-amber-100 transition-colors shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-0.5">Address</p>
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed">{company.address || 'Not provided'}</p>
                  {company.city && <p className="text-sm text-slate-500 mt-0.5">{company.city}</p>}
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-0.5">GST Number</p>
                  <p className="text-sm font-semibold text-slate-800">{company.gst_number || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </SheetContent>
    </Sheet>
  );
}
