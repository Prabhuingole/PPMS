import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Deliverable, Task } from '@/types';
import { Edit, Trash2, Calendar, Target, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { DeliverableFormModal } from './DeliverableFormModal';
import { useDeleteDeliverable } from '@/services/deliverableService';
import { toast } from 'sonner';
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal';
import { DeliverableProgress } from './DeliverableProgress';

interface DeliverablesTabProps {
  projectId: number;
  deliverables: Deliverable[];
  tasks: Task[];
  canEdit: boolean;
}

export const DeliverablesTab = ({ projectId, deliverables, tasks, canEdit }: DeliverablesTabProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState<Deliverable | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const deleteMutation = useDeleteDeliverable(projectId);

  const handleEdit = (deliverable: Deliverable) => {
    setEditingDeliverable(deliverable);
    setIsFormOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingDeliverable(null);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync(deletingId);
      toast.success('Deliverable deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete deliverable');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-foreground">Project Deliverables</h3>
        {canEdit && (
          <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Deliverable
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {deliverables.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-muted/30 border border-dashed rounded-xl">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-lg font-semibold text-foreground">No Deliverables Yet</h4>
            <p className="text-sm text-muted-foreground mt-1">Create deliverables to organize your tasks.</p>
          </div>
        ) : (
          deliverables.map(deliverable => (
            <Card key={deliverable.id} className={`overflow-hidden transition-all border ${!deliverable.is_active ? 'opacity-60 bg-muted/50' : ''}`}>
              <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0 bg-muted/20 border-b">
                <div className="flex flex-col gap-1 min-w-0">
                  <CardTitle className="text-base font-bold truncate pr-2">{deliverable.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={deliverable.is_active ? 'default' : 'secondary'} className="text-[10px] uppercase">
                      {deliverable.status}
                    </Badge>
                    {!deliverable.is_active && (
                      <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600" onClick={() => handleEdit(deliverable)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => setDeletingId(deliverable.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                  {deliverable.description || <span className="italic opacity-50">No description provided</span>}
                </p>
                
                <div className="flex items-center text-xs text-slate-500 mb-3 bg-slate-50 p-2 rounded-md border">
                  <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                  Target Date: <span className="font-semibold text-foreground ml-1">{deliverable.target_date ? format(new Date(deliverable.target_date), 'MMM d, yyyy') : 'Not Set'}</span>
                </div>

                <DeliverableProgress tasks={tasks} deliverableId={deliverable.id} />
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <DeliverableFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        projectId={projectId} 
        editingDeliverable={editingDeliverable} 
      />

      <DeleteConfirmationModal
        isOpen={deletingId !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Deliverable?"
        itemName="this deliverable"
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};
