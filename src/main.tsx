import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { App as AntApp, ConfigProvider, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { router } from './router';
import { useAppStore } from './stores/app';
import './styles/global.css';

function Root() {
  const theme = useAppStore((s) => s.theme);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const dark = theme === 'dark';

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: dark ? '#5B6CFF' : '#4453E6',
          colorInfo: dark ? '#5B6CFF' : '#4453E6',
          colorSuccess: dark ? '#34D399' : '#059669',
          colorWarning: dark ? '#FBBF24' : '#D97706',
          colorError: dark ? '#F87171' : '#DC2626',
          colorBgBase: dark ? '#0B0E14' : '#F5F7FA',
          colorBgContainer: dark ? '#171C26' : '#FFFFFF',
          colorBgElevated: dark ? '#12161F' : '#FFFFFF',
          colorBorder: dark ? '#232A38' : '#E3E8F0',
          colorBorderSecondary: dark ? '#1C2330' : '#EEF2F7',
          colorText: dark ? '#E6EAF2' : '#131A26',
          colorTextSecondary: dark ? '#93A0B8' : '#5A6779',
          colorTextTertiary: dark ? '#5F6B80' : '#8C99AB',
          borderRadius: 8,
          fontSize: 13,
          controlHeight: 32,
          fontFamily: 'Inter, "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif',
        },
        components: {
          Table: {
            headerBg: dark ? '#12161F' : '#F5F7FA',
            rowHoverBg: dark ? '#1E2531' : '#F0F3F8',
            borderColor: dark ? '#232A38' : '#E3E8F0',
            cellPaddingBlock: 11,
          },
          Modal: { contentBg: dark ? '#171C26' : '#FFFFFF', headerBg: dark ? '#171C26' : '#FFFFFF' },
          Drawer: { colorBgElevated: dark ? '#171C26' : '#FFFFFF' },
          Card: { colorBgContainer: dark ? '#171C26' : '#FFFFFF' },
        },
      }}
    >
      <AntApp>
        <RouterProvider router={router} />
      </AntApp>
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
