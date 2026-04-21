import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { CheckCircle2, Clock, ListTodo, CalendarClock, AlertTriangle } from 'lucide-react';
import Header from '../components/Header';
import StatsCard from '../components/StatsCard';
import KanbanBoard from '../components/KanbanBoard';
import DeveloperSprintHoursChart from '../components/DeveloperSprintHoursChart';
import DeveloperSprintTasksChart from '../components/DeveloperSprintTasksChart';
import {
  BackendTask,
  DeveloperSummary,
  buildFrontendTasks,
  fetchDeveloperDashboard,
  fetchDeveloperSummaries,
  getStats,
  getTasksByDeveloper,
} from '../api/taskDataApi';

export default function DeveloperDashboard() {
  const navigate = useNavigate();
  const { developerId } = useParams<{ developerId: string }>();
  const [backendTasks, setBackendTasks] = useState<BackendTask[]>([]);
  const [developers, setDevelopers] = useState<DeveloperSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!developerId) {
        setError('Developer ID is required');
        setIsLoading(false);
        return;
      }

      try {
        const [dashboardData, developersData] = await Promise.all([
          fetchDeveloperDashboard(developerId),
          fetchDeveloperSummaries()
        ]);

        setBackendTasks(dashboardData.tasks);
        setDevelopers(developersData);
        setError(null);
      } catch (err) {
        setError('Could not load developer dashboard data from database');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [developerId]);

  const tasks = useMemo(() => buildFrontendTasks(backendTasks, developers), [backendTasks, developers]);
  const selectedDeveloper = developers.find(dev => dev.id === developerId);
  const myTasks = useMemo(
    () => (developerId ? getTasksByDeveloper(tasks, developerId) : []),
    [tasks, developerId],
  );
  const stats = useMemo(() => getStats(myTasks), [myTasks]);

  const upcomingDeadlines = myTasks.filter((task) => {
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    return dueDate >= today && dueDate <= threeDaysFromNow && task.status !== 'done';
  }).length;

  const handleTaskClick = (taskId: string) => {
    navigate(`/developer/task/${taskId}`);
  };

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 p-8 text-slate-600">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-slate-50 p-8 text-red-600">{error}</div>;
  }

  if (!selectedDeveloper) {
    return <div className="min-h-screen bg-slate-50 p-8 text-red-600">Developer not found</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title="Developer Dashboard"
        subtitle={`Manage tasks and track progress for ${selectedDeveloper.name}`}
        userName={selectedDeveloper.name}
        userInitials={selectedDeveloper.initials}
      />

      <main className="p-8">
        <div className="grid grid-cols-5 gap-6 mb-8">
          <StatsCard title="My Pending Tasks" value={stats.todo} icon={ListTodo} iconColor="text-slate-600" iconBgColor="bg-slate-100" />
          <StatsCard title="In Progress" value={stats.inProgress} icon={Clock} iconColor="text-orange-600" iconBgColor="bg-orange-100" />
          <StatsCard title="Completed" value={stats.done} icon={CheckCircle2} iconColor="text-green-600" iconBgColor="bg-green-100" />
          <StatsCard title="High Priority" value={stats.highPriority} icon={AlertTriangle} iconColor="text-red-600" iconBgColor="bg-red-100" />
          <StatsCard title="Upcoming Deadlines" value={upcomingDeadlines} icon={CalendarClock} iconColor="text-purple-600" iconBgColor="bg-purple-100" />
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 mb-8">
          <h3 className="text-slate-900 mb-4">My Progress</h3>
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-2xl text-slate-900 mb-1">{stats.total}</p>
              <p className="text-sm text-slate-600">Total Assigned</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl text-slate-900 mb-1">{completionRate}%</p>
              <p className="text-sm text-slate-600">Completion Rate</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl text-slate-900 mb-1">{stats.inProgress}</p>
              <p className="text-sm text-slate-600">Currently Working On</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl text-slate-900 mb-1">{stats.done}</p>
              <p className="text-sm text-slate-600">Tasks Completed</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex gap-6">
            <DeveloperSprintHoursChart
              backendTasks={backendTasks}
              developerId={developerId!}
            />
            <DeveloperSprintTasksChart
              backendTasks={backendTasks}
              developerId={developerId!}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
          <div className="mb-6">
            <h2 className="text-slate-900">My Task Board</h2>
            <p className="text-sm text-slate-600 mt-1">Organize and track your personal workflow</p>
          </div>
          <div className="h-[600px]">
            <KanbanBoard tasks={myTasks} onTaskClick={handleTaskClick} showAssignee={false} />
          </div>
        </div>
      </main>
    </div>
  );
}
