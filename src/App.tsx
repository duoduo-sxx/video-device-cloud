import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import Toaster from '@/components/layout/Toaster';

import Overview from '@/pages/overview/Overview';
import Accounts from '@/pages/connect/Accounts';
import Sync from '@/pages/connect/Sync';
import Quality from '@/pages/connect/Quality';
import Layers from '@/pages/data/Layers';
import MetricDict from '@/pages/data/MetricDict';
import Audience from '@/pages/insight/Audience';
import Attribution from '@/pages/insight/Attribution';
import Funnel from '@/pages/insight/Funnel';
import Campaigns from '@/pages/insight/Campaigns';
import Anomaly from '@/pages/insight/Anomaly';
import Suggestions from '@/pages/optimize/Suggestions';
import Budget from '@/pages/optimize/Budget';
import Changes from '@/pages/optimize/Changes';
import Reconcile from '@/pages/reports/Reconcile';
import Settings from '@/pages/settings/Settings';

function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="num text-4xl font-semibold text-ink-1">404</div>
      <div className="mt-3 text-sm text-ink-2">页面不存在或已被移除</div>
      <button
        className="mt-6 rounded-ctl bg-primary px-4 py-2 text-sm text-white"
        onClick={() => navigate('/overview')}
      >
        返回投放总览
      </button>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster />
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/overview" element={<Overview />} />

          {/* 数据接入 */}
          <Route path="/connect/accounts" element={<Accounts />} />
          <Route path="/connect/sync" element={<Sync />} />
          <Route path="/connect/quality" element={<Quality />} />

          {/* 数据资产 */}
          <Route path="/data/layers" element={<Layers />} />
          <Route path="/data/metrics" element={<MetricDict />} />

          {/* 模型分析 */}
          <Route path="/insight/audience" element={<Audience />} />
          <Route path="/insight/attribution" element={<Attribution />} />
          <Route path="/insight/funnel" element={<Funnel />} />
          <Route path="/insight/campaigns" element={<Campaigns />} />
          <Route path="/insight/anomaly" element={<Anomaly />} />

          {/* 优化执行 */}
          <Route path="/optimize/suggestions" element={<Suggestions />} />
          <Route path="/optimize/budget" element={<Budget />} />
          <Route path="/optimize/changes" element={<Changes />} />

          {/* 报表与设置 */}
          <Route path="/reports/daily" element={<Reconcile />} />
          <Route path="/settings" element={<Settings />} />

          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
