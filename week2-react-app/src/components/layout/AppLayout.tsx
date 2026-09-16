import { LogOut, MessageSquare, UserCircle, Users } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuthStore } from '../../stores/auth-store';
import { cn } from '../../lib/utils';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
      : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]',
  );

export function AppLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isAdmin = useAuthStore((state) => state.isAdmin());

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <header className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
              Week 2 Full-Stack Demo
            </p>
            <h1 className="text-lg font-semibold">React + Week 1 API</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{user.name}</span>
                <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>{user.role}</Badge>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex flex-row gap-2 lg:flex-col">
          <NavLink to="/chat" className={navLinkClass}>
            <MessageSquare className="h-4 w-4" />
            Chat UI
          </NavLink>
          <NavLink to="/profile" className={navLinkClass}>
            <UserCircle className="h-4 w-4" />
            My Profile
          </NavLink>
          {isAdmin && (
            <NavLink to="/users" className={navLinkClass}>
              <Users className="h-4 w-4" />
              Users (Admin)
            </NavLink>
          )}
        </nav>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
