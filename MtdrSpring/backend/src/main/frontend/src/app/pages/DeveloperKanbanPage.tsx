import { useState, useEffect } from 'react';
import Header2 from '../components/Header2';
import Sidebar from '../components/Sidebar';
import { useNavigate, useParams } from 'react-router';
import KanbanBoard from '../components/KanbanBoard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Filter } from 'lucide-react';
import {
  BackendTask,
  DeveloperSummary,
  buildFrontendTasks,
  fetchDeveloperSummaries,
  fetchDeveloperDashboard,
  Task,
} from '../api/taskDataApi';

export default function DeveloperKanbanPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { developerId } = useParams<{ developerId: string }>();
  const [selectedSprint, setSelectedSprint] = useState<string>('all');
  const navigate = useNavigate();
  const [backendTasks, setBackendTasks] = useState<BackendTask[]>([]);
  const [frontendTasks, setFrontendTasks] = useState<Task[]>([]);
  const [developers, setDevelopers] = useState<DeveloperSummary[]>([]);
  const [selectedDeveloper, setSelectedDeveloper] = useState<DeveloperSummary | null>(null);
  const [sprints, setSprints] = useState<Array<{ id: string; name: string }>>([]);
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
          fetchDeveloperSummaries(),
        ]);
        setBackendTasks(dashboardData.tasks);
        setDevelopers(developersData);
        const selectedDev = developersData.find(d => d.id === developerId);
        setSelectedDeveloper(selectedDev || null);
        setFrontendTasks(buildFrontendTasks(dashboardData.tasks, developersData));

        // Extract unique sprints from tasks
        const uniqueSprints = new Map<number, string>();
        dashboardData.tasks.forEach(task => {
          if (task.sprint) {
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
        setError('Could not load dashboard data from database');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [developerId]);

  const filteredTasks = frontendTasks.filter(task => {
    if (selectedSprint !== 'all' && task.sprint !== Number(selectedSprint)) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole="developer" />
        <Header2
          title="My Tasks - Kanban Board"
          subtitle="Visualize your workflow and progress"
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="p-8">
          <div className="text-center text-slate-600">Loading...</div>
        </main>
      </div>
    );
  }

  if (error || !selectedDeveloper) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole="developer" />
        <Header2
          title="My Tasks - Kanban Board"
          subtitle="Visualize your workflow and progress"
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
        title="My Tasks - Kanban Board"
        subtitle="Visualize your workflow and progress"
        onMenuClick={() => setSidebarOpen(true)}
      />

      <main className="p-8">
        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6">
          <div className="flex items-center gap-4 overflow-x-auto">
            <Filter className="w-5 h-5 text-slate-600" />
            <div className="flex-1 flex items-center gap-4">
              {sprints.length > 0 && (
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
              )}
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 min-h-[calc(100vh-300px)]">
          <KanbanBoard
            tasks={filteredTasks}
            onTaskClick={(taskId) => window.location.href = `/developer/task/${taskId}`}
            showAssignee={false}
          />
        </div>
      </main>
    </div>
  );
}
