import { Link, useLocation, useParams } from 'react-router';
import {
  X,
  LayoutDashboard,
  BarChart3,
  KanbanSquare,
  ListTodo,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'manager' | 'developer';
}

export default function Sidebar({ isOpen, onClose, userRole }: SidebarProps) {
  const location = useLocation();
  const { developerId } = useParams<{ developerId: string }>();

  const managerLinks = [
    { to: '/manager', label: 'Task List', icon: ListTodo },
    { to: '/manager/kanban', label: 'Kanban Board', icon: KanbanSquare },
    { to: '/manager/kpi', label: 'KPI Charts', icon: BarChart3 },
  ];

  const developerLinks = [
    { to: `/developer/${developerId}`, label: 'Dashboard', icon: LayoutDashboard },
    { to: `/developer/${developerId}/kanban`, label: 'Kanban Board', icon: KanbanSquare },
    { to: `/developer/${developerId}/kpi`, label: 'KPI Charts', icon: BarChart3 },
  ];

  const links = userRole === 'manager' ? managerLinks : developerLinks;
  const roleLabel = userRole === 'manager' ? 'Manager Workspace' : 'Developer Workspace';

  return (
    <>
      {/* Overlay (mobile only) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-white shadow-2xl lg:shadow-none z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-r border-slate-200/80 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / header */}
        <div className="h-[76px] px-5 flex items-center border-b border-slate-200/80">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 leading-none tracking-tight">Synkra</h2>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mt-1.5 truncate">
                  {roleLabel}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 -mr-1 hover:bg-slate-100 rounded-md transition-colors lg:hidden"
              aria-label="Close menu"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto">
          <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Navigation
          </p>
          <ul className="space-y-0.5">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;

              return (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    onClick={onClose}
                    className={`relative flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors duration-150 group ${
                      isActive
                        ? 'bg-red-50 text-red-900 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-red-700"></span>
                    )}
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-red-700' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span className="text-sm truncate">{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200/80">
          <p className="text-[10px] text-slate-400 font-medium tracking-wide">
            v1.0 · Team 21 · OCI DevOps
          </p>
        </div>
      </aside>
    </>
  );
}
