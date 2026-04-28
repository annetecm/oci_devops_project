import { Bell, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useEffect, useState } from 'react';
import { fetchDeveloperSummaries, DeveloperSummary } from '../api/taskDataApi';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  userName?: string;
  userInitials?: string;
  onMenuClick?: () => void;
}

export default function Header({ title, subtitle, userName, userInitials, onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [currentUser, setCurrentUser] = useState<{name: string, initials: string} | null>(null);

  useEffect(() => {
    // If userName and userInitials are provided as props, use them
    if (userName && userInitials) {
      setCurrentUser({ name: userName, initials: userInitials });
      return;
    }

    // Otherwise, use the authenticated user from AuthContext
    if (authUser) {
      const initials = authUser.name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase();
      setCurrentUser({ name: authUser.name, initials });
      return;
    }

    // Fallback to default
    setCurrentUser({ name: 'Manager', initials: 'M' });
  }, [userName, userInitials, authUser]);

  if (!currentUser) {
    return (
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onMenuClick && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-slate-100 text-slate-600"
                >
                  <Menu className="w-6 h-6" />
                </Button>
              )}
              <div>
                <h1 className="text-slate-900 text-2xl font-bold">{title}</h1>
                {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onMenuClick && (
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-slate-100 text-slate-600"
                onClick={onMenuClick}
              >
                <Menu className="w-6 h-6" />
              </Button>
            )}
            <div>
              <h1 className="text-slate-900 text-2xl font-bold">{title}</h1>
              {subtitle && <p className="text-base text-slate-600 mt-1 font-medium">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-slate-100 text-slate-600"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
            </Button>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right">
                <p className="text-base text-slate-900 font-semibold">{currentUser.name}</p>
                <p className="text-sm text-slate-500 font-medium">Online</p>
              </div>
              <Avatar className="w-10 h-10 bg-primary text-white">
                <AvatarFallback className="bg-primary text-white font-semibold text-base">
                  {currentUser.initials}
                </AvatarFallback>
              </Avatar>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-slate-100 text-slate-600"
              onClick={() => navigate('/')}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
