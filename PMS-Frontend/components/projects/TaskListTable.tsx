import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Task, Deliverable } from '@/types';
import { Edit, Trash2, Calendar, Target } from 'lucide-react';
import { format } from 'date-fns';

interface TaskListTableProps {
  tasks: Task[];
  deliverables: Deliverable[];
  teamMembers: any[];
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  canEdit: boolean;
}

export const TaskListTable = ({ tasks, deliverables, teamMembers, onEdit, onDelete, canEdit }: TaskListTableProps) => {
  const getDeliverableName = (id?: number) => {
    if (!id) return null;
    return deliverables.find(d => d.id === id)?.name;
  };

  const getAssignee = (id?: number) => {
    if (!id) return null;
    return teamMembers.find(m => m.id === id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200';
      case 'MEDIUM': return 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200';
      case 'LOW': return 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-0';
      case 'REVIEW': return 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-0';
      case 'BLOCKED': return 'bg-red-100 text-red-700 hover:bg-red-200 border-0';
      case 'TODO': return 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-0';
      default: return 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-0';
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="p-8 text-center bg-muted/30 border border-dashed rounded-xl">
        <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h4 className="text-lg font-semibold text-foreground">No Tasks Found</h4>
        <p className="text-sm text-muted-foreground mt-1">Adjust filters or create a new task.</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-background">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Deliverable</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Hours (Est/Act)</TableHead>
            {canEdit && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map(task => {
            const assignee = getAssignee(task.assignee_id);
            const deliverableName = getDeliverableName(task.deliverable_id);
            
            return (
              <TableRow key={task.id} className={!task.is_active ? 'opacity-60 bg-muted/20' : ''}>
                <TableCell>
                  <div className="flex flex-col min-w-[200px]">
                    <span className="font-semibold text-sm">{task.title}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">{task.description}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-indigo-50 text-indigo-700">
                          {assignee.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{assignee.full_name}</span>
                    </div>
                  ) : (
                    <span className="text-xs italic text-muted-foreground">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  {deliverableName ? (
                    <Badge variant="outline" className="text-[10px] bg-muted/50 font-normal">
                      {deliverableName}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={`text-[10px] uppercase ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] uppercase ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  {task.due_date ? (
                    <div className="flex items-center text-xs text-slate-500 whitespace-nowrap">
                      <Calendar className="w-3 h-3 mr-1" />
                      {format(new Date(task.due_date), 'MMM d, yyyy')}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-xs font-medium">
                    {task.estimated_hours} <span className="text-muted-foreground font-normal">/</span> {task.actual_hours}
                  </span>
                </TableCell>
                {canEdit && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600" onClick={() => onEdit(task)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => onDelete(task.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
