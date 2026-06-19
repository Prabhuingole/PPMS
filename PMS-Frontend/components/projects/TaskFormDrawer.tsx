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
      <SheetContent className="sm:max-w-[640px] flex flex-col p-0 overflow-hidden">

        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <SheetTitle className="text-lg font-semibold">
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            {editingTask ? 'Update the task details below.' : 'Fill in the details to add a new task to this project.'}
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title {canEditCoreFields && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="title"
              placeholder="Enter task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              readOnly={!canEditCoreFields}
              className={!canEditCoreFields ? "bg-muted/30 h-10 border-transparent focus-visible:ring-0 cursor-default" : "h-10"}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="description"
              placeholder={canEditCoreFields ? "Describe this task (optional)..." : "No description provided."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={!canEditCoreFields ? "resize-none min-h-[90px] bg-muted/30 border-transparent focus-visible:ring-0 cursor-default" : "resize-none min-h-[90px]"}
              disabled={isSubmitting}
              readOnly={!canEditCoreFields}
            />
          </div>

          <div className="border-t border-border/60" />

          {/* Assignee — full width */}
          {!isConsultant && (
            <div className="space-y-2">
              <Label htmlFor="assignee" className="text-sm font-medium">Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId} disabled={isSubmitting || !canEditCoreFields}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a team member..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {teamMembers.map(m => (
                    <SelectItem key={m.id} value={m.id.toString()}>{m.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Status + Priority — two column */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">Status</Label>
              <Select value={status} onValueChange={setStatus} disabled={isSubmitting}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select status" />
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
              <Label htmlFor="priority" className="text-sm font-medium">Priority</Label>
              <Select value={priority} onValueChange={setPriority} disabled={isSubmitting || !canEditCoreFields}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Estimated Hours + Actual Hours — two column */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimated_hours" className="text-sm font-medium">
                Est. Hours <span className="text-destructive">*</span>
              </Label>
              <Input
                id="estimated_hours"
                type="number"
                min="0.5"
                step="0.5"
                placeholder="0"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
                disabled={isSubmitting || !canEditCoreFields}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actual_hours" className="text-sm font-medium">Actual Hours</Label>
              <Input
                id="actual_hours"
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                value={actualHours}
                onChange={(e) => setActualHours(parseFloat(e.target.value) || 0)}
                disabled={isSubmitting}
                className="h-10"
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date" className="text-sm font-medium">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isSubmitting || !canEditCoreFields}
              className="h-10"
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isSubmitting || !canEditCoreFields}
            />
            <div>
              <Label htmlFor="is_active" className="text-sm font-medium cursor-pointer">Active Task</Label>
              <p className="text-xs text-muted-foreground">Inactive tasks are hidden from the board by default</p>
            </div>
          </div>

          {/* Comments — only when editing */}
          {editingTask && (
            <>
              <div className="border-t border-border/60" />
              <TaskCommentsPanel taskId={editingTask.id} />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end gap-3 bg-background">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingTask ? 'Update Task' : 'Create Task'}
          </Button>
        </div>

      </SheetContent>
    </Sheet>
  );
};

