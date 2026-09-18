import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Portal from '../pages/Portal';
import Auth from '../pages/Auth';
import Hub from '../pages/Hub';
import { AuthProvider } from '../context/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Portal />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/hub" element={<ProtectedRoute><Hub /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;
