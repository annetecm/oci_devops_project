import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Header2 from '../components/Header2';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import {
  fetchDeveloperDashboard,
  fetchDeveloperSummaries,
  buildFrontendTasks,
  getTasksByDeveloper,
  DeveloperSummary,
  BackendTask,
  Task,
} from '../api/taskDataApi';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DeveloperCalendarPage() {
  const { developerId } = useParams<{ developerId: string }>();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [backendTasks, setBackendTasks] = useState<BackendTask[]>([]);
  const [developers, setDevelopers] = useState<DeveloperSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

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

  // Get calendar days and tasks grouped by date
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Create array of calendar days
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    // Group tasks by date
    const tasksByDate: Record<string, Task[]> = {};
    myTasks.forEach(task => {
      const dateStr = task.dueDate.split('T')[0];
      if (!tasksByDate[dateStr]) {
        tasksByDate[dateStr] = [];
      }
      tasksByDate[dateStr].push(task);
    });

    return { days, daysInMonth, tasksByDate };
  }, [currentDate, myTasks]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getTasksForDate = (day: number): Task[] => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    return calendarData.tasksByDate[dateStr] || [];
  };

  const handleTaskClick = (task: Task) => {
    navigate(`/developer/task/${task.id}`, { state: { fromCalendar: true, developerId } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white lg:pl-60">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole="developer" />
        <Header2
          title="Calendar"
          subtitle="View your tasks by date"
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="p-8">
          <div className="text-center text-slate-600">Loading calendar...</div>
        </main>
      </div>
    );
  }

  if (error || !selectedDeveloper) {
    return (
      <div className="min-h-screen bg-white lg:pl-60">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole="developer" />
        <Header2
          title="Calendar"
          subtitle="View your tasks by date"
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="p-8">
          <div className="text-center">
            <h2 className="text-slate-900 mb-2">Error loading calendar</h2>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </main>
      </div>
    );
  }

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-white lg:pl-60">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole="developer" />
      <Header2
        title="Calendar"
        subtitle="View your tasks by date"
        onMenuClick={() => setSidebarOpen(true)}
      />

      <main className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Month header with navigation */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-slate-900">{monthName}</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevMonth}
                className="border-slate-300 hover:bg-slate-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                className="border-slate-300 hover:bg-slate-100"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-0 mb-0">
            {daysOfWeek.map(day => (
              <div key={day} className="text-center font-semibold text-slate-700 text-sm py-3 border-b border-slate-300 bg-white">
                {day.substring(0, 3)}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0 border border-slate-300 bg-white">
            {calendarData.days.map((day, index) => (
              <div
                key={index}
                className="aspect-square border-r border-b border-slate-300 p-2 bg-white hover:bg-slate-50 transition-colors overflow-hidden flex flex-col min-h-24"
              >
                {day !== null ? (
                  <>
                    <div className="text-sm font-semibold text-slate-700 mb-1.5">{day}</div>
                    <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                      {getTasksForDate(day).map(task => (
                        <TaskBox
                          key={task.id}
                          task={task}
                          onClick={() => handleTaskClick(task)}
                          isHovered={hoveredTaskId === task.id}
                          onMouseEnter={() => setHoveredTaskId(task.id)}
                          onMouseLeave={() => setHoveredTaskId(null)}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="bg-slate-50"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

interface TaskBoxProps {
  task: Task;
  onClick: () => void;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function TaskBox({ task, onClick, isHovered, onMouseEnter, onMouseLeave }: TaskBoxProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200';
      case 'medium':
        return 'bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-200';
      case 'low':
        return 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200';
      default:
        return 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200';
    }
  };

  const isDone = task.status === 'done';
  const colorClass = getPriorityColor(task.priority);

  return (
    <div className="relative">
      <div
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`text-xs px-2 py-1 rounded border cursor-pointer transition-all truncate ${colorClass} ${
          isDone ? 'opacity-50' : 'opacity-100'
        }`}
        title={task.title}
      >
        <span className={isDone ? 'line-through' : ''}>
          {task.title}
        </span>
      </div>
      
      {/* Tooltip on hover */}
      {isHovered && (
        <div className="absolute z-50 left-0 top-full mt-1 bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none shadow-lg">
          {task.title}
        </div>
      )}
    </div>
  );
}
