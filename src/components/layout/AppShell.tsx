import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { NAV_GROUPS } from './nav';

export default function AppShell() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-page">
      <Sidebar groups={NAV_GROUPS} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar groups={NAV_GROUPS} />
        <main className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mx-auto max-w-[1560px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
