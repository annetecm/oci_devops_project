import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CreateTaskRequest, DeveloperSummary, createTask } from '../api/taskDataApi';

interface CreateTaskModalProps {
  onClose: () => void;
  onCreated: () => void;
  developers: DeveloperSummary[];
  defaultDeveloperId?: string;
  projectId?: number;
}

export default function CreateTaskModal({
  onClose,
  onCreated,
  developers,
  defaultDeveloperId,
  projectId,
}: CreateTaskModalProps) {
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
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !deadline || !developerID) {
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
        developerID: Number(developerID),
        projectID: projectId ?? 1,
        ...(sprint ? { sprint: Number(sprint) } : {}),
      };
      await createTask(payload);
      onCreated();
      onClose();
    } catch {
      setError('Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-blue-200 [&::-webkit-scrollbar-thumb:hover]:bg-blue-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-slate-900 text-lg font-semibold">Create New Task</h2>
            <p className="text-sm text-slate-500 mt-0.5">Fill in the details for the new task</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="ct-name">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ct-name"
              placeholder="e.g. Fix login button"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="!border-blue-300"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="ct-description">
              Description <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="ct-description"
              rows={3}
              placeholder="Describe the task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex w-full rounded-md border border-blue-300 px-3 py-2 text-sm bg-transparent placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blue-300/50 focus-visible:border-blue-400 resize-none transition-[color,box-shadow]"
            />
          </div>

          {/* Priority + Task Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>
                Priority <span className="text-red-500">*</span>
              </Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="!border-blue-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>
                Task Type <span className="text-red-500">*</span>
              </Label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger className="!border-blue-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new-feature">New Feature</SelectItem>
                  <SelectItem value="bug-fixed">Bug Fix</SelectItem>
                  <SelectItem value="improved-feature">Improvement</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="!border-blue-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Deadline + Estimated Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ct-deadline">
                Deadline <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ct-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="!border-blue-300"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-estimated">
                Estimated Hours <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ct-estimated"
                type="number"
                min="1"
                placeholder="e.g. 8"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                className="!border-blue-300"
              />
            </div>
          </div>

          {/* Assigned Developer */}
          <div className="space-y-1.5">
            <Label>
              Assigned Developer <span className="text-red-500">*</span>
            </Label>
            <Select value={developerID} onValueChange={setDeveloperID}>
              <SelectTrigger className="!border-blue-300">
                <SelectValue placeholder="Select developer" />
              </SelectTrigger>
              <SelectContent>
                {developers.map((dev) => (
                  <SelectItem key={dev.id} value={dev.id}>
                    {dev.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sprint */}
          <div className="space-y-1.5">
            <Label htmlFor="ct-sprint">Sprint</Label>
            <Input
              id="ct-sprint"
              type="number"
              min="0"
              placeholder="e.g. 1"
              value={sprint}
              onChange={(e) => setSprint(e.target.value)}
              className="!border-blue-300"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
