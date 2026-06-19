import { useState, useMemo } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragOverEvent, 
  DragEndEvent,
  useDroppable
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, Deliverable } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Edit, MessageSquare, Clock } from 'lucide-react';

const COLUMNS = [
  { id: 'BACKLOG', title: 'Backlog', color: 'bg-muted/30 border-border', dotColor: 'bg-slate-400' },
  { id: 'TODO', title: 'To Do', color: 'bg-muted/30 border-border', dotColor: 'bg-amber-400' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-muted/30 border-border', dotColor: 'bg-blue-400' },
  { id: 'REVIEW', title: 'Review', color: 'bg-muted/30 border-border', dotColor: 'bg-purple-400' },
  { id: 'BLOCKED', title: 'Blocked', color: 'bg-muted/30 border-border', dotColor: 'bg-red-400' },
  { id: 'DONE', title: 'Done', color: 'bg-muted/30 border-border', dotColor: 'bg-emerald-400' }
];

interface SortableTaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  assigneeName?: string;
  deliverableName?: string;
}

const SortableTaskItem = ({ task, onEdit, assigneeName, deliverableName }: SortableTaskItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id.toString(),
    data: { type: 'Task', task }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="opacity-30 border-2 border-dashed border-blue-400 dark:border-blue-500/50 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 h-[120px]" 
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-background border border-border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing mb-3 group ${!task.is_active ? 'opacity-60' : ''}`}
      onClick={() => onEdit(task)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-wrap gap-1 mb-1">
          <Badge variant="outline" className={`text-[9px] uppercase px-1 py-0 h-4 ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </Badge>
          {deliverableName && (
            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-muted/50 font-normal truncate max-w-[100px]">
              {deliverableName}
            </Badge>
          )}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted text-muted-foreground">
          <Edit className="w-3 h-3" />
        </div>
      </div>
      
      <h4 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight mb-3">
        {task.title}
      </h4>
      
      <div className="flex justify-between items-end mt-auto pt-2 border-t border-border/50">
        <div className="flex items-center gap-2">
          {assigneeName ? (
            <Avatar className="h-6 w-6 border border-border">
              <AvatarFallback className="text-[10px] bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300" title={assigneeName}>
                {assigneeName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-6 w-6 rounded-full bg-muted border border-dashed flex items-center justify-center text-[10px] text-muted-foreground">
              ?
            </div>
          )}
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            <span>{task.estimated_hours}h</span>
          </div>
        </div>
      </div>
    </div>
  );
};


const KanbanColumn = ({ col, children }: any) => {
  const { setNodeRef } = useDroppable({
    id: col.id,
    data: {
      type: 'Column',
      column: col
    }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex flex-col w-[300px] shrink-0 rounded-xl border ${col.color} p-3 overflow-hidden`}
    >
      {children}
    </div>
  );
};

interface TaskKanbanBoardProps {
  tasks: Task[];
  deliverables: Deliverable[];
  teamMembers: any[];
  onEdit: (task: Task) => void;
  onStatusChange: (taskId: number, newStatus: string) => void;
}

export const TaskKanbanBoard = ({ tasks, deliverables, teamMembers, onEdit, onStatusChange }: TaskKanbanBoardProps) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getDeliverableName = (id?: number) => {
    if (!id) return undefined;
    return deliverables.find(d => d.id === id)?.name;
  };

  const getAssigneeName = (id?: number) => {
    if (!id) return undefined;
    return teamMembers.find(m => m.id === id)?.full_name;
  };

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    // Only handling visual drag over logic if lists were state-managed manually.
    // For simple API-driven Kanban, we rely on DragEnd.
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    const isOverAColumn = over.data.current?.type === 'Column';
    const isOverATask = over.data.current?.type === 'Task';

    let newStatus = '';

    if (isActiveATask && isOverAColumn) {
      newStatus = over.data.current?.column.id;
    } else if (isActiveATask && isOverATask) {
      newStatus = over.data.current?.task.status;
    }

    if (newStatus && active.data.current?.task.status !== newStatus) {
      onStatusChange(Number(activeId), newStatus);
    }
  };

  return (
    <div className="w-full overflow-x-auto pb-4">
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={onDragStart} 
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-4 min-w-max h-[calc(100vh-300px)] min-h-[500px]">
          {COLUMNS.map(col => {
            const columnTasks = tasks.filter(t => t.status === col.id);
            return (
              <KanbanColumn key={col.id} col={col}>
                <div className="flex justify-between items-center mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                    <h3 className="font-bold text-sm text-foreground">{col.title}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-background text-xs font-mono">
                    {columnTasks.length}
                  </Badge>
                </div>
                
                <SortableContext items={columnTasks.map(t => t.id.toString())} strategy={verticalListSortingStrategy}>
                  <div className="flex-1 overflow-y-auto pr-1 kanban-scroll">
                    {columnTasks.map(task => (
                      <SortableTaskItem 
                        key={task.id} 
                        task={task} 
                        onEdit={onEdit}
                        assigneeName={getAssigneeName(task.assignee_id)}
                        deliverableName={getDeliverableName(task.deliverable_id)}
                      />
                    ))}
                    {columnTasks.length === 0 && (
                      <div className="h-full w-full border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center bg-background/50">
                        <span className="text-xs text-muted-foreground font-medium">Drop tasks here</span>
                      </div>
                    )}
                  </div>
                </SortableContext>
              </KanbanColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="opacity-80 rotate-2 scale-105">
              <SortableTaskItem 
                task={activeTask} 
                onEdit={() => {}} 
                assigneeName={getAssigneeName(activeTask.assignee_id)}
                deliverableName={getDeliverableName(activeTask.deliverable_id)}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <style dangerouslySetInnerHTML={{__html: `
        .kanban-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .kanban-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .kanban-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
      `}} />
    </div>
  );
};
