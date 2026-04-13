import { useNavigate } from 'react-router';
import { CheckCircle2, Clock, ListTodo, AlertCircle, Folder } from 'lucide-react';
import Header from '../components/Header';
import StatsCard from '../components/StatsCard';
import KanbanBoard from '../components/KanbanBoard';
import TeamOverview from '../components/TeamOverview';
import TeamPerformanceChart from '../components/TeamPerformanceChart';
import HoursWorkedChart from '../components/HoursWorkedChart';
import { tasks, getStats } from '../data/mockData';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const stats = getStats();

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

      <main className="p-8">
        {/* Stats Section */}
        <div className="grid grid-cols-5 gap-6 mb-8">
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

        {/* Team Productivity Section */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="col-span-3">
            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
              <h3 className="text-slate-900 mb-4">Sprint Progress</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-2xl text-slate-900 mb-1">
                    {Math.round((stats.done / stats.total) * 100)}%
                  </p>
                  <p className="text-sm text-slate-600">Completion Rate</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl text-slate-900 mb-1">
                    {stats.inProgress + stats.done}
                  </p>
                  <p className="text-sm text-slate-600">Active Tasks</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl text-slate-900 mb-1">6</p>
                  <p className="text-sm text-slate-600">Days Remaining</p>
                </div>
              </div>
            </div>
          </div>
          <TeamOverview />
        </div>

        {/* Team Performance Charts */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <TeamPerformanceChart />
          <HoursWorkedChart />
        </div>

        {/* Kanban Board */}
        <KanbanBoard tasks={tasks} onTaskClick={handleTaskClick} />
      </main>
    </div>
  );
}
