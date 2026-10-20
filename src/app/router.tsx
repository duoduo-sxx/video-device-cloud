import { Suspense, lazy } from 'react';
import { createHashRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { PageLoader } from '@/components/PageLoader';

const LoginPage = lazy(() => import('@/pages/login/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));

const ProjectListPage = lazy(() => import('@/pages/projects/ProjectListPage'));
const ProjectLayout = lazy(() => import('@/pages/projects/ProjectLayout'));
const ProjectOverview = lazy(() => import('@/pages/projects/ProjectOverview'));
const MilestonesPage = lazy(() => import('@/pages/projects/MilestonesPage'));
const RequirementsPage = lazy(() => import('@/pages/projects/RequirementsPage'));
const BoardPage = lazy(() => import('@/pages/projects/BoardPage'));
const BugsPage = lazy(() => import('@/pages/projects/BugsPage'));
const ProjectBuildsPage = lazy(() => import('@/pages/projects/ProjectBuildsPage'));
const ProjectReleasesPage = lazy(() => import('@/pages/projects/ProjectReleasesPage'));
const MembersPage = lazy(() => import('@/pages/projects/MembersPage'));
const DocsPage = lazy(() => import('@/pages/projects/DocsPage'));

const WorkPage = lazy(() => import('@/pages/work/WorkPage'));
const BuildsPage = lazy(() => import('@/pages/builds/BuildsPage'));
const BuildDetailPage = lazy(() => import('@/pages/builds/BuildDetailPage'));
const ReleasesPage = lazy(() => import('@/pages/releases/ReleasesPage'));
const CalendarPage = lazy(() => import('@/pages/releases/CalendarPage'));

const PerformancePage = lazy(() => import('@/pages/quality/PerformancePage'));
const CompatibilityPage = lazy(() => import('@/pages/quality/CompatibilityPage'));
const CrashesPage = lazy(() => import('@/pages/quality/CrashesPage'));

const RealtimePage = lazy(() => import('@/pages/analytics/RealtimePage'));
const OverviewPage = lazy(() => import('@/pages/analytics/OverviewPage'));
const FunnelPage = lazy(() => import('@/pages/analytics/FunnelPage'));
const ChannelsPage = lazy(() => import('@/pages/analytics/ChannelsPage'));

const AssetsPage = lazy(() => import('@/pages/assets/AssetsPage'));
const BudgetPage = lazy(() => import('@/pages/assets/BudgetPage'));

const TicketsPage = lazy(() => import('@/pages/support/TicketsPage'));
const SdkPage = lazy(() => import('@/pages/support/SdkPage'));
const KnowledgePage = lazy(() => import('@/pages/support/KnowledgePage'));

const TeamPage = lazy(() => import('@/pages/team/TeamPage'));
const WorkloadPage = lazy(() => import('@/pages/team/WorkloadPage'));
const ContractsPage = lazy(() => import('@/pages/billing/ContractsPage'));

const GeneralPage = lazy(() => import('@/pages/settings/GeneralPage'));
const NotificationsPage = lazy(() => import('@/pages/settings/NotificationsPage'));
const IntegrationsPage = lazy(() => import('@/pages/settings/IntegrationsPage'));
const AuditPage = lazy(() => import('@/pages/settings/AuditPage'));

const NotFound = lazy(() => import('@/pages/NotFound'));

function withSuspense(node: React.ReactNode) {
  return <Suspense fallback={<PageLoader />}>{node}</Suspense>;
}

export const router = createHashRouter([
  { path: '/login', element: withSuspense(<LoginPage />) },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: withSuspense(<DashboardPage />) },
      { path: 'projects', element: withSuspense(<ProjectListPage />) },
      {
        path: 'projects/:id',
        element: withSuspense(<ProjectLayout />),
        children: [
          { index: true, element: withSuspense(<ProjectOverview />) },
          { path: 'milestones', element: withSuspense(<MilestonesPage />) },
          { path: 'requirements', element: withSuspense(<RequirementsPage />) },
          { path: 'board', element: withSuspense(<BoardPage />) },
          { path: 'bugs', element: withSuspense(<BugsPage />) },
          { path: 'builds', element: withSuspense(<ProjectBuildsPage />) },
          { path: 'releases', element: withSuspense(<ProjectReleasesPage />) },
          { path: 'members', element: withSuspense(<MembersPage />) },
          { path: 'docs', element: withSuspense(<DocsPage />) },
        ],
      },
      { path: 'work', element: withSuspense(<WorkPage />) },
      { path: 'builds', element: withSuspense(<BuildsPage />) },
      { path: 'builds/:id', element: withSuspense(<BuildDetailPage />) },
      { path: 'releases', element: withSuspense(<ReleasesPage />) },
      { path: 'releases/calendar', element: withSuspense(<CalendarPage />) },
      { path: 'quality/performance', element: withSuspense(<PerformancePage />) },
      { path: 'quality/compatibility', element: withSuspense(<CompatibilityPage />) },
      { path: 'quality/crashes', element: withSuspense(<CrashesPage />) },
      { path: 'analytics/realtime', element: withSuspense(<RealtimePage />) },
      { path: 'analytics/overview', element: withSuspense(<OverviewPage />) },
      { path: 'analytics/funnel', element: withSuspense(<FunnelPage />) },
      { path: 'analytics/channels', element: withSuspense(<ChannelsPage />) },
      { path: 'assets', element: withSuspense(<AssetsPage />) },
      { path: 'assets/budget', element: withSuspense(<BudgetPage />) },
      { path: 'support/tickets', element: withSuspense(<TicketsPage />) },
      { path: 'support/tickets/:id', element: withSuspense(<TicketsPage />) },
      { path: 'support/sdk', element: withSuspense(<SdkPage />) },
      { path: 'support/knowledge', element: withSuspense(<KnowledgePage />) },
      { path: 'team', element: withSuspense(<TeamPage />) },
      { path: 'team/workload', element: withSuspense(<WorkloadPage />) },
      { path: 'billing/contracts', element: withSuspense(<ContractsPage />) },
      { path: 'settings/general', element: withSuspense(<GeneralPage />) },
      { path: 'settings/notifications', element: withSuspense(<NotificationsPage />) },
      { path: 'settings/integrations', element: withSuspense(<IntegrationsPage />) },
      { path: 'settings/audit', element: withSuspense(<AuditPage />) },
      { path: '*', element: withSuspense(<NotFound />) },
    ],
  },
]);
