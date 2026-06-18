'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  Edit2,
  Briefcase,
  Loader2,
  FolderKanban,
  AtSign,
  Trash2,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { employeeService } from '@/services/employeeService';
import { projectService } from '@/services/projectService';
import { toast } from 'sonner';
import { ReportingManagerFormModal } from '@/components/reporting-managers/ReportingManagerFormModal';

export default function ReportingManagerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [manager, setManager] = useState<any>(null);
  const [managedProjects, setManagedProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const [data, managedData] = await Promise.all([
        employeeService.getEmployee(parseInt(resolvedParams.id)),
        projectService.getProjects({ manager_id: parseInt(resolvedParams.id), limit: 100 })
      ]);
      setManager(data);
      setManagedProjects(managedData.items || []);
    } catch (error) {
      toast.error('Failed to load reporting manager data');
      router.push('/superadmin/reporting-managers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [resolvedParams.id, router]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await employeeService.deleteEmployee(manager.id);
      toast.success('Reporting Manager deleted successfully');
      router.push('/superadmin/reporting-managers');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete reporting manager');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="text-sm font-bold text-muted-foreground tracking-wider animate-pulse">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (!manager) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-6 p-4 md:p-8">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="rounded-xl hover:bg-muted font-bold text-xs tracking-wider text-muted-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsEditModalOpen(true)} className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 px-6 font-bold text-xs tracking-wider">
            <Edit2 className="mr-2 h-3.5 w-3.5" /> Edit Details
          </Button>
          <Button onClick={() => setIsDeleteModalOpen(true)} className="bg-rose-600 text-white hover:bg-rose-700 rounded-xl shadow-lg shadow-rose-200 px-6 font-bold text-xs tracking-wider">
            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>

      {/* Hero Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <Card className="border border-border shadow-sm rounded-xl bg-background overflow-hidden relative">
          <div className="h-2 w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600"></div>
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="relative group">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-white shadow-md rounded-full relative z-10">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-900 to-indigo-800 text-white text-2xl font-bold rounded-full">
                    {manager.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-xl sm:text-3xl font-bold text-foreground tracking-tight">{manager.full_name}</h1>
                  <Badge className="rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider border-none bg-indigo-100 text-indigo-700">
                    Reporting Manager
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-3.5 text-slate-600 bg-muted/30 w-fit p-1.5 rounded-xl border border-border shadow-sm">
                  <div className="flex items-center gap-2 px-2.5">
                    <Mail className="h-3.5 w-3.5 text-pink-500" />
                    <span className="text-xs font-bold tracking-wider">{manager.email}</span>
                  </div>
                  {manager.mobile_number && (
                    <>
                      <div className="w-px h-3.5 bg-slate-200 self-center"></div>
                      <div className="flex items-center gap-2 px-2.5">
                        <Phone className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-xs font-bold tracking-wider">{manager.mobile_number}</span>
                      </div>
                    </>
                  )}
                  {manager.company_name && (
                    <>
                      <div className="w-px h-3.5 bg-slate-200 self-center"></div>
                      <div className="flex items-center gap-2 px-2.5">
                        <Building2 className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-xs font-bold tracking-wider">{manager.company_name}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex w-full md:w-auto md:flex-col gap-2.5 shrink-0">
                <div className="flex-1 text-center p-2.5 bg-gradient-to-br from-indigo-50 to-blue-50/50 rounded-xl border border-indigo-100/50 shadow-sm min-w-[140px]">
                  <div className="text-[10px] font-bold text-indigo-500 tracking-wider mb-0.5 flex justify-center items-center gap-1"><FolderKanban className="h-3 w-3" /> Managed Projects</div>
                  <div className="text-2xl font-bold text-indigo-700">{managedProjects.length}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Managed Projects List */}
      <Card className="border border-indigo-100/50 shadow-sm rounded-xl overflow-hidden bg-background relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-blue-50/10 pointer-events-none" />
        <CardHeader className="bg-indigo-50/50 py-4 px-6 border-b border-indigo-100/50 flex flex-row items-center justify-between relative z-10">
          <div>
            <CardTitle className="text-sm font-bold text-indigo-800 tracking-wider flex items-center gap-2">
              <FolderKanban className="h-4.5 w-4.5 text-indigo-500" /> Managed Projects
            </CardTitle>
            <CardDescription className="text-[10px] font-bold text-indigo-600/70 tracking-wider mt-0.5">
              Projects where {manager.full_name} acts as the Reporting Manager
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6 relative z-10">
          {managedProjects.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-xl border border-dashed border-indigo-100">
              <FolderKanban className="h-8 w-8 text-indigo-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-indigo-400 tracking-wider">No managed projects assigned yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {managedProjects.map((proj: any) => (
                <div
                  key={proj.id}
                  onClick={() => router.push(`/superadmin/projects/${proj.id}`)}
                  className="cursor-pointer p-4 rounded-xl bg-background border border-indigo-100 shadow-sm hover:shadow-md hover:border-indigo-300 hover:bg-indigo-50/30 transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-9 w-9 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Briefcase className="h-4 w-4 text-indigo-600" />
                    </div>
                    <Badge className={cn(
                      "rounded-md px-2 py-0.5 text-[8px] font-bold tracking-wider shadow-none border-none",
                      proj.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-muted/30 text-muted-foreground"
                    )}>
                      <span className={cn("h-1 w-1 rounded-full mr-1 inline-block", proj.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400')}></span>
                      {proj.status}
                    </Badge>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-700 transition-colors">{proj.name}</div>
                    <div className="text-[10px] font-bold text-muted-foreground tracking-wider line-clamp-1">{proj.code || 'NO-CODE'} &bull; {proj.client_name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ReportingManagerFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        editingManager={manager}
        onSuccess={fetchDetails}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDelete}
        itemName={`Reporting Manager "${manager.full_name}"`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
