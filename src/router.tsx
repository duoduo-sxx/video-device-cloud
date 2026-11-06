import { lazy, Suspense, type ReactNode } from 'react'
import { createHashRouter, Navigate, Outlet } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { useAppStore } from '@/stores/appStore'
import { LoadingBlock } from '@/components/common'

const Login = lazy(() => import('@/pages/login/Login'))
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'))
const Interaction = lazy(() => import('@/pages/interaction/Interaction'))
const Devices = lazy(() => import('@/pages/devices/Devices'))
const Scenes = lazy(() => import('@/pages/scenes/Scenes'))
const SceneDetail = lazy(() => import('@/pages/scenes/SceneDetail'))
const Tasks = lazy(() => import('@/pages/tasks/Tasks'))
const Alerts = lazy(() => import('@/pages/alerts/Alerts'))
const Service = lazy(() => import('@/pages/service/Service'))
const TicketDetail = lazy(() => import('@/pages/service/TicketDetail'))
const Analytics = lazy(() => import('@/pages/analytics/Analytics'))
const Users = lazy(() => import('@/pages/admin/Users'))
const Roles = lazy(() => import('@/pages/admin/Roles'))
const Audit = lazy(() => import('@/pages/admin/Audit'))
const Settings = lazy(() => import('@/pages/settings/Settings'))
const About = lazy(() => import('@/pages/about/About'))

function Guard() {
  const user = useAppStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

const fallback = (
  <div className="flex-1 flex items-center justify-center">
    <LoadingBlock label="正在装载模块" />
  </div>
)

const wrap = (node: ReactNode) => <Suspense fallback={fallback}>{node}</Suspense>

export const router = createHashRouter([
  { path: '/login', element: wrap(<Login />) },
  {
    element: <Guard />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, element: wrap(<Dashboard />) },
          { path: 'interaction', element: wrap(<Interaction />) },
          { path: 'devices', element: wrap(<Devices />) },
          { path: 'scenes', element: wrap(<Scenes />) },
          { path: 'scenes/:id', element: wrap(<SceneDetail />) },
          { path: 'tasks', element: wrap(<Tasks />) },
          { path: 'alerts', element: wrap(<Alerts />) },
          { path: 'service', element: wrap(<Service />) },
          { path: 'service/tickets/:id', element: wrap(<TicketDetail />) },
          { path: 'analytics', element: wrap(<Analytics />) },
          { path: 'admin/users', element: wrap(<Users />) },
          { path: 'admin/roles', element: wrap(<Roles />) },
          { path: 'admin/audit', element: wrap(<Audit />) },
          { path: 'settings', element: wrap(<Settings />) },
          { path: 'about', element: wrap(<About />) },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
