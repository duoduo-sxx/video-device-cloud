import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ConfigProvider, App as AntdApp, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import BasicLayout from './layouts/BasicLayout';
import { useUiStore } from './store/uiStore';
import Dashboard from './pages/dashboard';
import JobList from './pages/jobs/List';
import JobCreate from './pages/jobs/Create';
import JobDetail from './pages/jobs/Detail';
import NodeList from './pages/nodes/List';
import NodeDetail from './pages/nodes/Detail';
import Links from './pages/links';
import Topology from './pages/topology';
import Policies from './pages/optimization/Policies';
import Models from './pages/optimization/Models';
import Benefit from './pages/optimization/Benefit';
import Spaces from './pages/collab/Spaces';
import Approvals from './pages/collab/Approvals';
import Catalog from './pages/catalog';
import AlertCenter from './pages/alerts/Center';
import AlertRules from './pages/alerts/Rules';
import Reports from './pages/reports';
import Users from './pages/admin/Users';
import Connectors from './pages/admin/Connectors';
import Audit from './pages/admin/Audit';
import Settings from './pages/admin/Settings';
import Profile from './pages/profile';

export default function App() {
  const mode = useUiStore((s) => s.theme);
  const dark = mode === 'dark';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    document.body.style.background = dark ? '#0B1220' : '#F5F7FA';
  }, [mode]);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#2563EB',
          colorInfo: '#2563EB',
          colorSuccess: '#16A34A',
          colorWarning: '#D97706',
          colorError: '#DC2626',
          borderRadius: 8,
          fontSize: 14,
          colorBgLayout: dark ? '#0B1220' : '#F5F7FA',
          colorBgContainer: dark ? '#111C2E' : '#FFFFFF',
          colorBorder: dark ? '#1E2B40' : '#E5E9F2',
          colorBorderSecondary: dark ? '#1E2B40' : '#E5E9F2',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
        },
        components: {
          Table: {
            headerBg: dark ? '#16233A' : '#F8FAFC',
            rowHoverBg: dark ? '#16233A' : '#F5F7FA',
            borderColor: dark ? '#1E2B40' : '#E5E9F2',
            cellPaddingBlock: 12,
          },
          Menu: {
            darkItemBg: '#0B1220',
            darkSubMenuItemBg: '#0B1220',
            darkItemSelectedBg: '#1D4ED8',
            darkItemHoverBg: 'rgba(255,255,255,0.06)',
            itemBorderRadius: 6,
            itemMarginInline: 8,
          },
          Tabs: { itemSelectedColor: '#2563EB' },
          Card: { paddingLG: 20 },
        },
      }}
    >
      <AntdApp>
        <HashRouter>
          <Routes>
            <Route path="/" element={<BasicLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="jobs" element={<JobList />} />
              <Route path="jobs/new" element={<JobCreate />} />
              <Route path="jobs/:id" element={<JobDetail />} />
              <Route path="nodes" element={<NodeList />} />
              <Route path="nodes/:id" element={<NodeDetail />} />
              <Route path="links" element={<Links />} />
              <Route path="topology" element={<Topology />} />
              <Route path="optimization/policies" element={<Policies />} />
              <Route path="optimization/models" element={<Models />} />
              <Route path="optimization/benefit" element={<Benefit />} />
              <Route path="collab/spaces" element={<Spaces />} />
              <Route path="collab/approvals" element={<Approvals />} />
              <Route path="catalog" element={<Catalog />} />
              <Route path="alerts" element={<AlertCenter />} />
              <Route path="alerts/rules" element={<AlertRules />} />
              <Route path="reports" element={<Reports />} />
              <Route path="admin/users" element={<Users />} />
              <Route path="admin/connectors" element={<Connectors />} />
              <Route path="admin/audit" element={<Audit />} />
              <Route path="admin/settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
              <Route
                path="*"
                element={
                  <div className="cf-card" style={{ padding: 60, textAlign: 'center' }}>
                    <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--text-3)' }}>404</div>
                    <div className="muted" style={{ marginTop: 8 }}>页面不存在，请从左侧菜单重新进入</div>
                  </div>
                }
              />
            </Route>
          </Routes>
        </HashRouter>
      </AntdApp>
    </ConfigProvider>
  );
}
