import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CreateTaskRequest, DeveloperSummary, createTask } from '../api/taskDataApi';

interface CreateTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  developers?: DeveloperSummary[];
  defaultDeveloperId?: string;
  projectId?: number;
}

export default function CreateTaskDialog({
  isOpen,
  onClose,
  onCreated,
  developers = [],
  defaultDeveloperId,
  projectId,
}: CreateTaskDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [taskType, setTaskType] = useState('new-feature');
  const [status, setStatus] = useState('open');
  const [deadline, setDeadline] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('1');
  const [sprint, setSprint] = useState('');
  const [developerID, setDeveloperID] = useState(defaultDeveloperId ?? developers[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!developerID && developers.length > 0) {
      setDeveloperID(defaultDeveloperId ?? developers[0]?.id ?? '');
    }
  }, [developers]);

  // Lock body scroll while open, same as CreateTaskModal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPriority('MEDIUM');
    setTaskType('new-feature');
    setStatus('open');
    setDeadline('');
    setEstimatedTime('1');
    setSprint('');
    setDeveloperID(defaultDeveloperId ?? developers[0]?.id ?? '');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !deadline) {
      setError('Please fill in all required fields.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const payload: CreateTaskRequest = {
        name: name.trim(),
        description: description.trim(),
        priority,
        taskType,
        status,
        deadline: `${deadline}T23:59:59`,
        estimatedTime: Math.max(1, Number(estimatedTime) || 1),
        developerID: Number(defaultDeveloperId ?? developerID ?? developers[0]?.id ?? 0),
        projectID: projectId ?? 1,
        ...(sprint ? { sprint: Number(sprint) } : {}),
      };
      console.debug('CreateTaskDialog: creating task payload', payload);

      if (!payload.developerID || payload.developerID === 0) {
        throw new Error('No developer id available to assign task');
      }

      await createTask(payload);
      onCreated();
      handleClose();
    } catch (err: any) {
      console.error('CreateTaskDialog: createTask failed', err);
      setError(err?.message || 'Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-blue-200 [&::-webkit-scrollbar-thumb:hover]:bg-blue-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-slate-900 text-xl font-semibold">Create New Task</h2>
            <p className="text-sm text-slate-500 mt-0.5">Fill in the details for the new task</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cd-name" className="text-base">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cd-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter task title"
              className="h-12 text-base !border-blue-300"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cd-description" className="text-base">
              Description <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="cd-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows={4}
              className="flex w-full rounded-md border border-blue-300 px-3 py-2 text-sm bg-transparent placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blue-300/50 focus-visible:border-blue-400 resize-none transition-[color,box-shadow]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-base">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-12 text-base !border-blue-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open" className="text-base">To Do</SelectItem>
                  <SelectItem value="in_progress" className="text-base">In Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-base">Type/Category</Label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger className="h-12 text-base !border-blue-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new-feature" className="text-base">New Feature</SelectItem>
                  <SelectItem value="bug-fixed" className="text-base">Bug Fix</SelectItem>
                  <SelectItem value="improved-feature" className="text-base">Improvement</SelectItem>
                  <SelectItem value="documentation" className="text-base">Documentation</SelectItem>
                  <SelectItem value="review" className="text-base">Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cd-deadline" className="text-base">
                Deadline <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cd-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="h-12 text-base !border-blue-300"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cd-estimated" className="text-base">
                Estimated Time (hours) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cd-estimated"
                type="number"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                placeholder="e.g., 8"
                className="h-12 text-base !border-blue-300"
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-base">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-12 text-base !border-blue-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH" className="text-base">High</SelectItem>
                  <SelectItem value="MEDIUM" className="text-base">Medium</SelectItem>
                  <SelectItem value="LOW" className="text-base">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cd-sprint" className="text-base">Sprint</Label>
              <Input
                id="cd-sprint"
                type="number"
                min="0"
                placeholder="e.g. 1"
                value={sprint}
                onChange={(e) => setSprint(e.target.value)}
                className="h-12 text-base !border-blue-300"
              />
            </div>
          </div>

          {/* Assigned Developer: auto-assigned to signed-in developer (hidden) */}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-12 px-6 text-base border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-6 text-base"
            >
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}