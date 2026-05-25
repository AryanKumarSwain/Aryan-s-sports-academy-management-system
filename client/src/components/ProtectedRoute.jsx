import { Navigate, useLocation } from 'react-router-dom';
import { getAdminToken, getCoachToken } from '../api/client';

export function AdminRoute({ children }) {
  const location = useLocation();
  const token = getAdminToken();

  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}

export function CoachRoute({ children }) {
  const location = useLocation();
  const token = getCoachToken();

  if (!token) {
    return <Navigate to="/coach/login" state={{ from: location }} replace />;
  }

  return children;
}
