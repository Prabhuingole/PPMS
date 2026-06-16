import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Deliverable } from '@/types';
import { useCreateDeliverable, useUpdateDeliverable } from '@/services/deliverableService';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface DeliverableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  editingDeliverable?: Deliverable | null;
}

export const DeliverableFormModal = ({ isOpen, onClose, projectId, editingDeliverable }: DeliverableFormModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState('planning');
  const [isActive, setIsActive] = useState(true);

  const createMutation = useCreateDeliverable();
  const updateMutation = useUpdateDeliverable(projectId);

  useEffect(() => {
    if (editingDeliverable) {
      setName(editingDeliverable.name);
      setDescription(editingDeliverable.description || '');
      setTargetDate(editingDeliverable.target_date ? editingDeliverable.target_date.split('T')[0] : '');
      setStatus(editingDeliverable.status);
      setIsActive(editingDeliverable.is_active !== false);
    } else {
      setName('');
      setDescription('');
      setTargetDate('');
      setStatus('planning');
      setIsActive(true);
    }
  }, [editingDeliverable, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    const payload = {
      project_id: projectId,
      name,
      description,
      target_date: targetDate || undefined,
      status,
      is_active: isActive
    };

    try {
      if (editingDeliverable) {
        await updateMutation.mutateAsync({ id: editingDeliverable.id, data: payload });
        toast.success('Deliverable updated successfully');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Deliverable created successfully');
      }
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'An error occurred');
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingDeliverable ? 'Edit Deliverable' : 'Create Deliverable'}</DialogTitle>
          <DialogDescription>
            {editingDeliverable ? 'Update the details of this deliverable.' : 'Add a new deliverable to the project.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Frontend Architecture" disabled={isSubmitting} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Describe what needs to be delivered..."
              className="resize-none"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_date">Target Date</Label>
              <Input 
                id="target_date" 
                type="date" 
                value={targetDate} 
                onChange={(e) => setTargetDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select 
                id="status" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="planning">Planning</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch 
              id="is_active" 
              checked={isActive} 
              onCheckedChange={setIsActive}
              disabled={isSubmitting}
            />
            <Label htmlFor="is_active">Active (available for tasks)</Label>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingDeliverable ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
