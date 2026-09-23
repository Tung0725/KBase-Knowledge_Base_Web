import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Portal from '../pages/Portal';
import Auth from '../pages/Auth';
import Hub from '../pages/Hub';
import ProjectWorkspace  from '../pages/ProjectWorkspace';
import JoinProject from '../pages/JoinProject';
import VerifyEmail from '../pages/VerifyEmail';
import { AuthProvider } from '../context/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';

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
          <Route path="/projects/:projectId/*" element={<ProtectedRoute><ProjectWorkspace /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;
