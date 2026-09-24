import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Portal from '../pages/Portal';
import Auth from '../pages/Auth';
import Hub from '../pages/Hub';
import Profile from '../pages/Profile';
import ProjectWorkspace  from '../pages/ProjectWorkspace';
import JoinProject from '../pages/JoinProject';
import VerifyEmail from '../pages/VerifyEmail';
import { AuthProvider } from '../context/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import AdminLayout from '../pages/admin/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminProjects from '../pages/admin/AdminProjects';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Portal />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/join/:inviteCode" element={<JoinProject />} />
          <Route path="/hub" element={<ProtectedRoute><Hub /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/projects/:projectId/*" element={<ProtectedRoute><ProjectWorkspace /></ProtectedRoute>} />
          
          <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="projects" element={<AdminProjects />} />
          </Route>
          
          {/* Admin specific project workspace route */}
          <Route path="/admin/projects/:projectId/*" element={<ProtectedRoute requiredRole="ADMIN"><ProjectWorkspace /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;
