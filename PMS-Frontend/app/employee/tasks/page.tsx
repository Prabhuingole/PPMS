'use client';

import { useState } from 'react';
import { useMyTasks } from '@/services/taskService';
import { useAuthStore } from '@/store/authStore';
import { Loader2, CheckSquare, Clock, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TaskFormDrawer } from '@/components/projects/TaskFormDrawer';
import { Task } from '@/types';
import { format } from 'date-fns';

export default function MyTasksPage() {
  const { user } = useAuthStore();
  const { data: tasks = [], isLoading } = useMyTasks();
  
  const [filter, setFilter] = useState('active'); // 'all', 'active', 'completed'
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsDrawerOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'MEDIUM': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'LOW': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return 'bg-emerald-100 text-emerald-700 border-0';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700 border-0';
      case 'REVIEW': return 'bg-purple-100 text-purple-700 border-0';
      case 'BLOCKED': return 'bg-red-100 text-red-700 border-0';
      case 'TODO': return 'bg-amber-100 text-amber-700 border-0';
      default: return 'bg-slate-100 text-slate-700 border-0';
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return task.status !== 'DONE';
    if (filter === 'completed') return task.status === 'DONE';
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex-1 p-8 bg-muted/30 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-8 bg-muted/30 min-h-[calc(100vh-4rem)]">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background p-6 rounded-xl border border-border shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-blue-600" />
              My Tasks
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage and update your assigned tasks across all projects.</p>
          </div>
          
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border border-border">
            <Button 
              variant={filter === 'active' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setFilter('active')}
              className={filter === 'active' ? 'shadow-sm' : ''}
            >
              Active
            </Button>
            <Button 
              variant={filter === 'completed' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setFilter('completed')}
              className={filter === 'completed' ? 'shadow-sm' : ''}
            >
              Completed
            </Button>
            <Button 
              variant={filter === 'all' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'shadow-sm' : ''}
            >
              All
            </Button>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="bg-background rounded-xl border border-border border-dashed p-12 text-center flex flex-col items-center justify-center shadow-sm">
            <CheckSquare className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-foreground">No tasks found</h3>
            <p className="text-sm text-muted-foreground mt-1">You're all caught up! Enjoy your day.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTasks.map(task => (
              <Card key={task.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleEdit(task)}>
                <CardContent className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`text-[10px] uppercase ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] uppercase ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </Badge>
                      {task.project_id && (
                        <span className="text-xs text-muted-foreground font-medium px-2 py-0.5 bg-muted rounded">
                          Project #{task.project_id}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-foreground truncate mb-1">
                      {task.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {task.description || <span className="italic opacity-50">No description</span>}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0 mt-4 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 pt-4 sm:pt-0">
                    <div className="flex flex-col items-start sm:items-end">
                      <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Est. Hours</span>
                      <span className="font-medium text-sm flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-slate-400" />
                        {task.estimated_hours}
                      </span>
                    </div>
                    <div className="flex flex-col items-start sm:items-end">
                      <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Due Date</span>
                      <span className="font-medium text-sm">
                        {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : '-'}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" className="hidden sm:flex">
                      Update
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </div>

      {editingTask && (
        <TaskFormDrawer
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setEditingTask(null);
          }}
          projectId={editingTask.project_id}
          editingTask={editingTask}
          deliverables={[]} // Consultants don't need to reassign deliverables
          teamMembers={user ? [user] : []} // Consultants can only see themselves
        />
      )}
    </div>
  );
}
