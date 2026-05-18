import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Task } from '../data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Filter, Plus, Pencil, Trash2 } from 'lucide-react';
import CreateTaskDialog from './CreateTaskDialog';
import EditTaskDialog from './EditTaskDialog';
import DeleteTaskDialog from './DeleteTaskDialog';

interface TaskListViewProps {
  tasks: Task[];
  showUserFilter?: boolean;
  showActions?: boolean;
  userRole?: 'manager' | 'developer';
  sprints?: Array<{ id: string; name: string }>;
  developers?: Array<{ id: string; name: string }>;
}

export default function TaskListView({ 
  tasks, 
  showUserFilter = true, 
  showActions = false, 
  userRole = 'manager',
  sprints = [],
  developers = []
}: TaskListViewProps) {

export default function TaskListView({ tasks, showUserFilter = true, showActions = false, userRole = 'manager' }: TaskListViewProps) {
  const navigate = useNavigate();
  const [selectedSprint, setSelectedSprint] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const filteredTasks = tasks.filter(task => {
    if (selectedSprint !== 'all' && task.sprintId !== selectedSprint) return false;
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
      'todo': 'bg-slate-100 text-slate-700',
      'in-progress': 'bg-orange-100 text-orange-700',
      'done': 'bg-green-100 text-green-700',
    };
    return styles[status as keyof typeof styles] || styles.todo;
  };

  const handleCreateTask = (taskData: any) => {
    console.log('Create task:', taskData);
    // In a real app, this would call an API to create the task
  };

  const handleEditTask = (taskData: any) => {
    console.log('Edit task:', taskData);
    // In a real app, this would call an API to update the task
  };

  const handleDeleteTask = () => {
    console.log('Delete task:', selectedTask?.id);
    // In a real app, this would call an API to delete the task
  };

  const handleRowClick = (task: Task) => {
    const path = userRole === 'manager' ? `/manager/task/${task.id}` : `/developer/task/${task.id}`;
    navigate(path);
  };

  const handleEditClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setSelectedTask(task);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setSelectedTask(task);
    setDeleteDialogOpen(true);
  };

  return (
    <div>
      {/* Filters and Create Button */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <Filter className="w-5 h-5 text-slate-600" />
            <Select value={selectedSprint} onValueChange={setSelectedSprint}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by sprint" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sprints</SelectItem>
                {sprints.map(sprint => (
                  <SelectItem key={sprint.id} value={sprint.id}>{sprint.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {showUserFilter && (
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {developers.map(dev => (
                    <SelectItem key={dev.id} value={dev.id}>{dev.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

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

          {showActions && (
            <Button
              onClick={() => setCreateDialogOpen(true)}
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
                {showActions && <th className="px-6 py-4 text-right text-sm text-slate-700">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTasks.map(task => (
                <tr
                  key={task.id}
                  onClick={() => handleRowClick(task)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-900">{task.title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700">{task.assignedDeveloper?.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></div>
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
                  {showActions && (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleEditClick(e, task)}
                          className="hover:bg-slate-100"
                        >
                          <Pencil className="w-4 h-4 text-slate-600" />
                        </Button>
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

      {/* Dialogs */}
      <CreateTaskDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSave={handleCreateTask}
      />

      <EditTaskDialog
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleEditTask}
        task={selectedTask}
      />

      <DeleteTaskDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteTask}
        taskTitle={selectedTask?.title || ''}
      />
    </div>
  );
}
