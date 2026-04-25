import { useParams, useNavigate, useLocation } from 'react-router';
import {
  ArrowLeft,
  Calendar,
  User,
  Tag,
  CheckCircle,
  Clock,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Priority,
  Status,
  Task,
  UpdateTaskRequest,
  DeveloperSummary,
  buildFrontendTask,
  fetchDeveloperSummaries,
  fetchTaskById,
  updateTask,
  deleteTask,
} from '../api/taskDataApi';
import { useEffect, useState } from 'react';
const dataTestId: string = "TaskDetailView";


const priorityConfig = {
  high: { color: 'text-red-700', bgColor: 'bg-red-100 border-red-200', label: 'High Priority' },
  medium: { color: 'text-orange-700', bgColor: 'bg-orange-100 border-orange-200', label: 'Medium Priority' },
  low: { color: 'text-blue-700', bgColor: 'bg-blue-100 border-blue-200', label: 'Low Priority' },
};

const statusConfig = {
  'todo': { label: 'To Do', color: 'bg-slate-100 text-slate-700' },
  'in-progress': { label: 'In Progress', color: 'bg-orange-100 text-orange-700' },
  'done': { label: 'Done', color: 'bg-green-100 text-green-700' },
};

function toBackendStatus(status: Status): string {
  if (status === 'done') return 'closed';
  if (status === 'in-progress') return 'in_progress';
  return 'open';
}

