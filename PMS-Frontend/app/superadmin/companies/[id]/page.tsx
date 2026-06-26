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
import { CompanyFormModal } from '@/components/company/CompanyFormModal';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';

function ClientProjects({ companyId }: { companyId: number }) {
  const router = useRouter();
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['company_projects', companyId],
    queryFn: () => projectService.getProjects({ client_company_id: companyId, limit: 100 }),
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <div className="flex py-12 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!projectsData?.items || projectsData.items.length === 0) {
    return (
      <Card className="border-dashed shadow-none bg-muted/30">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No Projects Found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            This client company doesn't have any associated projects yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projectsData.items.map((project) => (
        <Card 
          key={project.id} 
          className="cursor-pointer hover:shadow-md transition-shadow border-border hover:border-orange-200"
          onClick={() => router.push(`/superadmin/projects/${project.id}?from_client=${companyId}`)}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-orange-50 dark:bg-orange-500/10 p-2.5 rounded-xl border border-orange-100 dark:border-orange-500/20">
                <Briefcase className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <Badge variant={project.status === 'active' ? 'success' : 'secondary'} className="uppercase text-[10px]">
                {project.status.replace('-', ' ')}
              </Badge>
            </div>
            <h3 className="font-bold text-lg text-foreground line-clamp-1">{project.name}</h3>
            <p className="text-sm text-muted-foreground font-medium mt-1">Code: {project.code}</p>
            
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
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
          <div className="h-16 w-16 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-500/10 dark:to-blue-500/10 rounded-2xl flex items-center justify-center border border-indigo-200 dark:border-indigo-500/20 shadow-sm">
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="h-full w-full object-contain rounded-2xl" />
            ) : (
              <Building2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
              {company.company_name || company.name}
              <Badge variant={company.status === 'active' ? 'success' : 'secondary'} className="uppercase text-[10px] tracking-wider px-3 py-1">
                {company.status}
              </Badge>
            </h1>
            <p className="text-lg text-muted-foreground font-semibold mt-1">Client Contact: <span className="text-foreground">{company.contact_person || 'Not provided'}</span></p>
            <p className="text-sm text-muted-foreground font-medium mt-1">Company Code: {company.code}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setIsEditOpen(true)} className="ml-auto">
          <Edit className="h-4 w-4 mr-2" />
          Edit Details
        </Button>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-xl overflow-x-auto flex-nowrap border border-border">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 py-2.5">
            Overview
          </TabsTrigger>
          <TabsTrigger value="projects" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 py-2.5">
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
                  <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Contact Person</p>
                    <p className="font-semibold text-sm">{company.contact_person || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Email</p>
                    <p className="font-semibold text-sm">{company.email || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
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
                  <div className="h-10 w-10 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Address</p>
                    <p className="font-semibold text-sm">{company.address || 'Not provided'}</p>
                    {company.city && <p className="text-sm text-muted-foreground">{company.city}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">GST Number</p>
                    <p className="font-semibold text-sm">{company.gst_number || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Created On</p>
                    <p className="font-semibold text-sm">{company.created_at ? format(new Date(company.created_at), 'MMM dd, yyyy') : 'Unknown'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {company.points_of_contact && company.points_of_contact.length > 0 && (
              <Card className="shadow-sm border-border">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold">Points of Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {company.points_of_contact.map((poc, idx) => (
                    <div key={idx} className="bg-muted/30 border border-border/50 rounded-xl p-4 flex flex-col gap-2">
                      <div className="flex items-center gap-3 border-b border-border pb-2">
                        <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{poc.name}</p>
                          {poc.designation && <p className="text-xs text-muted-foreground font-medium">{poc.designation}</p>}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 pt-1">
                        {poc.email && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            {poc.email}
                          </div>
                        )}
                        {poc.phone && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            {poc.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <ClientProjects companyId={company.id} />
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
