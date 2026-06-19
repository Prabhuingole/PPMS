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
      case 'CRITICAL': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50';
      case 'HIGH': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/50';
      case 'MEDIUM': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
      case 'LOW': return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800';
      default: return 'bg-muted text-muted-foreground border-transparent';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0';
      case 'IN_PROGRESS': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0';
      case 'REVIEW': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-0';
      case 'BLOCKED': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-0';
      case 'TODO': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0';
      default: return 'bg-muted/50 text-muted-foreground border-0';
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
            {filteredTasks.map(task => {
              // Extract base color from status to drive accents
              const getAccentClasses = () => {
                if (task.status === 'DONE') return 'bg-emerald-500 shadow-emerald-500/20';
                if (task.status === 'IN_PROGRESS') return 'bg-blue-500 shadow-blue-500/20';
                if (task.status === 'REVIEW') return 'bg-purple-500 shadow-purple-500/20';
                if (task.status === 'BLOCKED') return 'bg-red-500 shadow-red-500/20';
                return 'bg-amber-500 shadow-amber-500/20'; // TODO
              };

              return (
                <Card 
                  key={task.id} 
                  className="group overflow-hidden border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 cursor-pointer relative bg-background"
                  onClick={() => handleEdit(task)}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getAccentClasses()}`} />
                  
                  <CardContent className="p-0 flex flex-col sm:flex-row">
                    <div className="flex-1 p-5 pl-6 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge className={`text-[9px] font-bold tracking-wider uppercase border-none shadow-sm ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className={`text-[9px] font-bold tracking-wider uppercase border-none bg-muted/50 ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </Badge>
                        {task.project_id && (
                          <span className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase px-2 py-0.5 bg-muted/30 border border-border rounded-md shadow-sm">
                            Project #{task.project_id}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-foreground truncate mb-1.5 group-hover:text-primary transition-colors">
                        {task.title}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {task.description || <span className="italic opacity-50">No description provided for this task.</span>}
                      </p>
                    </div>
                    
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 sm:gap-3 p-5 bg-muted/20 sm:border-l border-t sm:border-t-0 border-border min-w-[160px] shrink-0">
                      <div className="flex flex-col items-start sm:items-end w-full">
                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-400" /> Est. Time
                        </span>
                        <span className="font-bold text-sm text-foreground font-mono">
                          {task.estimated_hours.toFixed(1)}h
                        </span>
                      </div>
                      
                      <div className="w-px h-8 bg-border sm:hidden" />

                      <div className="flex flex-col items-start sm:items-end w-full">
                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-1">
                          Due Date
                        </span>
                        <span className="font-bold text-sm text-foreground">
                          {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'No Date'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
