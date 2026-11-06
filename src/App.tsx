import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AppLayout from './components/Layout'
import { Toaster } from './components/ui'
import { useAuth, useUi } from './stores'
import { loadState } from './services'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Videos from './pages/Videos'
import VideoDetail from './pages/VideoDetail'
import Analysis from './pages/Analysis'
import SearchPage from './pages/Search'
import Review from './pages/Review'
import Editing from './pages/Editing'
import Analytics from './pages/Analytics'
import Models from './pages/Models'
import Settings from './pages/Settings'
import { NotFound } from './pages/Error'

function Guard({ children }: { children: React.ReactNode }) {
  const user = useAuth((s) => s.user)
  const loc = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  return <>{children}</>
}

function TitleSync() {
  const loc = useLocation()
  useEffect(() => {
    const map: Record<string, string> = {
      dashboard: '工作台',
      videos: '视频资产库',
      search: '智能检索',
      editing: '智能剪辑',
      review: '内容审核',
      analytics: '数据分析',
      models: '模型与能力',
      settings: '系统设置',
      login: '登录',
    }
    const seg = loc.pathname.split('/')[1] ?? 'dashboard'
    document.title = `${map[seg] ?? '视频智能化'} · 视频智能化内容理解与分析系统`
  }, [loc.pathname])
  return null
}

export default function App() {
  const theme = useUi((s) => s.theme)
  const login = useAuth((s) => s.login)
  const user = useAuth((s) => s.user)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    loadState()
    try {
      const raw = localStorage.getItem('vi_auth')
      if (raw && !user) {
        const parsed = JSON.parse(raw) as { role?: string }
        login((parsed.role as never) ?? 'admin')
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <HashRouter>
      <TitleSync />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <Guard>
              <AppLayout />
            </Guard>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/videos/:id" element={<VideoDetail />} />
          <Route path="/videos/:id/analysis" element={<Analysis />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/editing" element={<Editing />} />
          <Route path="/editing/:id" element={<Editing />} />
          <Route path="/review" element={<Review />} />
          <Route path="/review/:id" element={<Review />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/models" element={<Models />} />
          <Route path="/models/pipeline" element={<Models />} />
          <Route path="/settings/:tab" element={<Settings />} />
          <Route path="/settings" element={<Navigate to="/settings/users" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </HashRouter>
  )
}
