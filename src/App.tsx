import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { buildAntdTheme } from './styles/antd-theme';
import { useResolvedTheme } from './stores/uiStore';
import './styles/tokens.css';
import './styles/global.css';
import './styles/components.css';
import './styles/layout.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 0,
      staleTime: 30_000,
    },
  },
});

function ThemedApp() {
  const mode = useResolvedTheme();
  return (
    <ConfigProvider
      locale={zhCN}
      theme={buildAntdTheme(mode)}
      componentSize="middle"
    >
      <AntApp>
        <RouterProvider router={router} />
      </AntApp>
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemedApp />
    </QueryClientProvider>
  );
}
