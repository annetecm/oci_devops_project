import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Calendar,
  User,
  Tag,
  Clock,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Task,
  DeveloperSummary,
  buildFrontendTask,
  fetchDeveloperSummaries,
  fetchTaskById,
} from '../api/taskDataApi';
import { useEffect, useState } from 'react';

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

export default function ManagerTaskDetailView() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [developers, setDevelopers] = useState<DeveloperSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const priority = priorityConfig[task.priority as keyof typeof priorityConfig];
  const showRealHours = task.status === 'done';
  const hourDelta = showRealHours && task.realHours !== null ? task.realHours - task.estimatedHours : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="px-8 py-4">
          <Button 
            variant="ghost" 
            className="mb-4 -ml-2 text-slate-600 hover:!bg-slate-100 hover:!text-slate-900" 
            onClick={() => {
              navigate(`/manager/calendar`);
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Calendar
          </Button>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge className={`${statusConfig[task.status].color} border-0`}>{statusConfig[task.status].label}</Badge>
                <Badge className={`${priority.bgColor} ${priority.color} border`}>{priority.label}</Badge>
              </div>
              <h1 className="text-slate-900 text-2xl">{task.title}</h1>
              <p className="text-slate-500 text-sm mt-1">Assigned to: <span className="font-semibold text-slate-700">{task.assignedDeveloper?.name || 'Unassigned'}</span></p>
              <p className="text-slate-600 mt-2">{task.description}</p>
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
                    <p className="text-sm text-slate-900">{task.assignedDeveloper?.name || 'Unassigned'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center"><Calendar className="w-5 h-5 text-orange-600" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-600">Due Date</p>
                    <p className="text-sm text-slate-900">{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
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
                  <p className="text-2xl text-slate-900">{task.estimatedHours}h</p>
                </div>
                {showRealHours && (
                  <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
                    <p className="text-xs text-slate-600 mb-1">Real</p>
                    <p className="text-2xl text-slate-900">{task.realHours !== null ? `${task.realHours}h` : 'Not logged'}</p>
                  </div>
                )}
              </div>
              {showRealHours && (
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

            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
              <div className="flex items-center gap-2 mb-4"><h3 className="text-slate-900">Priority</h3></div>
              <div className={`p-4 rounded-lg ${priority.bgColor}`}>
                <p className={`text-sm ${priority.color}`}>{priority.label}</p>
                <p className="text-xs text-slate-600 mt-2">
                  {task.priority === 'high' && 'This task requires immediate attention and should be prioritized.'}
                  {task.priority === 'medium' && 'This task should be completed in a timely manner.'}
                  {task.priority === 'low' && 'This task can be completed when time permits.'}
                </p>
              </div>
            </div>
          </div>
        </div>
        {error && <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}
      </main>
    </div>
  );
}
