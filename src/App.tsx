import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import MediaLibrary from './pages/MediaLibrary'
import MediaDetail from './pages/MediaDetail'
import DetectionList from './pages/DetectionList'
import DetectionNew from './pages/DetectionNew'
import DetectionDetail from './pages/DetectionDetail'
import RepairList from './pages/RepairList'
import RepairDetail from './pages/RepairDetail'
import ReviewPage from './pages/ReviewPage'
import Reports from './pages/Reports'
import ReportDetail from './pages/ReportDetail'
import ServiceHall from './pages/ServiceHall'
import OrderBoard from './pages/OrderBoard'
import OrderDetail from './pages/OrderDetail'
import Rules from './pages/Rules'
import Knowledge from './pages/Knowledge'
import CaseDetail from './pages/CaseDetail'
import Compute from './pages/Compute'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/media" element={<MediaLibrary />} />
        <Route path="/media/:id" element={<MediaDetail />} />
        <Route path="/detection" element={<DetectionList />} />
        <Route path="/detection/new" element={<DetectionNew />} />
        <Route path="/detection/:id" element={<DetectionDetail />} />
        <Route path="/repair" element={<RepairList />} />
        <Route path="/repair/:id" element={<RepairDetail />} />
        <Route path="/review/:id" element={<ReviewPage />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports/:id" element={<ReportDetail />} />
        <Route path="/service" element={<ServiceHall />} />
        <Route path="/service/orders" element={<OrderBoard />} />
        <Route path="/service/orders/:id" element={<OrderDetail />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/knowledge" element={<Knowledge />} />
        <Route path="/knowledge/:id" element={<CaseDetail />} />
        <Route path="/compute" element={<Compute />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
