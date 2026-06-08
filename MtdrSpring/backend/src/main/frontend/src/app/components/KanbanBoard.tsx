import { useState } from 'react';
import { Circle, Clock3, CheckCircle2, ChevronDown, ChevronUp, Inbox } from 'lucide-react';
import { Task, Status } from '../api/taskDataApi';
import TaskCard from './TaskCard';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  showAssignee?: boolean;
}

type ColumnConfig = {
  status: Status;
  title: string;
  description: string;
  icon: typeof Circle;
  headerBg: string;
  accent: string;
  countBg: string;
  countText: string;
  iconColor: string;
};

const columns: ColumnConfig[] = [
  {
    status: 'todo',
    title: 'To Do',
    description: 'Pending pickup',
    icon: Circle,
    headerBg: 'bg-gradient-to-br from-slate-50 to-slate-100',
    accent: 'before:bg-slate-400',
    countBg: 'bg-slate-200/80',
    countText: 'text-slate-700',
    iconColor: 'text-slate-500',
  },
  {
    status: 'in-progress',
    title: 'In Progress',
    description: 'Active work',
    icon: Clock3,
    headerBg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    accent: 'before:bg-amber-500',
    countBg: 'bg-amber-200/70',
    countText: 'text-amber-800',
    iconColor: 'text-amber-600',
  },
  {
    status: 'done',
    title: 'Done',
    description: 'Completed',
    icon: CheckCircle2,
    headerBg: 'bg-gradient-to-br from-emerald-50 to-green-50',
    accent: 'before:bg-emerald-500',
    countBg: 'bg-emerald-200/70',
    countText: 'text-emerald-800',
    iconColor: 'text-emerald-600',
  },
];

const PAGE_SIZE = 5;

export default function KanbanBoard({ tasks, onTaskClick, showAssignee = false }: KanbanBoardProps) {
  const [visibleCounts, setVisibleCounts] = useState<Record<Status, number>>({
    'todo': PAGE_SIZE,
    'in-progress': PAGE_SIZE,
    'done': PAGE_SIZE,
  });

  const getTasksByStatus = (status: Status) => tasks.filter((task) => task.status === status);

  const handleShowMore = (status: Status) => {
    setVisibleCounts((prev) => ({ ...prev, [status]: prev[status] + PAGE_SIZE }));
  };

  const handleCollapse = (status: Status) => {
    setVisibleCounts((prev) => ({ ...prev, [status]: PAGE_SIZE }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.status);
        const visibleCount = visibleCounts[column.status];
        const visibleTasks = columnTasks.slice(0, visibleCount);
        const hasMore = columnTasks.length > visibleCount;
        const isExpanded = visibleCount > PAGE_SIZE;
        const Icon = column.icon;

        return (
          <div key={column.status} className="flex flex-col min-h-[400px]">
            {/* Column header */}
            <div
              className={`relative mb-4 rounded-xl border border-slate-200/80 shadow-sm overflow-hidden ${column.headerBg} before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 ${column.accent}`}
            >
              <div className="px-5 py-4 pl-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg bg-white/70 ${column.iconColor}`}>
                    <Icon className="w-4 h-4" strokeWidth={2.25} />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-semibold tracking-tight leading-none">{column.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{column.description}</p>
                  </div>
                </div>
                <span
                  className={`min-w-[2rem] text-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${column.countBg} ${column.countText}`}
                >
                  {columnTasks.length}
                </span>
              </div>
            </div>

            {/* Task list */}
            <div className="flex-1 space-y-3 pr-1">
              {visibleTasks.map((task) => (
                <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} showAssignee={showAssignee} />
              ))}

              {columnTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                  <Inbox className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500 font-medium">No tasks yet</p>
                  <p className="text-xs text-slate-400 mt-0.5">This column is empty</p>
                </div>
              )}

              {columnTasks.length > PAGE_SIZE && (
                <div className="pt-1 flex items-center justify-center gap-2">
                  {hasMore && (
                    <button
                      type="button"
                      onClick={() => handleShowMore(column.status)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                      Show {Math.min(PAGE_SIZE, columnTasks.length - visibleCount)} more
                    </button>
                  )}
                  {isExpanded && (
                    <button
                      type="button"
                      onClick={() => handleCollapse(column.status)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 bg-transparent hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                      Collapse
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

