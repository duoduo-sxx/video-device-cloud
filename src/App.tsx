import { useEffect } from 'react';
import { App as AntdApp } from 'antd';
import AppRouter from './router';
import { bindMessage } from './utils/feedback';

export default function App() {
  const { message } = AntdApp.useApp();

  useEffect(() => {
    bindMessage(message);
  }, [message]);

  return <AppRouter />;
}
