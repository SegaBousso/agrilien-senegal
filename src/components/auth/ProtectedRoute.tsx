import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/States';
import type { UserRole } from '@/types/database';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Rôle(s) autorisé(s). Si absent, toute session authentifiée suffit. */
  role?: UserRole | UserRole[];
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Spinner label="Vérification de votre session…" />;
  }

  if (!session) {
    return <Navigate to="/connexion" state={{ from: location.pathname }} replace />;
  }

  if (role && profile) {
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(profile.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
