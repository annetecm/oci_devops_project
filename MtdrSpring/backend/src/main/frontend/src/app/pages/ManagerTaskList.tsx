import { useCallback, useEffect, useMemo, useState } from 'react';
import Header2 from '../components/Header2';
import Sidebar from '../components/Sidebar';
import TaskListView from '../components/TaskListViewManagerFix';
import {
  fetchTasks,
  fetchDeveloperSummaries,
  buildFrontendTasks,
  DeveloperSummary,
  BackendTask,
  Task,
} from '../api/taskDataApi';

export default function ManagerTaskList() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [backendTasks, setBackendTasks] = useState<BackendTask[]>([]);
  const [developers, setDevelopers] = useState<DeveloperSummary[]>([]);
  const [sprints, setSprints] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [tasksData, developersData] = await Promise.all([
        fetchTasks(),
        fetchDeveloperSummaries(),
      ]);

      setBackendTasks(tasksData);
      setDevelopers(developersData);

      const uniqueSprints = new Map<number, string>();
      tasksData.forEach((task) => {
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
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const frontendTasks = useMemo(
    () => buildFrontendTasks(backendTasks, developers),
    [backendTasks, developers]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 lg:pl-60">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole="manager" />
        <Header2
          title="Task Management"
          subtitle="View and manage all team tasks"
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="p-8">
          <div className="text-center text-slate-600">Loading tasks...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 lg:pl-60">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole="manager" />
        <Header2
          title="Task Management"
          subtitle="View and manage all team tasks"
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="p-8">
          <div className="text-center text-red-600">{error}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:pl-60">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole="manager" />
      <Header2
        title="Task Management"
        subtitle="View and manage all team tasks"
        onMenuClick={() => setSidebarOpen(true)}
      />

      <main className="p-8">
        <TaskListView
          tasks={frontendTasks}
          developers={developers}
          sprints={sprints}
          showUserFilter={true}
          userRole="manager"
          showActions={false}
        />
      </main>
    </div>
  );
}
