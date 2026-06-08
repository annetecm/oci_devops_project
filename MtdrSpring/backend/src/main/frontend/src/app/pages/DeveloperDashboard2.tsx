import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { ListTodo, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import Header2 from '../components/Header2';
import Sidebar from '../components/Sidebar';
import KPIDashboardCharts from '../components/KPIDashboardCharts';
import {
  BackendTask,
  DeveloperSummary,
  buildFrontendTasks,
  fetchDeveloperDashboard,
  fetchDeveloperSummaries,
  getStats,
  getTasksByDeveloper,
} from '../api/taskDataApi';

export default function DeveloperDashboard2() {
  const { developerId } = useParams<{ developerId: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 lg:pl-60">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole="developer" />
        <Header2
          title="KPI Dashboard"
          subtitle="Monitor your performance metrics and key indicators"
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="p-8">
          <div className="text-center text-slate-600">Loading dashboard data...</div>
        </main>
      </div>
    );
  }

  if (error || !selectedDeveloper) {
    return (
      <div className="min-h-screen bg-slate-50 lg:pl-60">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole="developer" />
        <Header2
          title="KPI Dashboard"
          subtitle="Monitor your performance metrics and key indicators"
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="p-8">
          <div className="text-center text-red-600">{error || 'Developer not found'}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:pl-60">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole="developer" />
      <Header2
        title="KPI Dashboard"
        subtitle="Monitor your performance metrics and key indicators"
        onMenuClick={() => setSidebarOpen(true)}
      />

      <main className="p-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-slate-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">My Progress</h3>
              <p className="text-xs text-slate-500 mt-0.5">Snapshot of your current workload</p>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative rounded-lg border border-slate-200/80 bg-slate-50/60 p-4 overflow-hidden">
              <span className="absolute left-0 top-0 bottom-0 w-1 bg-slate-400" />
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Total Assigned</p>
                <ListTodo className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-3xl text-slate-900 tabular-nums">{stats.total}</p>
            </div>
            <div className="relative rounded-lg border border-red-100 bg-gradient-to-br from-red-50/70 via-white to-white p-4 overflow-hidden">
              <span className="absolute left-0 top-0 bottom-0 w-1 bg-red-700" />
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Completion Rate</p>
                <TrendingUp className="w-4 h-4 text-red-700" />
              </div>
              <p className="text-3xl text-slate-900 tabular-nums">{completionRate}%</p>
            </div>
            <div className="relative rounded-lg border border-amber-100 bg-gradient-to-br from-amber-50/70 via-white to-white p-4 overflow-hidden">
              <span className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">In Progress</p>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-3xl text-slate-900 tabular-nums">{stats.inProgress}</p>
            </div>
            <div className="relative rounded-lg border border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-white to-white p-4 overflow-hidden">
              <span className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Completed</p>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-3xl text-slate-900 tabular-nums">{stats.done}</p>
            </div>
          </div>
        </div>

        <KPIDashboardCharts showTeamOverview={false} developerId={developerId} userRole="developer" />
      </main>
    </div>
  );
}
