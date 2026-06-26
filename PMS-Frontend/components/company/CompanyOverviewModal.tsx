import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Building2, Mail, Phone, MapPin, User, Users, ExternalLink, Edit, FolderOpen, Loader2 } from 'lucide-react';
import { Company } from '@/types';
import { Badge } from '@/components/ui/badge';
import { projectService } from '@/services/projectService';

interface CompanyOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  onViewFullDetails: (company: Company) => void;
  onEdit: (company: Company) => void;
}

export function CompanyOverviewModal({ isOpen, onClose, company, onViewFullDetails, onEdit }: CompanyOverviewModalProps) {
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['company_projects', company?.id],
    queryFn: () => projectService.getProjects({ client_company_id: company!.id, limit: 100 }),
    enabled: !!company?.id && isOpen,
  });

  if (!company) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose} disablePointerDismissal={true}>
      <DialogContent 
        className="sm:max-w-[600px] p-0 overflow-hidden bg-card border-border rounded-2xl"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Company Overview for {company.name}</DialogTitle>
        <DialogDescription className="sr-only">Quick overview of client company details</DialogDescription>
        
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-6 text-white relative shadow-inner">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-sm">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{company.name}</h2>
                <p className="text-orange-100 font-medium text-sm mt-0.5">Code: {company.code}</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-none px-3 py-1 uppercase tracking-wider text-xs">
              {company.status}
            </Badge>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            
            {/* Primary Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded-xl p-4 border border-border/50 shadow-sm transition-all hover:shadow-md hover:bg-muted/50">
                <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Company Name</span>
                </div>
                <p className="font-semibold text-foreground">{company.company_name || company.name || '—'}</p>
              </div>
              
              <div className="bg-muted/30 rounded-xl p-4 border border-border/50 shadow-sm transition-all hover:shadow-md hover:bg-muted/50">
                <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Client Name</span>
                </div>
                <p className="font-semibold text-foreground">{company.contact_person || '—'}</p>
              </div>
            </div>

            {/* Contact Details */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2 border-b pb-2">
                <Mail className="w-4 h-4 text-orange-500" />
                Contact Information
              </h3>
              <div className="space-y-3 bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground">{company.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground">{company.phone || 'No phone provided'}</span>
                </div>
                {(company.address || company.city) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">
                      {[company.address, company.city].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Points of Contact */}
            {company.points_of_contact && company.points_of_contact.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2 border-b pb-2">
                  <Users className="w-4 h-4 text-amber-500" />
                  Points of Contact
                </h3>
                <div className="space-y-3">
                  {company.points_of_contact.map((poc, idx) => (
                    <div key={idx} className="bg-muted/30 border border-border/50 rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-2 shadow-sm hover:shadow-md transition-all">
                      <div>
                        <p className="font-semibold text-sm text-foreground">{poc.name}</p>
                        {poc.designation && <p className="text-xs text-muted-foreground">{poc.designation}</p>}
                      </div>
                      <div className="flex flex-col gap-1 sm:items-end">
                        {poc.email && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {poc.email}
                          </div>
                        )}
                        {poc.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {poc.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2 border-b pb-2">
                <FolderOpen className="w-4 h-4 text-orange-600" />
                Projects
              </h3>
              <div className="space-y-3">
                {isLoadingProjects ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-muted/30 rounded-xl border border-border/50">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading projects...
                  </div>
                ) : projectsData?.items && projectsData.items.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {projectsData.items.map((project) => (
                      <div key={project.id} className="bg-muted/30 border border-border/50 rounded-xl p-3 flex flex-col gap-1 shadow-sm transition-all hover:shadow-md hover:bg-muted/50">
                        <span className="font-semibold text-sm text-foreground">{project.name}</span>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">{project.code}</span>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize ${project.status === 'active' ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20' : 'bg-muted text-muted-foreground'}`}>
                            {project.status.replace('-', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-xl border border-border/50 text-center italic">
                    No projects associated with this client.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-muted/30 px-6 py-4 border-t border-border flex flex-col sm:flex-row justify-between gap-3 items-center">
          <Button variant="outline" onClick={() => onEdit(company)} className="w-full sm:w-auto font-medium shadow-sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit Client Details
          </Button>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto">
              Close
            </Button>
            <Button onClick={() => onViewFullDetails(company)} className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 shadow-sm font-medium text-white transition-all">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Full Details
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
