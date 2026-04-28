import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';

interface DeleteTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskTitle: string;
}

export default function DeleteTaskDialog({ isOpen, onClose, onConfirm, taskTitle }: DeleteTaskDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <DialogTitle className="text-xl">Delete Task</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2 leading-relaxed">
            Are you sure you want to delete "<strong>{taskTitle}</strong>"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="h-11 px-6 text-base">
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-red-600 hover:bg-red-700 text-white h-11 px-6 text-base"
            onClick={handleConfirm}
          >
            Delete Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
