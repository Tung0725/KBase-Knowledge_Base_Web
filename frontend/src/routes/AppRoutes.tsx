import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';

import About from '../pages/About';
import Guide from '../pages/Guide';
import Privacy from '../pages/Privacy';
import Terms from '../pages/Terms';

// Lazy loaded components for better performance
const Portal = React.lazy(() => import('../pages/Portal'));
const Auth = React.lazy(() => import('../pages/Auth'));
const Hub = React.lazy(() => import('../pages/Hub'));
const Profile = React.lazy(() => import('../pages/Profile'));
const ProjectWorkspace = React.lazy(() => import('../pages/ProjectWorkspace'));
const JoinProject = React.lazy(() => import('../pages/JoinProject'));
const VerifyEmail = React.lazy(() => import('../pages/VerifyEmail'));
const AdminLayout = React.lazy(() => import('../pages/admin/AdminLayout'));
const AdminDashboard = React.lazy(() => import('../pages/admin/AdminDashboard'));
const AdminUsers = React.lazy(() => import('../pages/admin/AdminUsers'));
const AdminProjects = React.lazy(() => import('../pages/admin/AdminProjects'));
const NotFound = React.lazy(() => import('../pages/NotFound'));

// A simple loading spinner to show while chunks are downloading
const FallbackLoading = () => (
  <div className="flex items-center justify-center min-h-screen bg-surface">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<FallbackLoading />}>
          <Routes>
            <Route path="/" element={<Portal />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/verify" element={<VerifyEmail />} />
            <Route path="/about" element={<About />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
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

            {/* Catch-all: any unknown URL shows 404 instead of blank screen */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;
