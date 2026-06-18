"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  isDeleting?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onOpenChange,
  onConfirm,
  title = "Confirm Deletion",
  description,
  itemName = "this item",
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} disablePointerDismissal={true}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] rounded-[2rem] bg-card">
        <div className="bg-gradient-to-br from-red-600 to-rose-700 p-8 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>
           
           <div className="flex flex-col items-center text-center relative z-10">
             <div className="h-20 w-20 bg-white/10 rounded-[1.5rem] backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl mb-4 relative">
                <div className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center animate-ping opacity-75"></div>
                <div className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg border border-white/20">
                  <AlertTriangle className="h-3 w-3 text-white" />
                </div>
               <Trash2 className="h-10 w-10 text-white drop-shadow-md" />
             </div>
             
             <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white mb-2">
               {title}
             </DialogTitle>
             <DialogDescription className="text-red-100 font-bold text-sm">
               {description || `Are you absolutely sure you want to permanently delete ${itemName}?`}
             </DialogDescription>
           </div>
        </div>
        
        <div className="p-8 bg-card">
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 mb-8">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-red-800 leading-relaxed">
              This action cannot be undone. All data associated with {itemName} will be permanently removed from our servers.
            </p>
          </div>
          
          <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
              className="w-full sm:w-1/2 h-14 rounded-xl border-border text-slate-600 font-bold uppercase text-[10px] tracking-widest hover:bg-muted transition-colors"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={onConfirm}
              disabled={isDeleting}
              className="w-full sm:w-1/2 h-14 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-200 transition-all hover:-translate-y-0.5 active:scale-95"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Deleting...</span>
                </div>
              ) : (
                'Delete Permanently'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
