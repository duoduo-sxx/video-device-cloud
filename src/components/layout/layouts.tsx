import AppShell from './AppShell';
import { CONSOLE_NAV, ADMIN_NAV, FINANCE_NAV } from './nav';

export const ConsoleLayout = () => <AppShell scope="console" groups={CONSOLE_NAV} />;
export const AdminLayout = () => <AppShell scope="admin" groups={ADMIN_NAV} />;
export const FinanceLayout = () => <AppShell scope="finance" groups={FINANCE_NAV} />;
