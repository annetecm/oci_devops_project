import { useNavigate } from 'react-router';
import { CheckCircle2, Clock, ListTodo, AlertCircle, Folder } from 'lucide-react';
import Header from '../components/Header';
import StatsCard from '../components/StatsCard';
import KanbanBoard from '../components/KanbanBoard';
import TeamPerformanceChart from '../components/TeamPerformanceChart';
import HoursWorkedChart from '../components/HoursWorkedChart';
import { tasks, developers, sprints, sprintDevStats, getStats } from '../data/mockData';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const stats = getStats();

  // Per-developer averages across all sprints
  const devAvgTasks = developers.map((dev) => {
    const devStats = sprintDevStats.filter((s) => s.devId === dev.id);
    const avg = devStats.length > 0
      ? devStats.reduce((sum, s) => sum + s.completedTasksCount, 0) / devStats.length
      : 0;
    return { name: dev.name, avg: avg.toFixed(1) };
  });
  const overallAvgTasks = (
    devAvgTasks.reduce((sum, d) => sum + parseFloat(d.avg), 0) / devAvgTasks.length
  ).toFixed(1);

  const devAvgHours = developers.map((dev) => {
    const devStats = sprintDevStats.filter((s) => s.devId === dev.id);
    const avg = devStats.length > 0
      ? devStats.reduce((sum, s) => sum + s.hoursWorked, 0) / devStats.length
      : 0;
    return { name: dev.name, avg: avg.toFixed(1) };
  });
  const overallAvgHours = (
    devAvgHours.reduce((sum, d) => sum + parseFloat(d.avg), 0) / devAvgHours.length
  ).toFixed(1);

  const handleTaskClick = (taskId: string) => {
    navigate(`/developer/task/${taskId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title="Manager Dashboard"
        subtitle="Monitor team progress and track project metrics"
        userName="John Anderson"
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
                {Math.round((stats.done / stats.total) * 100)}%
              </p>
              <p className="text-sm text-slate-600">Completion Rate</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xl text-slate-900 mb-1">6</p>
              <p className="text-sm text-slate-600">Days Remaining</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Avg Tasks per Developer */}
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700">Avg Tasks / Sprint</p>
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
            {/* Avg Hours per Developer */}
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700">Avg Hours / Sprint</p>
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
          <TeamPerformanceChart />
          <HoursWorkedChart />
        </div>

        {/* Kanban Board */}
        <KanbanBoard tasks={tasks} onTaskClick={handleTaskClick} />
      </main>
    </div>
  );
}
