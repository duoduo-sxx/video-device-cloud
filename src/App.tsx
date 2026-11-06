import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout'
import { startJobTicker } from './store/data'
import Dashboard from './pages/Dashboard'
import Assets from './pages/Assets'
import Jobs from './pages/Jobs'
import JobNew from './pages/JobNew'
import JobDetail from './pages/JobDetail'
import Review from './pages/Review'
import ReviewDetail from './pages/ReviewDetail'
import Presets from './pages/Presets'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Tickets from './pages/Tickets'
import TicketDetail from './pages/TicketDetail'
import Nodes from './pages/Nodes'
import Team from './pages/Team'
import Logs from './pages/Logs'
import SettingsPage from './pages/Settings'

function NotFound() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center">
      <div className="mono text-[48px] text-[#232936]">404</div>
      <div className="mt-2 text-[14px] text-ink">页面不存在</div>
      <div className="mt-1 text-[12px] text-dim">检查地址，或从左侧导航重新进入。</div>
    </div>
  )
}

export default function App() {
  useEffect(() => {
    const stop = startJobTicker()
    return stop
  }, [])

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/assets/:id" element={<Assets />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/new" element={<JobNew />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/jobs/:id/review" element={<ReviewDetail />} />
          <Route path="/review" element={<Review />} />
          <Route path="/presets" element={<Presets />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/tickets/:id" element={<TicketDetail />} />
          <Route path="/nodes" element={<Nodes />} />
          <Route path="/team" element={<Team />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
