import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Spin } from 'antd'
import BasicLayout from '@/layouts/BasicLayout'
import ImmersiveLayout from '@/layouts/ImmersiveLayout'
import Login from '@/features/login/Login'

/**
 * 按命名导出做代码分割。
 * 每个业务模块用单文件导出多个页面组件，这里逐个包成 default，
 * 既保留路由级懒加载，又避免整包进入首屏。
 */
const Dashboard = lazy(() => import('@/features/dashboard/Dashboard'))

const Tasks = lazy(() => import('@/features/data/pages').then((m) => ({ default: m.Tasks })))
const TaskDetail = lazy(() => import('@/features/data/pages').then((m) => ({ default: m.TaskDetail })))
const Datasets = lazy(() => import('@/features/data/pages').then((m) => ({ default: m.Datasets })))
const Quality = lazy(() => import('@/features/data/pages').then((m) => ({ default: m.Quality })))

const Assets = lazy(() => import('@/features/recon/pages').then((m) => ({ default: m.Assets })))
const Optimize = lazy(() => import('@/features/recon/pages').then((m) => ({ default: m.Optimize })))
const Compare = lazy(() => import('@/features/recon/pages').then((m) => ({ default: m.Compare })))
const Publish = lazy(() => import('@/features/recon/pages').then((m) => ({ default: m.Publish })))
const Viewer = lazy(() => import('@/features/recon/Viewer'))

const Devices = lazy(() => import('@/features/mr/pages').then((m) => ({ default: m.Devices })))
const Calibration = lazy(() => import('@/features/mr/pages').then((m) => ({ default: m.Calibration })))
const Collab = lazy(() => import('@/features/mr/Collab'))
const Sessions = lazy(() => import('@/features/mr/pages').then((m) => ({ default: m.Sessions })))

const AuthoringList = lazy(() => import('@/features/mr/Authoring').then((m) => ({ default: m.List })))
const AuthoringEditor = lazy(() => import('@/features/mr/Authoring').then((m) => ({ default: m.Editor })))

const Plans = lazy(() => import('@/features/inspect/pages').then((m) => ({ default: m.Plans })))
const PlanDetail = lazy(() => import('@/features/inspect/pages').then((m) => ({ default: m.PlanDetail })))
const Records = lazy(() => import('@/features/inspect/pages').then((m) => ({ default: m.Records })))
const Defects = lazy(() => import('@/features/inspect/pages').then((m) => ({ default: m.Defects })))

const Board = lazy(() => import('@/features/tickets/pages').then((m) => ({ default: m.Board })))
const TicketDetail = lazy(() => import('@/features/tickets/pages').then((m) => ({ default: m.Detail })))

const Catalog = lazy(() => import('@/features/services/pages').then((m) => ({ default: m.Catalog })))
const Orders = lazy(() => import('@/features/services/pages').then((m) => ({ default: m.Orders })))
const OrderDetail = lazy(() => import('@/features/services/pages').then((m) => ({ default: m.OrderDetail })))
const Delivery = lazy(() => import('@/features/services/pages').then((m) => ({ default: m.Delivery })))
const Knowledge = lazy(() => import('@/features/services/pages').then((m) => ({ default: m.Knowledge })))

const Org = lazy(() => import('@/features/system/pages').then((m) => ({ default: m.Org })))
const Users = lazy(() => import('@/features/system/pages').then((m) => ({ default: m.Users })))
const Roles = lazy(() => import('@/features/system/pages').then((m) => ({ default: m.Roles })))
const Logs = lazy(() => import('@/features/system/pages').then((m) => ({ default: m.Logs })))
const Settings = lazy(() => import('@/features/system/pages').then((m) => ({ default: m.Settings })))

const Forbidden = lazy(() => import('@/features/misc/pages').then((m) => ({ default: m.Forbidden })))
const NotFound = lazy(() => import('@/features/misc/pages').then((m) => ({ default: m.NotFound })))

const Loading = () => (
  <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Spin />
  </div>
)

export default function AppRouter() {
  return (
    <HashRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ImmersiveLayout />}>
            <Route path="/recon/viewer" element={<Viewer />} />
            <Route path="/mr/authoring/:id" element={<AuthoringEditor />} />
          </Route>

          <Route element={<BasicLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="/data/tasks" element={<Tasks />} />
            <Route path="/data/tasks/:id" element={<TaskDetail />} />
            <Route path="/data/datasets" element={<Datasets />} />
            <Route path="/data/quality" element={<Quality />} />
            <Route path="/recon/assets" element={<Assets />} />
            <Route path="/recon/assets/:id/optimize" element={<Optimize />} />
            <Route path="/recon/compare" element={<Compare />} />
            <Route path="/recon/publish" element={<Publish />} />
            <Route path="/mr/devices" element={<Devices />} />
            <Route path="/mr/calibration" element={<Calibration />} />
            <Route path="/mr/authoring" element={<AuthoringList />} />
            <Route path="/mr/collab" element={<Collab />} />
            <Route path="/mr/sessions" element={<Sessions />} />
            <Route path="/inspect/plans" element={<Plans />} />
            <Route path="/inspect/plans/:id" element={<PlanDetail />} />
            <Route path="/inspect/records" element={<Records />} />
            <Route path="/inspect/defects" element={<Defects />} />
            <Route path="/tickets" element={<Board />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/service/catalog" element={<Catalog />} />
            <Route path="/service/orders" element={<Orders />} />
            <Route path="/service/orders/:id" element={<OrderDetail />} />
            <Route path="/service/delivery" element={<Delivery />} />
            <Route path="/service/knowledge" element={<Knowledge />} />
            <Route path="/system/org" element={<Org />} />
            <Route path="/system/users" element={<Users />} />
            <Route path="/system/roles" element={<Roles />} />
            <Route path="/system/logs" element={<Logs />} />
            <Route path="/system/settings" element={<Settings />} />
            <Route path="/403" element={<Forbidden />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  )
}
