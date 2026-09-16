import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/auth-store';

export function AdminRoute() {
  const isAdmin = useAuthStore((state) => state.isAdmin());

  if (!isAdmin) {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
}
