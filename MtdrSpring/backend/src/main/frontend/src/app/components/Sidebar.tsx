import { Link, useLocation, useParams } from 'react-router';
import { X, LayoutDashboard, BarChart3, Users } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'manager' | 'developer';
}

export default function Sidebar({ isOpen, onClose, userRole }: SidebarProps) {
  const location = useLocation();
  const { developerId } = useParams<{ developerId: string }>();

  const managerLinks = [
    { to: '/manager', label: 'Task List', icon: LayoutDashboard },
    { to: '/manager/kanban', label: 'Kanban Board', icon: LayoutDashboard },
    { to: '/manager/kpi', label: 'KPI Charts', icon: BarChart3 },
    { to: '/manager/users', label: 'Users', icon: Users },
  ];

  const developerLinks = [
    { to: `/developer/${developerId}`, label: 'Dashboard', icon: LayoutDashboard },
    { to: `/developer/${developerId}/task-list`, label: 'Task List', icon: LayoutDashboard },
    { to: `/developer/${developerId}/kanban`, label: 'Kanban Board', icon: LayoutDashboard },
    { to: `/developer/${developerId}/kpi`, label: 'KPI Charts', icon: BarChart3 },
  ];

  const links = userRole === 'manager' ? managerLinks : developerLinks;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl text-red-900">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <nav className="space-y-2">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-red-100 text-red-900'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
