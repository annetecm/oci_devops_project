import { LogOut, Menu } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
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
      <header className="sticky top-0 z-30 relative bg-white border-b border-slate-200 shadow-sm">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-700 via-red-500 to-orange-400" />
        <div className="h-[76px] px-8 flex items-center">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              {onMenuClick && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-slate-100 text-slate-600 rounded-lg lg:hidden"
                >
                  <Menu className="w-6 h-6" />
                </Button>
              )}
              <div>
                <h1 className="text-slate-900 text-base font-bold tracking-tight">{title}</h1>
                {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 relative bg-white border-b border-slate-200 shadow-sm">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-700 via-red-500 to-orange-400" />
      <div className="h-[76px] px-8 flex items-center">
        <div className="flex items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-4 min-w-0">
            {onMenuClick && (
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-slate-100 text-slate-600 rounded-lg shrink-0 lg:hidden"
                onClick={onMenuClick}
              >
                <Menu className="w-6 h-6" />
              </Button>
            )}
            <div className="min-w-0">
              <h1 className="text-slate-900 text-base font-bold tracking-tight truncate">{title}</h1>
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5 font-medium truncate">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200">
              <Avatar className="w-9 h-9 ring-2 ring-white shadow-sm">
                <AvatarFallback className="bg-gradient-to-br from-red-700 to-red-900 text-white font-semibold text-sm">
                  {currentUser.initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-left pr-1">
                <p className="text-sm text-slate-900 font-semibold leading-none">{currentUser.name}</p>
                <p className="text-[11px] text-red-700 font-semibold uppercase tracking-wider mt-1">
                  {currentUser.role}
                </p>
              </div>
            </div>

            <div className="sm:hidden">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-gradient-to-br from-red-700 to-red-900 text-white font-semibold">
                  {currentUser.initials}
                </AvatarFallback>
              </Avatar>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:!bg-slate-100 hover:!text-slate-900 text-slate-500 rounded-lg transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out of Synkra?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your session will end. You will need to authenticate again to access your workspace.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="hover:!bg-slate-100 hover:!text-slate-900">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-800 hover:bg-red-900 text-white"
                    onClick={() => {
                      signOut();
                      navigate('/');
                    }}
                  >
                    Sign out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </header>
  );
}
