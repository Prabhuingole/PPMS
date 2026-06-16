import { useState } from 'react';
import { useTaskComments, useCreateTaskComment, useDeleteTaskComment } from '@/services/taskCommentService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Trash2, MessageSquare, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export const TaskCommentsPanel = ({ taskId }: { taskId: number }) => {
  const { user } = useAuthStore();
  const { data: comments, isLoading } = useTaskComments(taskId);
  const createMutation = useCreateTaskComment(taskId);
  const deleteMutation = useDeleteTaskComment(taskId);
  const [newComment, setNewComment] = useState('');

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    try {
      await createMutation.mutateAsync({ task_id: taskId, comment: newComment });
      setNewComment('');
    } catch (error) {
      toast.error('Failed to post comment');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="flex flex-col h-full bg-background border rounded-lg overflow-hidden mt-6">
      <div className="p-3 border-b bg-muted/20 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-blue-500" />
        <h4 className="font-semibold text-sm">Comments ({comments?.length || 0})</h4>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[300px]">
        {comments?.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center italic py-4">No comments yet. Start the conversation!</p>
        ) : (
          comments?.map((c: any) => (
            <div key={c.id} className="flex gap-3 group">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                  {c.user?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-muted/30 rounded-lg p-3 relative group">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-semibold">{c.user?.full_name || 'User'}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{c.comment}</p>
                
                {(user?.role === 'superadmin' || user?.role === 'admin' || user?.id === c.user_id?.toString()) && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-sm text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(c.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t bg-muted/10">
        <div className="relative">
          <Textarea 
            placeholder="Write a comment..." 
            className="min-h-[80px] text-sm resize-none pr-12 pb-10"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={createMutation.isPending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handlePostComment();
              }
            }}
          />
          <div className="absolute bottom-2 right-2 flex items-center justify-between left-2">
            <span className="text-[10px] text-muted-foreground">Press Enter to post</span>
            <Button 
              size="sm" 
              className="h-7 rounded-md px-3 bg-blue-600 hover:bg-blue-700" 
              onClick={handlePostComment}
              disabled={!newComment.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
