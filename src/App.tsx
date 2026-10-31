import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { ConsoleLayout, AdminLayout, FinanceLayout } from '@/components/layout/layouts';
import Toaster from '@/components/layout/Toaster';
import Forbidden from '@/components/layout/Forbidden';
import type { Scope } from '@/components/layout/nav';
import { useAuthStore } from '@/store/authStore';
import { ROLE_MAP, hasPerm } from '@/mocks/roles';
import type { ReactNode } from 'react';

import Login from '@/pages/auth/Login';
import ConsoleOverview from '@/pages/console/Overview';
import { ComputeInstances, ComputeQuota, ComputeResources, InstanceDetail } from '@/pages/console/compute';
import { ModelDetail, ModelMarket, Playground } from '@/pages/console/models';
import { DataJobs, DataSources, Datasets, JobDetail } from '@/pages/console/data';
import { MatchAnalysis, MatchTaskDetail, MatchTasks } from '@/pages/console/match';
import { GenRecords, GenWorkbench } from '@/pages/console/gen';
import { ApiDocs, ApiKeys, ApiLogs } from '@/pages/console/api';
import Usage from '@/pages/console/usage/Usage';
import Bills from '@/pages/console/billing/Bills';
import BillDetail from '@/pages/console/billing/BillDetail';
import Invoices from '@/pages/console/billing/Invoices';
import Contracts from '@/pages/console/billing/Contracts';
import { Alerts, Company, Members, OpLogs, Recharge } from '@/pages/console/settings';

import AdminOverview from '@/pages/admin/Overview';
import { CustomerDetail, Customers } from '@/pages/admin/Customers';
import { AdminModels, AdminServices, Discounts, PricingPlans } from '@/pages/admin/Catalog';
import { ComputeAlerts, ComputeNodes, ComputePools } from '@/pages/admin/ComputeOps';
import {
  AdminContracts,
  AuditLogs,
  ComplianceReviews,
  PlatformUsers,
  Roles,
  Tickets,
} from '@/pages/admin/Ops';

import {
  FinanceOverview,
  InvoiceApply,
  InvoicePool,
  Receivables,
  Reconcile,
  ReconcileDetail,
  Reports,
} from '@/pages/finance';

