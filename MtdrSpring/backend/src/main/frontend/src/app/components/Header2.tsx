import { LogOut, Menu } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
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
  const { user: authUser, signOut } = useAuth();
  const { developerId, managerId } = useParams<{ developerId?: string; managerId?: string }>();
  const [currentUser, setCurrentUser] = useState<{name: string, initials: string, role: string} | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolveUser() {
      const storedAuthUser = typeof window !== 'undefined'
        ? (() => {
            try {
              const raw = sessionStorage.getItem('synkra_auth');
              return raw ? JSON.parse(raw) : null;
            } catch {
              return null;
            }
          })()
        : null;

      const effectiveAuth = authUser || storedAuthUser;

      // If userName and userInitials are provided as props, prefer them
      if (userName && userInitials) {
        if (cancelled) return;
        setCurrentUser({ name: userName, initials: userInitials, role: effectiveAuth?.role || 'User' });
        return;
      }

      // If there's a developerId in the route, try to fetch developer summaries and find the matching developer
      if (developerId) {
        try {
          const devs = await fetchDeveloperSummaries();
          const sel = devs.find(d => d.id === developerId);
          if (sel && !cancelled) {
            const initials = sel.initials || sel.name.split(' ').map(w => w[0]).join('').toUpperCase();
            setCurrentUser({ name: sel.name, initials, role: 'Developer' });
            return;
          }
        } catch (e) {
          // ignore and fallback to auth user below
          console.debug('Header2: could not fetch developer summaries', e);
        }
      }

      if (managerId) {
        try {
          const devs = await fetchDeveloperSummaries();
          const sel = devs.find(d => d.id === managerId);
          if (sel && !cancelled) {
            const initials = sel.initials || sel.name.split(' ').map(w => w[0]).join('').toUpperCase();
            setCurrentUser({ name: sel.name, initials, role: 'Manager' });
            return;
          }
        } catch (e) {
          console.debug('Header2: could not fetch developer summaries', e);
        }
      }

      if (effectiveAuth?.role === 'manager') {
        if (cancelled) return;
        const initials = effectiveAuth.name
          .split(' ')
          .map((word: string) => word[0])
          .join('')
          .toUpperCase();
        setCurrentUser({ name: effectiveAuth.name, initials, role: 'Manager' });
        return;
      }

      // Otherwise, use the authenticated user from AuthContext or fallback storage
      if (effectiveAuth) {
        if (cancelled) return;
        const initials = effectiveAuth.name
          .split(' ')
          .map((word: string) => word[0])
          .join('')
          .toUpperCase();
        const role = effectiveAuth.role
          ? effectiveAuth.role.charAt(0).toUpperCase() + effectiveAuth.role.slice(1)
          : 'User';
        setCurrentUser({ name: effectiveAuth.name, initials, role });
        return;
      }

      // Fallback to default
      if (!cancelled) setCurrentUser({ name: 'User', initials: 'U', role: 'User' });
    }

    resolveUser();
    return () => { cancelled = true; };
  }, [userName, userInitials, authUser, developerId, managerId]);

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

          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="text-right">
              <p className="text-base text-slate-900 font-semibold">{currentUser.name}</p>
              <p className="text-sm text-slate-500 font-medium">{currentUser.role}</p>
            </div>
            <Avatar className="w-10 h-10 bg-primary text-white">
              <AvatarFallback className="bg-primary text-white font-semibold text-base">
                {currentUser.initials}
              </AvatarFallback>
            </Avatar>

            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-slate-100 text-slate-600"
              onClick={() => {
                signOut();
                navigate('/');
              }}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
