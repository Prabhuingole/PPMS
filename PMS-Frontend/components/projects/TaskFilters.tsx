import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { TaskStatus, TaskPriority, User } from '@/types';

interface TaskFiltersProps {
  filters: {
    status: string;
    priority: string;
    assignee_id: string;
    search: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<any>>;
  teamMembers: any[];
}

export const TaskFilters = ({ filters, setFilters, teamMembers }: TaskFiltersProps) => {
  const updateFilter = (key: string, value: string) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: 'all', priority: 'all', assignee_id: 'all', search: '' });
  };

  const hasActiveFilters = filters.status !== 'all' || filters.priority !== 'all' || filters.assignee_id !== 'all' || filters.search !== '';

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center bg-muted/20 p-3 rounded-lg border border-border">
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          className="pl-9 h-9 bg-background"
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
        />
      </div>

      <Select value={filters.status} onValueChange={(val) => updateFilter('status', val)}>
        <SelectTrigger className="w-full sm:w-[140px] h-9 bg-background">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="BACKLOG">Backlog</SelectItem>
          <SelectItem value="TODO">To Do</SelectItem>
          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
          <SelectItem value="REVIEW">Review</SelectItem>
          <SelectItem value="BLOCKED">Blocked</SelectItem>
          <SelectItem value="DONE">Done</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.priority} onValueChange={(val) => updateFilter('priority', val)}>
        <SelectTrigger className="w-full sm:w-[130px] h-9 bg-background">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="LOW">Low</SelectItem>
          <SelectItem value="MEDIUM">Medium</SelectItem>
          <SelectItem value="HIGH">High</SelectItem>
          <SelectItem value="CRITICAL">Critical</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.assignee_id} onValueChange={(val) => updateFilter('assignee_id', val)}>
        <SelectTrigger className="w-full sm:w-[160px] h-9 bg-background">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Assignees</SelectItem>
          {teamMembers.map(m => (
            <SelectItem key={m.id} value={m.id.toString()}>{m.full_name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-2 text-muted-foreground hover:text-foreground shrink-0">
          <X className="h-4 w-4 mr-1" /> Clear
        </Button>
      )}
    </div>
  );
};
