import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import App from './App';
import './styles/app.css';

dayjs.locale('zh-cn');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1668dc',
          colorInfo: '#1668dc',
          colorSuccess: '#16a34a',
          colorWarning: '#faad14',
          colorError: '#f5222d',
          borderRadius: 6,
          fontSize: 13,
          colorText: '#1f2733',
          colorTextSecondary: '#5a6577',
          colorBorder: '#e5e9f0',
          colorBgLayout: '#f5f7fa',
          controlHeight: 32,
        },
        components: {
          Table: { headerBg: '#fafbfd', headerColor: '#5a6577', rowHoverBg: '#f7fbff', cellPaddingBlock: 10 },
          Card: { paddingLG: 16 },
          Menu: { itemHeight: 40 },
        },
      }}
    >
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>,
);
