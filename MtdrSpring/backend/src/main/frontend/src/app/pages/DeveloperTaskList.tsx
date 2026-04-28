import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import Header2 from '../components/Header2';
import Sidebar from '../components/Sidebar';
import TaskListView from '../components/TaskListViewDeveloper';
import {
  fetchDeveloperDashboard,
  fetchDeveloperSummaries,
  buildFrontendTasks,
  getTasksByDeveloper,
  DeveloperSummary,
  BackendTask,
  Task,
} from '../api/taskDataApi';

export default function DeveloperTaskList() {
  const { developerId } = useParams<{ developerId: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [backendTasks, setBackendTasks] = useState<BackendTask[]>([]);
  const [developers, setDevelopers] = useState<DeveloperSummary[]>([]);
  const [sprints, setSprints] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!developerId) {
      setError('Developer ID is required');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [dashboardData, developersData] = await Promise.all([
        fetchDeveloperDashboard(developerId),
        fetchDeveloperSummaries(),
      ]);

      setBackendTasks(dashboardData.tasks);
      setDevelopers(developersData);

      const uniqueSprints = new Map<number, string>();
      dashboardData.tasks.forEach((task) => {
        if (task.sprint !== undefined && task.sprint !== null) {
          uniqueSprints.set(task.sprint, `Sprint ${task.sprint}`);
        }
      });

      const sprintsList = Array.from(uniqueSprints.entries()).map(([id, name]) => ({
        id: String(id),
        name,
      }));
      setSprints(sprintsList);
      setError(null);
    } catch (err) {
      setError('Could not load tasks from database');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [developerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const frontendTasks = useMemo(
    () => buildFrontendTasks(backendTasks, developers),
    [backendTasks, developers]
  );
  const myTasks = useMemo(
    () => (developerId ? getTasksByDeveloper(frontendTasks, developerId) : []),
    [frontendTasks, developerId]
  );
  const selectedDeveloper = developers.find(dev => dev.id === developerId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole="developer" />
        <Header2
          title="My Tasks"
          subtitle="Manage your assigned tasks"
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="p-8">
          <div className="text-center text-slate-600">Loading tasks...</div>
        </main>
      </div>
    );
  }

  if (error || !selectedDeveloper) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole="developer" />
        <Header2
          title="My Tasks"
          subtitle="Manage your assigned tasks"
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
        title="My Tasks"
        subtitle="Manage your assigned tasks"
        onMenuClick={() => setSidebarOpen(true)}
      />

      <main className="p-8">
        <TaskListView
          tasks={myTasks}
          showUserFilter={false}
          showActions={true}
          userRole="developer"
          sprints={sprints}
          developers={developers}
        />
      </main>
    </div>
  );
}
