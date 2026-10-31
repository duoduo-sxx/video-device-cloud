import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { SCOPE_META, type NavGroup, type Scope } from './nav';

export default function AppShell({ scope, groups }: { scope: Scope; groups: NavGroup[] }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-page">
      <Sidebar groups={groups} scopeLabel={SCOPE_META[scope].label} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar groups={groups} scope={scope} />
        <main className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mx-auto max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
