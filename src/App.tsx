import { HashRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAppStore } from './store/app';
import { BasicLayout } from './layouts/BasicLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DeviceList from './pages/DeviceList';
import DeviceDetail from './pages/DeviceDetail';
import Stations from './pages/Stations';
import Acquisition from './pages/Acquisition';
import CalibrationList from './pages/CalibrationList';
import CalibrationWizard from './pages/CalibrationWizard';
import CalibrationResult from './pages/CalibrationResult';
import Modeling from './pages/Modeling';
import Analysis from './pages/Analysis';
import Replay from './pages/Replay';
import Trajectory from './pages/Trajectory';
import Tasks from './pages/Tasks';
import Alarms from './pages/Alarms';
import Health from './pages/Health';
import Reports from './pages/Reports';
import Services from './pages/Services';
import System from './pages/System';
import NotFound from './pages/NotFound';

function RequireAuth() {
  const user = useAppStore((state) => state.user);
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route element={<BasicLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/devices" element={<DeviceList />} />
            <Route path="/devices/:id" element={<DeviceDetail />} />
            <Route path="/stations" element={<Stations />} />
            <Route path="/acquisition" element={<Acquisition />} />
            <Route path="/calibration" element={<CalibrationList />} />
            <Route path="/calibration/:id" element={<CalibrationWizard />} />
            <Route path="/calibration/:id/result" element={<CalibrationResult />} />
            <Route path="/modeling" element={<Modeling />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/replay" element={<Replay />} />
            <Route path="/trajectory" element={<Trajectory />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/alarms" element={<Alarms />} />
            <Route path="/health" element={<Health />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/services" element={<Services />} />
            <Route path="/system" element={<System />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  );
}
