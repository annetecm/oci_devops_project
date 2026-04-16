import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle2, Clock, ListTodo, AlertCircle, Folder } from 'lucide-react';
import Header from '../components/Header';
import StatsCard from '../components/StatsCard';
import KanbanBoard from '../components/KanbanBoard';
import TeamPerformanceChart from '../components/TeamPerformanceChart';
import HoursWorkedChart from '../components/HoursWorkedChart';
import {
  BackendTask,
  DeveloperSummary,
  buildDeveloperMetricsFromBackend,
  buildFrontendTasks,
  fetchDeveloperSummaries,
  fetchTasks,
  getStats,
} from '../api/taskDataApi';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [backendTasks, setBackendTasks] = useState<BackendTask[]>([]);
  const [developers, setDevelopers] = useState<DeveloperSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [tasksData, developersData] = await Promise.all([fetchTasks(), fetchDeveloperSummaries()]);
        setBackendTasks(tasksData);
        setDevelopers(developersData);
        setError(null);
      } catch {
        setError('Could not load dashboard data from database');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const tasks = useMemo(() => buildFrontendTasks(backendTasks, developers), [backendTasks, developers]);
  const devMetrics = useMemo(
    () => buildDeveloperMetricsFromBackend(backendTasks, developers),
    [backendTasks, developers],
  );
  const stats = useMemo(() => getStats(tasks), [tasks]);

  const devAvgTasks = devMetrics.map((dev) => {
    return { name: dev.name, avg: String(dev.completedTasksCount) };
  });
  const overallAvgTasks = devAvgTasks.length > 0
    ? (devAvgTasks.reduce((sum, d) => sum + parseFloat(d.avg), 0) / devAvgTasks.length).toFixed(1)
    : '0.0';

  const devAvgHours = devMetrics.map((dev) => {
    return { name: dev.name, avg: dev.hoursWorked.toFixed(1) };
  });
  const overallAvgHours = devAvgHours.length > 0
    ? (devAvgHours.reduce((sum, d) => sum + parseFloat(d.avg), 0) / devAvgHours.length).toFixed(1)
    : '0.0';

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const daysRemaining = (() => {
    const pendingDueDates = tasks
      .filter((task) => task.status !== 'done')
      .map((task) => {
        const diffMs = new Date(task.dueDate).getTime() - Date.now();
        return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      });
    if (pendingDueDates.length === 0) {
      return 0;
    }
    return Math.min(...pendingDueDates);
  })();

  const handleTaskClick = (taskId: string) => {
    navigate(`/developer/task/${taskId}`);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 p-8 text-slate-600">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-slate-50 p-8 text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title="Manager Dashboard"
        subtitle="Monitor team progress and track project metrics"
        userName="Monserrat Morales"
        userInitials="JA"
      />

      <main className="p-6">
        {/* Stats Section */}
        <div className="grid grid-cols-5 gap-4 mb-5">
          <StatsCard
            title="Total Tasks"
            value={stats.total}
            icon={Folder}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <StatsCard
            title="Pending"
            value={stats.todo}
            icon={ListTodo}
            iconColor="text-slate-600"
            iconBgColor="bg-slate-100"
          />
          <StatsCard
            title="In Progress"
            value={stats.inProgress}
            icon={Clock}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
          />
          <StatsCard
            title="Completed"
            value={stats.done}
            icon={CheckCircle2}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <StatsCard
            title="High Priority"
            value={stats.highPriority}
            icon={AlertCircle}
            iconColor="text-red-600"
            iconBgColor="bg-red-100"
          />
        </div>

        {/* Sprint Progress + Team Overview */}
        <div className="bg-white rounded-xl p-4 shadow-md border border-slate-200 mb-5">
          <h3 className="text-slate-900 mb-3">Sprint Progress</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-xl text-slate-900 mb-1">
                {completionRate}%
              </p>
              <p className="text-sm text-slate-600">Completion Rate</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xl text-slate-900 mb-1">{daysRemaining}</p>
              <p className="text-sm text-slate-600">Days Remaining</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Completed Tasks per Developer */}
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700">Completed Tasks / Developer</p>
                <span className="text-xs text-slate-500">Team avg: {overallAvgTasks}</span>
              </div>
              <div className="space-y-1.5">
                {devAvgTasks.map((dev) => (
                  <div key={dev.name} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{dev.name}</span>
                    <span className="text-sm text-slate-900">{dev.avg} tasks</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Logged Hours per Developer */}
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700">Hours Logged / Developer</p>
                <span className="text-xs text-slate-500">Team avg: {overallAvgHours}h</span>
              </div>
              <div className="space-y-1.5">
                {devAvgHours.map((dev) => (
                  <div key={dev.name} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{dev.name}</span>
                    <span className="text-sm text-slate-900">{dev.avg}h</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Team Performance Charts */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <TeamPerformanceChart
            data={devMetrics.map((dev) => ({
              name: dev.name,
              assigned: dev.assignedTasksCount,
              completed: dev.completedTasksCount,
            }))}
          />
          <HoursWorkedChart
            data={devMetrics.map((dev) => ({
              name: dev.name,
              hoursWorked: dev.hoursWorked,
            }))}
          />
        </div>

        {/* Kanban Board */}
        <KanbanBoard tasks={tasks} onTaskClick={handleTaskClick} />
      </main>
    </div>
  );
}
