'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Building2, 
  Loader2, 
  Users, 
  UserCheck, 
  Briefcase,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { companyService } from '@/services/companyService';
import { Company } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CompanyFormModal } from '@/components/company/CompanyFormModal';

export default function CompanyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = parseInt(params.id as string);
  
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      const data = await companyService.getCompany(companyId);
      setCompany(data);
    } catch (error) {
      toast.error('Failed to load company details');
      router.push('/superadmin/companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchCompanyDetails();
    }
  }, [companyId, router]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading company workspace...</p>
        </div>
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/superadmin/companies')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-4 flex-1">
          <div className="h-16 w-16 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl flex items-center justify-center border border-indigo-200 shadow-sm">
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="h-full w-full object-contain rounded-2xl" />
            ) : (
              <Building2 className="h-8 w-8 text-indigo-600" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              {company.name}
              <Badge variant={company.status === 'active' ? 'success' : 'secondary'} className="uppercase text-[10px] tracking-wider px-3 py-1">
                {company.status}
              </Badge>
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Company Code: {company.code}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setIsEditOpen(true)} className="ml-auto">
          <Edit className="h-4 w-4 mr-2" />
          Edit Details
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-xl overflow-x-auto flex-nowrap border border-border">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5">
            Overview
          </TabsTrigger>
          <TabsTrigger value="team-members" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5" onClick={() => router.push(`/superadmin/employees?company_id=${company.id}`)}>
            <Users className="h-4 w-4 mr-2" />
            Team Members
          </TabsTrigger>
          <TabsTrigger value="consultants" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5" onClick={() => router.push(`/superadmin/employees?company_id=${company.id}&role=consultant`)}>
            <UserCheck className="h-4 w-4 mr-2" />
            Consultants
          </TabsTrigger>
          <TabsTrigger value="reporting-managers" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5" onClick={() => router.push(`/superadmin/reporting-managers?company_id=${company.id}`)}>
            <Briefcase className="h-4 w-4 mr-2" />
            Reporting Managers
          </TabsTrigger>
          <TabsTrigger value="projects" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5" onClick={() => router.push(`/superadmin/projects?company_id=${company.id}`)}>
            <FileText className="h-4 w-4 mr-2" />
            Projects
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold">Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Contact Person</p>
                    <p className="font-semibold text-sm">{company.contact_person || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Email</p>
                    <p className="font-semibold text-sm">{company.email || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Phone</p>
                    <p className="font-semibold text-sm">{company.phone || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold">Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Address</p>
                    <p className="font-semibold text-sm">{company.address || 'Not provided'}</p>
                    {company.city && <p className="text-sm text-slate-500">{company.city}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">GST Number</p>
                    <p className="font-semibold text-sm">{company.gst_number || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-violet-50 flex items-center justify-center text-violet-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Created On</p>
                    <p className="font-semibold text-sm">{company.created_at ? format(new Date(company.created_at), 'MMM dd, yyyy') : 'Unknown'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <CompanyFormModal 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
        company={company} 
        onSuccess={() => fetchCompanyDetails()} 
      />
    </div>
  );
}
