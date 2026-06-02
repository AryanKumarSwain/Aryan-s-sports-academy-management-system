import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AdminRoute, CoachRoute, SuperAdminRoute } from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import CoachLogin from './pages/CoachLogin';
import CoachPortal from './pages/CoachPortal';
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route path="/coach/login" element={<CoachLogin />} />
          <Route path="/super-admin-login" element={<SuperAdminLogin />} />
          <Route
            path="/coach"
            element={
              <CoachRoute>
                <CoachPortal />
              </CoachRoute>
            }
          />
          <Route
            path="/super-admin/dashboard"
            element={
              <SuperAdminRoute>
                <SuperAdminDashboard />
              </SuperAdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
