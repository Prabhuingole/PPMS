import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Task, Deliverable } from '@/types';
import { useCreateTask, useUpdateTask } from '@/services/taskService';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { TaskCommentsPanel } from './TaskCommentsPanel';

interface TaskFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  editingTask?: Task | null;
  deliverables: Deliverable[];
  teamMembers: any[];
}

export const TaskFormDrawer = ({ isOpen, onClose, projectId, editingTask, deliverables, teamMembers }: TaskFormDrawerProps) => {
  const { user } = useAuthStore();
  const isConsultant = user?.role === 'employee' || user?.role === 'intern';
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>('none');
  const [deliverableId, setDeliverableId] = useState<string>('none');
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState('TODO');
  const [estimatedHours, setEstimatedHours] = useState<number>(0);
  const [actualHours, setActualHours] = useState<number>(0);
  const [dueDate, setDueDate] = useState('');
  const [isActive, setIsActive] = useState(true);

  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask(projectId);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setAssigneeId(editingTask.assignee_id ? editingTask.assignee_id.toString() : 'none');
      setDeliverableId(editingTask.deliverable_id ? editingTask.deliverable_id.toString() : 'none');
      setPriority(editingTask.priority);
      setStatus(editingTask.status);
      setEstimatedHours(editingTask.estimated_hours || 0);
      setActualHours(editingTask.actual_hours || 0);
      setDueDate(editingTask.due_date ? editingTask.due_date.split('T')[0] : '');
      setIsActive(editingTask.is_active !== false);
    } else {
      setTitle('');
      setDescription('');
      setAssigneeId('none');
      setDeliverableId('none');
      setPriority('MEDIUM');
      setStatus('TODO');
      setEstimatedHours(0);
      setActualHours(0);
      setDueDate('');
      setIsActive(true);
    }
  }, [editingTask, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (estimatedHours <= 0) {
      toast.error('Estimated hours must be greater than 0');
      return;
    }

    const payload = {
      project_id: projectId,
      title,
      description,
      assignee_id: assigneeId === 'none' ? undefined : parseInt(assigneeId),
      deliverable_id: deliverableId === 'none' ? undefined : parseInt(deliverableId),
      priority: priority as any,
      status: status as any,
      estimated_hours: estimatedHours,
      actual_hours: actualHours,
      due_date: dueDate || undefined,
      is_active: isActive
    };

    try {
      if (editingTask) {
        await updateMutation.mutateAsync({ id: editingTask.id, data: payload });
        toast.success('Task updated');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Task created');
      }
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'An error occurred');
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Consultants cannot change assignee or deliverable or priority
  const canEditCoreFields = !isConsultant;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto w-full">
        <SheetHeader className="mb-4">
          <SheetTitle>{editingTask ? 'Task Details' : 'Create Task'}</SheetTitle>
          <SheetDescription>
            {editingTask ? 'View and edit task details below.' : 'Add a new task to the project.'}
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isSubmitting || !canEditCoreFields} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              className="resize-none"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId} disabled={isSubmitting || !canEditCoreFields}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {teamMembers.map(m => (
                    <SelectItem key={m.id} value={m.id.toString()}>{m.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliverable">Deliverable</Label>
              <Select value={deliverableId} onValueChange={setDeliverableId} disabled={isSubmitting || !canEditCoreFields}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Deliverable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {deliverables.filter(d => d.is_active || d.id.toString() === deliverableId).map(d => (
                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BACKLOG">Backlog</SelectItem>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="REVIEW">Review</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority} disabled={isSubmitting || !canEditCoreFields}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_hours">Est. Hours <span className="text-red-500">*</span></Label>
              <Input 
                id="estimated_hours" 
                type="number" 
                step="0.5" 
                value={estimatedHours} 
                onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)} 
                disabled={isSubmitting || !canEditCoreFields} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actual_hours">Actual Hours</Label>
              <Input 
                id="actual_hours" 
                type="number" 
                step="0.5" 
                value={actualHours} 
                onChange={(e) => setActualHours(parseFloat(e.target.value) || 0)} 
                disabled={isSubmitting} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input 
                id="due_date" 
                type="date" 
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isSubmitting || !canEditCoreFields}
              />
            </div>
            
            <div className="space-y-2 flex flex-col justify-end pb-2">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="is_active" 
                  checked={isActive} 
                  onCheckedChange={setIsActive}
                  disabled={isSubmitting || !canEditCoreFields}
                />
                <Label htmlFor="is_active">Active Task</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTask ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>

        {/* Task Comments Panel - only show when editing an existing task */}
        {editingTask && (
          <TaskCommentsPanel taskId={editingTask.id} />
        )}
      </SheetContent>
    </Sheet>
  );
};
