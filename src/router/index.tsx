import { createHashRouter, Navigate, Outlet } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import { useAuth } from '@/store/auth';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Verify from '@/pages/auth/Verify';
import Dashboard from '@/pages/dashboard';
import EvidenceCreate from '@/pages/evidence/Create';
import EvidenceBatch from '@/pages/evidence/Batch';
import EvidenceList from '@/pages/evidence/List';
import EvidenceDetail from '@/pages/evidence/Detail';
import EvidenceVerify from '@/pages/evidence/Verify';
import RightsRegister from '@/pages/rights/Register';
import RightsList from '@/pages/rights/List';
import RightsDetail from '@/pages/rights/Detail';
import RightsGraph from '@/pages/rights/Graph';
import RightsDisputes from '@/pages/rights/Disputes';
import Contracts from '@/pages/contracts/List';
import ContractDetail from '@/pages/contracts/Detail';
import ContractTemplates from '@/pages/contracts/Templates';
import ForensicsTasks from '@/pages/forensics/Tasks';
import ForensicsWeb from '@/pages/forensics/Web';
import ForensicsMonitor from '@/pages/forensics/Monitor';
import ForensicsPackages from '@/pages/forensics/Packages';
import ForensicsJudicial from '@/pages/forensics/Judicial';
import AssetsRegister from '@/pages/assets/Register';
import AssetsList from '@/pages/assets/List';
import AssetsDetail from '@/pages/assets/Detail';
import AssetsLicenses from '@/pages/assets/Licenses';
import ChainOverview from '@/pages/chain/Overview';
import Blocks from '@/pages/chain/Blocks';
import BlockDetail from '@/pages/chain/BlockDetail';
import Txs from '@/pages/chain/Txs';
import TxDetail from '@/pages/chain/TxDetail';
import Nodes from '@/pages/chain/Nodes';
import ChainContracts from '@/pages/chain/Contracts';
import ServiceApi from '@/pages/service/Api';
import ServiceKeys from '@/pages/service/Keys';
import ServiceUsage from '@/pages/service/Usage';
import ServiceDocs from '@/pages/service/Docs';
import Members from '@/pages/org/Members';
import Roles from '@/pages/org/Roles';
import Audit from '@/pages/org/Audit';
import Billing from '@/pages/billing';
import Settings from '@/pages/settings';
import Notifications from '@/pages/notifications';
import Support from '@/pages/support';
import NotFound from '@/pages/error/NotFound';
import Forbidden from '@/pages/error/Forbidden';

function Guard() {
  const token = useAuth((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export const router = createHashRouter([
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/onboarding/verify', element: <Verify /> },
  {
    path: '/',
    element: <Guard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <Dashboard /> },

          { path: 'evidence/create', element: <EvidenceCreate /> },
          { path: 'evidence/batch', element: <EvidenceBatch /> },
          { path: 'evidence', element: <EvidenceList /> },
          { path: 'evidence/verify', element: <EvidenceVerify /> },
          { path: 'evidence/:id', element: <EvidenceDetail /> },

          { path: 'rights/register', element: <RightsRegister /> },
          { path: 'rights', element: <RightsList /> },
          { path: 'rights/graph', element: <RightsGraph /> },
          { path: 'rights/disputes', element: <RightsDisputes /> },
          { path: 'rights/transfer', element: <RightsList /> },
          { path: 'rights/:id', element: <RightsDetail /> },

          { path: 'contracts', element: <Contracts /> },
          { path: 'contracts/templates', element: <ContractTemplates /> },
          { path: 'contracts/:id', element: <ContractDetail /> },

          { path: 'forensics/tasks', element: <ForensicsTasks /> },
          { path: 'forensics/web', element: <ForensicsWeb /> },
          { path: 'forensics/monitor', element: <ForensicsMonitor /> },
          { path: 'forensics/packages', element: <ForensicsPackages /> },
          { path: 'forensics/judicial', element: <ForensicsJudicial /> },

          { path: 'data-assets/register', element: <AssetsRegister /> },
          { path: 'data-assets', element: <AssetsList /> },
          { path: 'data-assets/licenses', element: <AssetsLicenses /> },
          { path: 'data-assets/:id', element: <AssetsDetail /> },

          { path: 'chain', element: <ChainOverview /> },
          { path: 'chain/blocks', element: <Blocks /> },
          { path: 'chain/blocks/:height', element: <BlockDetail /> },
          { path: 'chain/txs', element: <Txs /> },
          { path: 'chain/tx/:hash', element: <TxDetail /> },
          { path: 'chain/nodes', element: <Nodes /> },
          { path: 'chain/contracts', element: <ChainContracts /> },

          { path: 'service/api', element: <ServiceApi /> },
          { path: 'service/keys', element: <ServiceKeys /> },
          { path: 'service/usage', element: <ServiceUsage /> },
          { path: 'service/docs', element: <ServiceDocs /> },

          { path: 'org/members', element: <Members /> },
          { path: 'org/roles', element: <Roles /> },
          { path: 'org/audit', element: <Audit /> },

          { path: 'billing', element: <Billing /> },
          { path: 'settings', element: <Settings /> },
          { path: 'notifications', element: <Notifications /> },
          { path: 'support', element: <Support /> },

          { path: '403', element: <Forbidden /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
]);
