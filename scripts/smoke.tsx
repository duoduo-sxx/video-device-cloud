/** 全路由渲染冒烟：每个页面单独 renderToString，确保没有运行期崩溃 */
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import type { ComponentType } from 'react';

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

const ROUTES: [string, ComponentType][] = [
  ['/overview', Overview],
  ['/connect/accounts', Accounts],
  ['/connect/sync', Sync],
  ['/connect/quality', Quality],
  ['/data/layers', Layers],
  ['/data/metrics', MetricDict],
  ['/insight/audience', Audience],
  ['/insight/attribution', Attribution],
  ['/insight/funnel', Funnel],
  ['/insight/campaigns', Campaigns],
  ['/insight/anomaly', Anomaly],
  ['/optimize/suggestions', Suggestions],
  ['/optimize/budget', Budget],
  ['/optimize/changes', Changes],
  ['/reports/daily', Reconcile],
  ['/settings', Settings],
];

let bad = 0;
for (const [path, Page] of ROUTES) {
  try {
    const html = renderToString(
      <MemoryRouter initialEntries={[path]}>
        <Page />
      </MemoryRouter>,
    );
    const okLen = html.length > 2000;
    if (!okLen) {
      bad++;
      console.log(`✗ ${path} 渲染过短（${html.length} 字符）`);
    } else {
      console.log(`✓ ${path}  ${(html.length / 1024).toFixed(1)} KB`);
    }
  } catch (e) {
    bad++;
    console.log(`✗ ${path} 崩溃：${(e as Error).message}`);
  }
}
console.log(bad ? `\n${bad} 个页面异常` : '\n全部 16 个页面渲染正常');
process.exit(bad ? 1 : 0);
