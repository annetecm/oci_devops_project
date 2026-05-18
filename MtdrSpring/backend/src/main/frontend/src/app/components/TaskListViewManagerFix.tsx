import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams} from 'react-router';
import {
  BackendTask,
  Task,
  DeveloperSummary,
  buildFrontendTask,
  buildFrontendTasks,
  fetchTasks,
  fetchDeveloperSummaries,
  createTask,
  updateTask,
  deleteTask,
} from '../api/taskDataApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Filter, Plus, Trash2 } from 'lucide-react';
import CreateTaskModal from './CreateTaskModal';
import DeleteTaskDialog from './DeleteTaskDialog';

interface SprintItem {
  id: string;
  name: string;
}

interface TaskListViewProps {
  tasks?: Task[];
  showUserFilter?: boolean;
  showActions?: boolean;
  userRole?: 'manager' | 'developer';
  sprints?: SprintItem[];
  developers?: DeveloperSummary[];
  currentDeveloperId?: string;
  onDataUpdated?: () => void;
}

function toBackendStatus(status: Task['status']): string {
  if (status === 'done') return 'closed';
  if (status === 'in-progress') return 'in_progress';
  return 'open';
}

function toBackendPriority(priority: Task['priority']): string {
  if (priority === 'high') return 'HIGH';
  if (priority === 'low') return 'LOW';
  return 'MEDIUM';
}

function deriveSprints(tasks: Task[]): SprintItem[] {
  const sprintMap = new Map<number, string>();
  tasks.forEach((task) => {
    if (typeof task.sprint === 'number') {
      sprintMap.set(task.sprint, `Sprint ${task.sprint}`);
    }
  });
  return Array.from(sprintMap.entries()).map(([id, name]) => ({ id: String(id), name }));
}

export default function TaskListView({
  tasks,
  showUserFilter,
  showActions,
  userRole = 'manager',
  sprints = [],
  developers = [],
  currentDeveloperId,
  onDataUpdated,
}: TaskListViewProps) {
  // Derive permissions from userRole so callers don't have to pass explicit booleans.
  // Managers: see all tasks + all filters, but cannot create or delete.
  // Developers: actions visible, user filter hidden by default.
  const isManager = userRole === 'manager';
  const resolvedShowUserFilter = showUserFilter ?? true;       // both roles can filter by user
  const resolvedShowActions    = showActions    ?? !isManager; // managers get no action buttons

  const navigate = useNavigate();
  const [tasksState, setTasksState] = useState<Task[]>(tasks ?? []);
  const [developersState, setDevelopersState] = useState<DeveloperSummary[]>(developers ?? []);
  const [sprintsState, setSprintsState] = useState<SprintItem[]>(sprints ?? []);
  const [selectedSprint, setSelectedSprint] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { developerId } = useParams<{ developerId: string }>();
  const [backendTasks, setBackendTasks] = useState<BackendTask[]>([]);

  useEffect(() => {
    setTasksState(tasks ?? []);
  }, [tasks]);

  useEffect(() => {
    setDevelopersState(developers ?? []);
  }, [developers]);

  useEffect(() => {
    if (sprints && sprints.length > 0) {
      setSprintsState(sprints);
    } else {
      setSprintsState(deriveSprints(tasksState));
    }
  }, [sprints, tasksState]);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [backendTasks, backendDevelopers] = await Promise.all([
          fetchTasks(),
          fetchDeveloperSummaries(),
        ]);
        setDevelopersState(backendDevelopers);
        const frontendTasks = buildFrontendTasks(backendTasks, backendDevelopers);
        setTasksState(frontendTasks);
        setSprintsState(deriveSprints(frontendTasks));
      } catch (err) {
        setError('Could not load tasks from database.');
      } finally {
        setIsLoading(false);
      }
    }

    // Always load from backend — both managers and developers need fresh data.
    // If a parent passes `tasks` explicitly it will be synced via the effect above.
    if (!tasks || !developers) {
      loadData();
    }
  }, [tasks, developers, refreshKey]);

  const developerMap = useMemo(
    () => new Map(developersState.map((dev) => [dev.id, dev])),
    [developersState]
  );

  const filteredTasks = tasksState.filter((task) => {
    if (selectedSprint !== 'all' && String(task.sprint) !== selectedSprint) return false;
    if (selectedUser !== 'all' && task.assignedTo !== selectedUser) return false;
    if (selectedStatus !== 'all' && task.status !== selectedStatus) return false;
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      todo: 'bg-slate-100 text-slate-700',
      'in-progress': 'bg-orange-100 text-orange-700',
      done: 'bg-green-100 text-green-700',
    };
    return styles[status as keyof typeof styles] || styles.todo;
  };

  const handleDeleteTask = async () => {
    const taskId = selectedTask?.id;
    if (!taskId) return;
    try {
      await deleteTask(taskId);
      setTasksState((prev) => prev.filter((task) => task.id !== taskId));
      setDeleteDialogOpen(false);
      setSelectedTask(null);
      onDataUpdated?.();
    } catch (err) {
      console.error('Failed to delete task', err);
      setError('Failed to delete task.');
    }
  };

  const handleRowClick = (task: Task) => {
    const path = isManager ? `/manager/task/${task.id}` : `/developer/task/${task.id}`;
    navigate(path);
  };

  const handleDeleteClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setSelectedTask(task);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-[200px] rounded-xl bg-white p-6 shadow-sm border border-slate-200 flex items-center justify-center">
        <span className="text-base text-slate-600">Loading tasks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[200px] rounded-xl bg-white p-6 shadow-sm border border-slate-200 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Filters and Create Button */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-slate-600">
              <Filter className="w-5 h-5" />
              <span className="text-sm">Filters</span>
            </div>

            {/* Sprint filter — visible to everyone */}
            <Select value={selectedSprint} onValueChange={setSelectedSprint}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by sprint" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sprints</SelectItem>
                {sprintsState.map((sprint) => (
                  <SelectItem key={sprint.id} value={sprint.id}>{sprint.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* User filter — visible to managers (and any role when resolvedShowUserFilter is true) */}
            {resolvedShowUserFilter && (
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {developersState.map((dev) => (
                    <SelectItem key={dev.id} value={dev.id}>{dev.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Status filter — visible to everyone */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Create Task button — managers never see this */}
          {resolvedShowActions && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Button>
          )}
        </div>
      </div>

      {/* Task List Table */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-slate-700">Title</th>
                <th className="px-6 py-4 text-left text-sm text-slate-700">Developer</th>
                <th className="px-6 py-4 text-center text-sm text-slate-700">Priority</th>
                <th className="px-6 py-4 text-left text-sm text-slate-700">Due Date</th>
                <th className="px-6 py-4 text-left text-sm text-slate-700">Status</th>
                {/* Actions column header — managers never see this */}
                {resolvedShowActions && (
                  <th className="px-6 py-4 text-right text-sm text-slate-700">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => handleRowClick(task)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-900">{task.title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700">{task.assignedDeveloper?.name || 'Unassigned'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700">{new Date(task.dueDate).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs ${getStatusBadge(task.status)}`}>
                      {task.status.replace('-', ' ')}
                    </span>
                  </td>
                  {/* Delete button — managers never see this */}
                  {resolvedShowActions && (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteClick(e, task)}
                          className="hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {resolvedShowActions && showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => setRefreshKey((k) => k + 1)}
          developers={developers}
          defaultDeveloperId={developerId}
          projectId={backendTasks[0]?.projectID}
        />
      )}

      <DeleteTaskDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteTask}
        taskTitle={selectedTask?.title || ''}
      />
    </div>
  );
}