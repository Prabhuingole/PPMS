import { Progress } from '@/components/ui/progress';
import { Task } from '@/types';

interface DeliverableProgressProps {
  tasks: Task[];
  deliverableId: number;
}

export const DeliverableProgress = ({ tasks, deliverableId }: DeliverableProgressProps) => {
  const deliverableTasks = tasks.filter(t => t.deliverable_id === deliverableId && t.is_active);
  
  const totalEstimatedHours = deliverableTasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
  const completedTasks = deliverableTasks.filter(t => t.status === 'DONE');
  const completedEstimatedHours = completedTasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
  
  const progressPercentage = totalEstimatedHours > 0 
    ? Math.round((completedEstimatedHours / totalEstimatedHours) * 100) 
    : 0;

  return (
    <div className="flex flex-col space-y-2 w-full mt-2">
      <div className="flex justify-between text-xs text-muted-foreground font-medium">
        <span>Progress ({completedTasks.length}/{deliverableTasks.length} tasks)</span>
        <span>{progressPercentage}% ({completedEstimatedHours} / {totalEstimatedHours} hrs)</span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
    </div>
  );
};
