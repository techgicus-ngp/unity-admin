import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/ui/Spinner';

/** Requires a signed-in user; optionally an admin. */
export function RequireAuth({ adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader label="Loading…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (adminOnly && !isAdmin) return <Navigate to="/quotations" replace />;
  return <Outlet />;
}

/** Login / register: bounce signed-in users to their home page. */
export function PublicOnly() {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <PageLoader label="Loading…" />;
  if (user) return <Navigate to={isAdmin ? '/overview' : '/quotations'} replace />;
  return <Outlet />;
}

export function HomeRedirect() {
  const { isAdmin } = useAuth();
  return <Navigate to={isAdmin ? '/overview' : '/quotations'} replace />;
}