function Guard({ perm, scope, children }: { perm: string; scope: Scope; children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const perms = user ? ROLE_MAP[user.role]?.permissions ?? [] : [];
  if (!hasPerm(perms, perm)) return <Forbidden need={perm} scope={scope} />;
  return <>{children}</>;
}

function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="num text-4xl font-semibold text-ink-1">404</div>
      <div className="mt-3 text-sm text-ink-2">页面不存在或已被移除</div>
      <button className="mt-6 rounded-ctl bg-primary px-4 py-2 text-sm text-white" onClick={() => navigate('/console/overview')}>
        返回工作台
      </button>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/auth/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/console/overview" replace />} />

        {/* ============ 客户控制台 ============ */}
        <Route element={<ConsoleLayout />}>
          <Route
            path="/console/overview"
            element={
              <Guard perm="console.overview" scope="console">
                <ConsoleOverview />
              </Guard>
            }
          />
          <Route
            path="/console/compute/instances"
            element={
              <Guard perm="console.compute" scope="console">
                <ComputeInstances />
              </Guard>
            }
          />
          <Route
            path="/console/compute/instances/:id"
            element={
              <Guard perm="console.compute" scope="console">
                <InstanceDetail />
              </Guard>
            }
          />
          <Route
            path="/console/compute/resources"
            element={
              <Guard perm="console.compute" scope="console">
                <ComputeResources />
              </Guard>
            }
          />
          <Route
            path="/console/compute/quota"
            element={
              <Guard perm="console.compute" scope="console">
                <ComputeQuota />
              </Guard>
            }
          />
          <Route
            path="/console/models"
            element={
              <Guard perm="console.models" scope="console">
                <ModelMarket />
              </Guard>
            }
          />
          <Route
            path="/console/models/playground"
            element={
              <Guard perm="console.models" scope="console">
                <Playground />
              </Guard>
            }
          />
          <Route
            path="/console/models/:id"
            element={
              <Guard perm="console.models" scope="console">
                <ModelDetail />
              </Guard>
            }
          />
          <Route
            path="/console/data/jobs"
            element={
              <Guard perm="console.data" scope="console">
                <DataJobs />
              </Guard>
            }
          />
          <Route
            path="/console/data/jobs/:id"
            element={
              <Guard perm="console.data" scope="console">
                <JobDetail />
              </Guard>
            }
          />
          <Route
            path="/console/data/datasets"
            element={
              <Guard perm="console.data" scope="console">
                <Datasets />
              </Guard>
            }
          />
          <Route
            path="/console/data/sources"
            element={
              <Guard perm="console.data" scope="console">
                <DataSources />
              </Guard>
            }
          />
          <Route
            path="/console/match/tasks"
            element={
              <Guard perm="console.match" scope="console">
                <MatchTasks />
              </Guard>
            }
          />
          <Route
            path="/console/match/tasks/:id"
            element={
              <Guard perm="console.match" scope="console">
                <MatchTaskDetail />
              </Guard>
            }
          />
          <Route
            path="/console/match/analysis"
            element={
              <Guard perm="console.match" scope="console">
                <MatchAnalysis />
              </Guard>
            }
          />
          <Route
            path="/console/gen/workbench"
            element={
              <Guard perm="console.generate" scope="console">
                <GenWorkbench />
              </Guard>
            }
          />
          <Route
            path="/console/gen/records"
            element={
              <Guard perm="console.generate" scope="console">
                <GenRecords />
              </Guard>
            }
          />
          <Route
            path="/console/api/keys"
            element={
              <Guard perm="console.api" scope="console">
                <ApiKeys />
              </Guard>
            }
          />
          <Route
            path="/console/api/logs"
            element={
              <Guard perm="console.api" scope="console">
                <ApiLogs />
              </Guard>
            }
          />
          <Route
            path="/console/api/docs"
            element={
              <Guard perm="console.api" scope="console">
                <ApiDocs />
              </Guard>
            }
          />
          <Route
            path="/console/usage"
            element={
              <Guard perm="console.usage" scope="console">
                <Usage />
              </Guard>
            }
          />
          <Route
            path="/console/billing/bills"
            element={
              <Guard perm="console.billing" scope="console">
                <Bills />
              </Guard>
            }
          />
          <Route
            path="/console/billing/bills/:id"
            element={
              <Guard perm="console.billing" scope="console">
                <BillDetail />
              </Guard>
            }
          />
          <Route
            path="/console/billing/invoices"
            element={
              <Guard perm="console.invoice" scope="console">
                <Invoices />
              </Guard>
            }
          />
          <Route
            path="/console/billing/contracts"
            element={
              <Guard perm="console.billing" scope="console">
                <Contracts />
              </Guard>
            }
          />
          <Route
            path="/console/settings/company"
            element={
              <Guard perm="console.settings" scope="console">
                <Company />
              </Guard>
            }
          />
          <Route
            path="/console/settings/members"
            element={
              <Guard perm="console.settings" scope="console">
                <Members />
              </Guard>
            }
          />
          <Route
            path="/console/settings/recharge"
            element={
              <Guard perm="console.settings" scope="console">
                <Recharge />
              </Guard>
            }
          />
          <Route
            path="/console/settings/alerts"
            element={
              <Guard perm="console.settings" scope="console">
                <Alerts />
              </Guard>
            }
          />
          <Route
            path="/console/settings/logs"
            element={
              <Guard perm="console.settings" scope="console">
                <OpLogs />
              </Guard>
            }
          />
          <Route path="/console/*" element={<NotFound />} />
        </Route>

        {/* ============ 运营后台 ============ */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/overview" element={<Guard perm="admin.overview" scope="admin"><AdminOverview /></Guard>} />
          <Route path="/admin/customers" element={<Guard perm="admin.customer" scope="admin"><Customers /></Guard>} />
          <Route path="/admin/customers/:id" element={<Guard perm="admin.customer" scope="admin"><CustomerDetail /></Guard>} />
          <Route path="/admin/contracts" element={<Guard perm="admin.customer" scope="admin"><AdminContracts /></Guard>} />
          <Route path="/admin/tickets" element={<Guard perm="admin.ticket" scope="admin"><Tickets /></Guard>} />
          <Route path="/admin/catalog/services" element={<Guard perm="admin.catalog" scope="admin"><AdminServices /></Guard>} />
          <Route path="/admin/catalog/models" element={<Guard perm="admin.catalog" scope="admin"><AdminModels /></Guard>} />
          <Route path="/admin/pricing/plans" element={<Guard perm="admin.pricing" scope="admin"><PricingPlans /></Guard>} />
          <Route path="/admin/pricing/discounts" element={<Guard perm="admin.pricing" scope="admin"><Discounts /></Guard>} />
          <Route path="/admin/compute/pools" element={<Guard perm="admin.compute" scope="admin"><ComputePools /></Guard>} />
          <Route path="/admin/compute/nodes" element={<Guard perm="admin.compute" scope="admin"><ComputeNodes /></Guard>} />
          <Route path="/admin/compute/alerts" element={<Guard perm="admin.compute" scope="admin"><ComputeAlerts /></Guard>} />
          <Route path="/admin/compliance/reviews" element={<Guard perm="admin.compliance" scope="admin"><ComplianceReviews /></Guard>} />
          <Route path="/admin/compliance/audit" element={<Guard perm="admin.compliance" scope="admin"><AuditLogs /></Guard>} />
          <Route path="/admin/system/users" element={<Guard perm="admin.system" scope="admin"><PlatformUsers /></Guard>} />
          <Route path="/admin/system/roles" element={<Guard perm="admin.system" scope="admin"><Roles /></Guard>} />
          <Route path="/admin/*" element={<NotFound />} />
        </Route>

        {/* ============ 财务结算端 ============ */}
        <Route element={<FinanceLayout />}>
          <Route path="/finance/overview" element={<Guard perm="finance.overview" scope="finance"><FinanceOverview /></Guard>} />
          <Route path="/finance/reconcile" element={<Guard perm="finance.reconcile" scope="finance"><Reconcile /></Guard>} />
          <Route path="/finance/reconcile/:period" element={<Guard perm="finance.reconcile" scope="finance"><ReconcileDetail /></Guard>} />
          <Route path="/finance/invoices" element={<Guard perm="finance.invoice" scope="finance"><InvoicePool /></Guard>} />
          <Route path="/finance/invoices/apply" element={<Guard perm="finance.invoice" scope="finance"><InvoiceApply /></Guard>} />
          <Route path="/finance/receivables" element={<Guard perm="finance.receivable" scope="finance"><Receivables /></Guard>} />
          <Route path="/finance/reports" element={<Guard perm="finance.report" scope="finance"><Reports /></Guard>} />
          <Route path="/finance/*" element={<NotFound />} />
        </Route>

        <Route path="*" element={<Navigate to="/console/overview" replace />} />
      </Routes>
    </>
  );
}