export default function TaskDetailView() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isReadOnly = (location.state as { role?: string } | null)?.role === 'manager';
  const [task, setTask] = useState<Task | null>(null);
  const [developers, setDevelopers] = useState<DeveloperSummary[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<Status>('todo');
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editEstimatedHours, setEditEstimatedHours] = useState('');
  const [editRealHours, setEditRealHours] = useState('');
  const [editAssignedDeveloper, setEditAssignedDeveloper] = useState('');

  useEffect(() => {
    async function loadTask() {
      if (!taskId) {
        setError('Task ID was not provided');
        setIsLoading(false);
        return;
      }
      try {
        const [taskData, developersData] = await Promise.all([fetchTaskById(taskId), fetchDeveloperSummaries()]);
        setDevelopers(developersData);
        const mappedTask = buildFrontendTask(taskData, developersData);
        setTask(mappedTask);
        setError(null);
      } catch {
        setError('Could not load task from database');
      } finally {
        setIsLoading(false);
      }
    }
    loadTask();
  }, [taskId]);

  const handleEditStart = () => {
    if (!task) return;
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditStatus(task.status);
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate.split('T')[0]);
    setEditEstimatedHours(String(task.estimatedHours));
    setEditRealHours(task.realHours !== null ? String(task.realHours) : '');
    setEditAssignedDeveloper(task.assignedDeveloper?.id ?? '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleDelete = async () => {
    if (!taskId) return;
    try {
      setIsDeleting(true);
      await deleteTask(taskId);
      navigate(-1);
    } catch {
      setError('Could not delete task. Please try again.');
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!taskId || !task) return;
    if (!editTitle.trim() || !editDueDate) {
      setError('Title and due date are required.');
      return;
    }
    try {
      setIsSaving(true);
      const payload: UpdateTaskRequest = {
        name: editTitle.trim(),
        description: editDescription.trim(),
        status: toBackendStatus(editStatus),
        priority: editPriority.toUpperCase(),
        deadline: `${editDueDate}T23:59:59`,
        estimatedTime: Math.max(1, Number(editEstimatedHours) || 1),
        ...(editRealHours !== '' ? { timeSpent: Number(editRealHours) } : {}),
        ...(editAssignedDeveloper !== '' ? { developerID: Number(editAssignedDeveloper) } : {}),
      };
      const updated = await updateTask(taskId, payload);
      const mappedTask = buildFrontendTask(updated, developers);
      setTask(mappedTask);
      setIsEditing(false);
      setError(null);
    } catch {
      setError('Could not update task. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-slate-600">Loading task...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-slate-900 mb-2">Task not found</h2>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const displayStatus = isEditing ? editStatus : task.status;
  const displayPriority = isEditing ? editPriority : task.priority;
  const priority = priorityConfig[displayPriority as keyof typeof priorityConfig];
  const showRealHours = displayStatus === 'done';
  const hourDelta = !isEditing && showRealHours && task.realHours !== null ? task.realHours - task.estimatedHours : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="px-8 py-4">
          <Button variant="ghost" className="mb-4 -ml-2 text-slate-600 hover:text-slate-900" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge className={`${statusConfig[displayStatus].color} border-0`}>{statusConfig[displayStatus].label}</Badge>
                <Badge className={`${priority.bgColor} ${priority.color} border`}>{priority.label}</Badge>
              </div>
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-2xl h-auto py-1 font-semibold !border-blue-300 mb-2"
                  placeholder="Task title"
                />
              ) : (
                <h1 className="text-slate-900 text-2xl" data-testid={`${dataTestId}-Title`}>
                  {task.title}
                </h1>
              )}
              {isEditing ? (
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="mt-2 flex w-full rounded-md border border-blue-300 px-3 py-2 text-sm bg-transparent text-slate-600 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blue-300/50 focus-visible:border-blue-400 resize-none transition-[color,box-shadow]"
                  placeholder="Task description"
                />
              ) : (
                <p className="text-slate-600 mt-2">{task.description}</p>
              )}
            </div>
            <div className="flex gap-3 ml-6 items-start">
              {!isReadOnly && (
                <>
                  {isEditing && (
                    <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSaving}>
                      Cancel
                    </Button>
                  )}
                  {!isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Task
                    </Button>
                  )}
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={isEditing ? handleSave : handleEditStart}
                    disabled={isSaving}
                    data-testid={`${dataTestId}-Edit-SaveButton`}
                  >
                    {isEditing ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </>
                    ) : (
                      <>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Task
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="p-8">
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
              <h3 className="text-slate-900 mb-4">Task Details</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0"><User className="w-5 h-5 text-blue-600" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-600">Assigned To</p>
                    {isEditing ? (
                      <Select value={editAssignedDeveloper} onValueChange={setEditAssignedDeveloper}>
                        <SelectTrigger className="!border-blue-300 mt-1 h-8 text-sm">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          {developers.map((dev) => (
                            <SelectItem key={dev.id} value={dev.id}>{dev.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-slate-900">{task.assignedDeveloper?.name || 'Unassigned'}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center"><Calendar className="w-5 h-5 text-orange-600" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-600">Due Date</p>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="!border-blue-300 mt-1 h-8 text-sm"
                      />
                    ) : (
                      <p className="text-sm text-slate-900">{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><Clock className="w-5 h-5 text-green-600" /></div>
                  <div>
                    <p className="text-xs text-slate-600">Created</p>
                    <p className="text-sm text-slate-900">{new Date(task.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><Clock className="w-5 h-5 text-purple-600" /></div>
                  <div>
                    <p className="text-xs text-slate-600">Last Updated</p>
                    <p className="text-sm text-slate-900">{new Date(task.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-900">Time of completion</h3>
              </div>
              <div className={`grid gap-4 ${showRealHours ? 'grid-cols-2' : 'grid-cols-1 max-w-xs'}`}>
                <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                  <p className="text-xs text-slate-600 mb-1">Estimated</p>
                  {isEditing ? (
                    <Input
                      type="number"
                      min="1"
                      value={editEstimatedHours}
                      onChange={(e) => setEditEstimatedHours(e.target.value)}
                      className="!border-blue-300 h-8 text-sm w-24"
                    />
                  ) : (
                    <p className="text-2xl text-slate-900">{task.estimatedHours}h</p>
                  )}
                </div>
                {showRealHours && (
                  <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
                    <p className="text-xs text-slate-600 mb-1">Real</p>
                    {isEditing ? (
                      <Input
                        type="number"
                        min="0"
                        value={editRealHours}
                        onChange={(e) => setEditRealHours(e.target.value)}
                        className="!border-blue-300 h-8 text-sm w-24"
                        placeholder="0"
                      />
                    ) : (
                      <p className="text-2xl text-slate-900">{task.realHours !== null ? `${task.realHours}h` : 'Not logged'}</p>
                    )}
                  </div>
                )}
              </div>
              {!isEditing && showRealHours && (
                <div className="mt-4 text-sm">
                  {hourDelta === null && <p className="text-slate-600">Real hours are not logged yet.</p>}
                  {hourDelta !== null && hourDelta <= 0 && (
                    <p className="text-green-700">Completed within estimate ({Math.abs(hourDelta)}h saved).</p>
                  )}
                  {hourDelta !== null && hourDelta > 0 && (
                    <p className="text-orange-700">Completed over estimate by {hourDelta}h.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
              <div className="flex items-center gap-2 mb-4"><Tag className="w-5 h-5 text-slate-600" /><h3 className="text-slate-900">Tags</h3></div>
              <div className="flex flex-wrap gap-2">{task.tags.map((tag) => <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-700 border-0">{tag}</Badge>)}</div>
            </div>

            {isEditing && (
              <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
                <h3 className="text-slate-900 mb-4">Status</h3>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as Status)}>
                  <SelectTrigger className="!border-blue-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
              <div className="flex items-center gap-2 mb-4"><h3 className="text-slate-900">Priority</h3></div>
              {isEditing ? (
                <Select value={editPriority} onValueChange={(v) => setEditPriority(v as Priority)}>
                  <SelectTrigger className="!border-blue-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className={`p-4 rounded-lg ${priority.bgColor}`}>
                  <p className={`text-sm ${priority.color}`}>{priority.label}</p>
                  <p className="text-xs text-slate-600 mt-2">
                    {task.priority === 'high' && 'This task requires immediate attention and should be prioritized.'}
                    {task.priority === 'medium' && 'This task should be completed in a timely manner.'}
                    {task.priority === 'low' && 'This task can be completed when time permits.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        {error && <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}
      </main>

      {/* Delete confirmation dialog */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => !isDeleting && setIsDeleteDialogOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-md mx-4">
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-slate-900 text-lg font-semibold">Delete Task</h2>
                  <p className="text-sm text-slate-500">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-4">
                Are you sure you want to delete <span className="font-medium text-slate-900">&ldquo;{task.title}&rdquo;</span>? This will permanently remove the task and all associated data.
              </p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete Task'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
