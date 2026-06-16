import { useState } from 'react';
import { TaskFilters } from './TaskFilters';
import { TaskKanbanBoard } from './TaskKanbanBoard';
import { TaskListTable } from './TaskListTable';
import { TaskFormDrawer } from './TaskFormDrawer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, LayoutGrid, List } from 'lucide-react';
import { Task, Deliverable } from '@/types';
import { useDeleteTask, useUpdateTask } from '@/services/taskService';
import { toast } from 'sonner';
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal';

interface TasksTabProps {
  projectId: number;
  tasks: Task[];
  deliverables: Deliverable[];
  teamMembers: any[];
  canEdit: boolean;
  filters: any;
  setFilters: React.Dispatch<React.SetStateAction<any>>;
}

export const TasksTab = ({ projectId, tasks, deliverables, teamMembers, canEdit, filters, setFilters }: TasksTabProps) => {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const deleteMutation = useDeleteTask(projectId);
  const updateMutation = useUpdateTask(projectId);

  const handleCreate = () => {
    setEditingTask(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync(deletingId);
      toast.success('Task deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete task');
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await updateMutation.mutateAsync({ id: taskId, data: { status: newStatus as any } });
      toast.success('Task status updated');
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  // Client-side filtering of the fetched tasks based on the search string
  // (Assuming backend already filters by status, priority, assignee if provided to useTasks)
  const filteredTasks = tasks.filter(t => {
    if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase()) && !t.description?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-bold text-foreground">Tasks</h3>
        
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v: any) => setView(v)} className="w-[120px]">
            <TabsList className="grid w-full grid-cols-2 h-9">
              <TabsTrigger value="kanban" className="data-[state=active]:bg-background"><LayoutGrid className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="list" className="data-[state=active]:bg-background"><List className="w-4 h-4" /></TabsTrigger>
            </TabsList>
          </Tabs>
          
          {canEdit && (
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 h-9">
              <Plus className="w-4 h-4 mr-1" /> Add Task
            </Button>
          )}
        </div>
      </div>

      <TaskFilters 
        filters={filters} 
        setFilters={setFilters} 
        teamMembers={teamMembers} 
      />

      <div className="pt-2">
        {view === 'kanban' ? (
          <TaskKanbanBoard 
            tasks={filteredTasks} 
            deliverables={deliverables}
            teamMembers={teamMembers}
            onEdit={handleEdit}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <TaskListTable 
            tasks={filteredTasks}
            deliverables={deliverables}
            teamMembers={teamMembers}
            onEdit={handleEdit}
            onDelete={(id) => setDeletingId(id)}
            canEdit={canEdit}
          />
        )}
      </div>

      <TaskFormDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        projectId={projectId}
        editingTask={editingTask}
        deliverables={deliverables}
        teamMembers={teamMembers}
      />

      <DeleteConfirmationModal
        isOpen={deletingId !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Task?"
        itemName="this task"
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};
