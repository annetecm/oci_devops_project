import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
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
      <div className="min-h-screen bg-slate-50">
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
      <div className="min-h-screen bg-slate-50">
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
    <div className="min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole="developer" />
      <Header2
        title="KPI Dashboard"
        subtitle="Monitor your performance metrics and key indicators"
        onMenuClick={() => setSidebarOpen(true)}
      />

      <main className="p-8">
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

        <KPIDashboardCharts showTeamOverview={false} developerId={developerId} userRole="developer" />
      </main>
    </div>
  );
}
