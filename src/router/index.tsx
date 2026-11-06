import { HashRouter, Route, Routes } from 'react-router-dom';
import BasicLayout, { RequireAuth } from '../layouts/BasicLayout';
import Login from '../pages/login/Login';
import Dashboard from '../pages/dashboard/Dashboard';
import TaskList from '../pages/tasks/TaskList';
import TaskCreate from '../pages/tasks/TaskCreate';
import TaskDetail from '../pages/tasks/TaskDetail';
import Channels from '../pages/channels/Channels';
import Policies from '../pages/policies/Policies';
import PolicyEditor from '../pages/policies/PolicyEditor';
import Nodes from '../pages/nodes/Nodes';
import Workspaces from '../pages/workspaces/Workspaces';
import WorkspaceDetail from '../pages/workspaces/WorkspaceDetail';
import Monitor from '../pages/monitor/Monitor';
import Alerts from '../pages/alerts/Alerts';
import Reports from '../pages/reports/Reports';
import AuditLog from '../pages/security/AuditLog';
import SensitiveData from '../pages/security/SensitiveData';
import AccessControl from '../pages/security/AccessControl';
import Users from '../pages/settings/Users';
import Notifications from '../pages/settings/Notifications';
import Params from '../pages/settings/Params';
import ApiKeys from '../pages/settings/ApiKeys';
import NotFound from '../pages/NotFound';

export default function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <RequireAuth>
              <BasicLayout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<TaskList />} />
          <Route path="/tasks/new" element={<TaskCreate />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/channels" element={<Channels />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/policies/new" element={<PolicyEditor />} />
          <Route path="/policies/:id/edit" element={<PolicyEditor />} />
          <Route path="/nodes" element={<Nodes />} />
          <Route path="/workspaces" element={<Workspaces />} />
          <Route path="/workspaces/:id" element={<WorkspaceDetail />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/security/audit" element={<AuditLog />} />
          <Route path="/security/sensitive" element={<SensitiveData />} />
          <Route path="/security/access" element={<AccessControl />} />
          <Route path="/settings/users" element={<Users />} />
          <Route path="/settings/notifications" element={<Notifications />} />
          <Route path="/settings/params" element={<Params />} />
          <Route path="/settings/api-keys" element={<ApiKeys />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
}
