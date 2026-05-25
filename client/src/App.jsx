import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AdminRoute, CoachRoute } from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import CoachLogin from './pages/CoachLogin';
import CoachPortal from './pages/CoachPortal';

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
          <Route
            path="/coach"
            element={
              <CoachRoute>
                <CoachPortal />
              </CoachRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
