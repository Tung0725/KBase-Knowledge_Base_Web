import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Portal from '../pages/Portal';
import Auth from '../pages/Auth';
import Hub from '../pages/Hub';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Portal />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/hub" element={<Hub />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
