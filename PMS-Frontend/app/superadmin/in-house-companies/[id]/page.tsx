'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
import { InHouseCompanyFormModal } from '@/components/company/InHouseCompanyFormModal';
import { useQuery } from '@tanstack/react-query';
import { employeeService } from '@/services/employeeService';
import { projectService } from '@/services/projectService';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

function CompanyUsersList({ companyId, role, emptyText, icon: Icon }: any) {
  const router = useRouter();
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['company_users', companyId, role],
    queryFn: () => employeeService.getEmployees({ company_id: companyId, user_type: role === 'reporting_manager' ? undefined : role, is_reporting_manager: role === 'reporting_manager' ? true : undefined, limit: 100 }),
    enabled: !!companyId,
  });

  if (isLoading) return <div className="flex py-12 justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const users = usersData?.items || [];

  if (users.length === 0) {
    return (
      <Card className="border-dashed shadow-none bg-slate-50/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Icon className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">No Records Found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">{emptyText}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {users.map((user: any) => (
        <Card 
          key={user.id} 
          className="cursor-pointer hover:shadow-md transition-shadow border-border hover:border-indigo-200"
          onClick={() => router.push(`/superadmin/${role === 'reporting_manager' ? 'reporting-managers' : 'employees'}/${user.id}`)}
        >
          <CardContent className="p-6 flex items-start gap-4">
            <Avatar className="h-12 w-12 border border-border shrink-0">
               <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold">
                 {user.full_name.charAt(0)}
               </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-slate-900 truncate">{user.full_name}</h3>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {user.designation && (
                  <Badge variant="outline" className="text-[10px] uppercase text-muted-foreground bg-slate-50">{user.designation}</Badge>
                )}
                <Badge variant={user.is_active ? 'success' : 'secondary'} className="text-[10px] uppercase">{user.is_active ? 'Active' : 'Suspended'}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CompanyProjectsList({ companyId }: { companyId: number }) {
  const router = useRouter();
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['company_projects', companyId],
    queryFn: () => projectService.getProjects({ owner_company_id: companyId, limit: 100 }),
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <div className="flex py-12 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const projects = projectsData?.items || [];

  if (projects.length === 0) {
    return (
      <Card className="border-dashed shadow-none bg-slate-50/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Briefcase className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">No Projects Found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            This in-house company doesn't have any associated projects yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project: any) => (
        <Card 
          key={project.id} 
          className="cursor-pointer hover:shadow-md transition-shadow border-border hover:border-indigo-200"
          onClick={() => router.push(`/superadmin/projects/${project.id}`)}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-100">
                <Briefcase className="h-5 w-5 text-indigo-600" />
              </div>
              <Badge variant={project.status === 'active' ? 'success' : 'secondary'} className="uppercase text-[10px]">
                {project.status.replace('-', ' ')}
              </Badge>
            </div>
            <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{project.name}</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">Code: {project.code}</p>
            
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {project.start_date ? format(new Date(project.start_date), 'MMM dd, yyyy') : 'N/A'}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function CompanyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = parseInt(params.id as string);
  
  const defaultTab = searchParams.get('tab') || 'overview';
  
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
      router.push('/superadmin/in-house-companies');
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
        <Button variant="ghost" size="icon" onClick={() => router.push('/superadmin/in-house-companies')}>
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

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-xl overflow-x-auto flex-nowrap border border-border">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5">
            Overview
          </TabsTrigger>
          <TabsTrigger value="team-members" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5">
            <Users className="h-4 w-4 mr-2" />
            Team Members
          </TabsTrigger>
          <TabsTrigger value="consultants" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5">
            <UserCheck className="h-4 w-4 mr-2" />
            Consultants
          </TabsTrigger>
          <TabsTrigger value="reporting-managers" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5">
            <Briefcase className="h-4 w-4 mr-2" />
            Reporting Managers
          </TabsTrigger>
          <TabsTrigger value="projects" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5">
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
                {company.company_owner && (
                  <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-xl border border-border/50">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Company Owner</p>
                      <p className="font-semibold text-sm">{company.company_owner}</p>
                    </div>
                  </div>
                )}
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

            <Card className="shadow-sm border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold">Security & Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${company.restrict_clockin_to_office_ip ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 20 0"/><line x1="12" x2="12.01" y1="20" y2="20"/></svg>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Office Wi-Fi Restriction</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant={company.restrict_clockin_to_office_ip ? 'success' : 'secondary'} className="uppercase text-[10px]">
                        {company.restrict_clockin_to_office_ip ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                </div>
                {company.restrict_clockin_to_office_ip && company.office_ip_addresses && company.office_ip_addresses.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Allowed IP Addresses</p>
                    <div className="flex flex-wrap gap-2">
                      {company.office_ip_addresses.map((ip, idx) => (
                        <Badge key={idx} variant="outline" className="font-mono text-xs bg-slate-50">
                          {ip}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team-members" className="mt-6">
          <CompanyUsersList companyId={company.id} role="employee" emptyText="No team members assigned to this company." icon={Users} />
        </TabsContent>

        <TabsContent value="consultants" className="mt-6">
          <CompanyUsersList companyId={company.id} role="consultant" emptyText="No consultants assigned to this company." icon={UserCheck} />
        </TabsContent>

        <TabsContent value="reporting-managers" className="mt-6">
          <CompanyUsersList companyId={company.id} role="reporting_manager" emptyText="No reporting managers assigned to this company." icon={Briefcase} />
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <CompanyProjectsList companyId={company.id} />
        </TabsContent>
      </Tabs>
      
      <InHouseCompanyFormModal 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
        company={company}
        defaultCompanyType="in_house"
        onSuccess={() => fetchCompanyDetails()} 
      />
    </div>
  );
}
