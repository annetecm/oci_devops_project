import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams} from 'react-router';
import {
  BackendTask,
  Task,
  DeveloperSummary,
  buildFrontendTask,
  buildFrontendTasks,
  fetchTasks,
  fetchDeveloperDashboard,
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
  showUserFilter = true,
  showActions = false,
  userRole = 'manager',
  sprints = [],
  developers = [],
  currentDeveloperId,
  onDataUpdated,
}: TaskListViewProps) {
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
        // Use the same dashboard fetch as DeveloperDashboard for consistency
        const [dashboardData, backendDevelopers] = await Promise.all([
          fetchDeveloperDashboard(developerId),
          fetchDeveloperSummaries(),
        ]);
        setBackendTasks(dashboardData.tasks);
        setDevelopersState(backendDevelopers);
        const frontendTasks = buildFrontendTasks(dashboardData.tasks, backendDevelopers);
        setTasksState(frontendTasks);
        setSprintsState(deriveSprints(frontendTasks));
      } catch (err) {
        setError('Could not load tasks from database.');
      } finally {
        setIsLoading(false);
      }
    }

    if (developerId) {
      loadData();
    }
  }, [developerId, refreshKey]);

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
      case 'high': return 'bg-rose-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-emerald-500';
      default: return 'bg-slate-400';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return priority;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      todo: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200',
      'in-progress': 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200',
      done: 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200',
    };
    return styles[status as keyof typeof styles] || styles.todo;
  };

  const getStatusLabel = (status: string) => {
    if (status === 'in-progress') return 'In Progress';
    if (status === 'todo') return 'To Do';
    if (status === 'done') return 'Done';
    return status;
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
    const path = userRole === 'manager' ? `/manager/task/${task.id}` : `/developer/task/${task.id}`;
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
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 mb-6">
        <div className="flex items-center gap-4 justify-between flex-wrap">
          <div className="flex items-center gap-3 overflow-x-auto flex-1">
            <div className="flex items-center gap-2 pr-3 mr-1 border-r border-slate-200 text-slate-700">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Filter className="w-4 h-4 text-slate-600" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Filters</span>
            </div>
            <Select value={selectedSprint} onValueChange={setSelectedSprint}>
              <SelectTrigger className="w-44 bg-slate-50 border-slate-200 hover:bg-white transition-colors">
                <SelectValue placeholder="Filter by sprint" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sprints</SelectItem>
                {sprintsState.map((sprint) => (
                  <SelectItem key={sprint.id} value={sprint.id}>{sprint.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {showUserFilter && (
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-44 bg-slate-50 border-slate-200 hover:bg-white transition-colors">
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

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-44 bg-slate-50 border-slate-200 hover:bg-white transition-colors">
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

          {showActions && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-red-800 hover:bg-red-900 text-white shadow-sm hover:shadow-md transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Button>
          )}
        </div>
      </div>

      {/* Task List Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Task list</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} shown
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/60 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Title</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Developer</th>
                <th className="px-6 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">Priority</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Due Date</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                {showActions && <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.map((task) => {
                const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'done';
                return (
                <tr
                  key={task.id}
                  onClick={() => handleRowClick(task)}
                  className="group hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900 group-hover:text-slate-950">{task.title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white text-[11px] font-semibold flex items-center justify-center shadow-sm">
                        {(task.assignedDeveloper?.initials || (task.assignedDeveloper?.name?.split(' ').map(w => w[0]).join('') ?? '?')).slice(0,2).toUpperCase()}
                      </div>
                      <p className="text-sm text-slate-700">{task.assignedDeveloper?.name || 'Unassigned'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                        <span className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                        {getPriorityLabel(task.priority)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className={`text-sm ${isOverdue ? 'text-rose-600 font-medium' : 'text-slate-700'}`}>
                      {new Date(task.dueDate).toLocaleDateString()}
                      {isOverdue && <span className="ml-1.5 text-[11px] font-semibold uppercase tracking-wide">Overdue</span>}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(task.status)}`}>
                      {getStatusLabel(task.status)}
                    </span>
                  </td>
                  {showActions && (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteClick(e, task)}
                          className="hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4 text-rose-600" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
                );
              })}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={showActions ? 6 : 5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-1">
                        <Filter className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-700">No tasks match your filters</p>
                      <p className="text-xs text-slate-500">Try adjusting the filters above</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

        {showCreateModal && (
          <CreateTaskModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => setRefreshKey((k) => k + 1)}
            developers={developersState}
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