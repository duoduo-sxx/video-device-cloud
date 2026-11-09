import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme as antdTheme, App as AntApp } from 'antd';
import zhCNLocale from 'antd/locale/zh_CN';
import { MainLayout } from '@/layouts/MainLayout';
import { useAppStore } from '@/store/app';
import { PRIMARY_COLOR } from '@/constants';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import ChatCenter from '@/pages/chat/ChatCenter';
import Semantic from '@/pages/nlp/Semantic';
import VoiceDemo from '@/pages/voice/VoiceDemo';
import Knowledge from '@/pages/knowledge/Knowledge';
import BotConfig from '@/pages/bot/BotConfig';
import Reports from '@/pages/analytics/Reports';
import BigScreen from '@/pages/analytics/BigScreen';
import Quality from '@/pages/quality/Quality';
import SystemAdmin from '@/pages/system/SystemAdmin';
import { ErrorPage } from '@/pages/ErrorPage';

const Guard: React.FC<{ children: React.ReactNode; menuKey: string }> = ({ children, menuKey }) => {
  const { user } = useAppStore();
  const allowed = user ? (ROLE_MENUS_ALLOWED[user.role] ?? []) : [];
  if (!user) return <Navigate to="/login" replace />;
  if (!allowed.includes(menuKey)) return <Navigate to="/403" replace />;
  return <>{children}</>;
};

// 与 constants 中 ROLE_MENUS 一致（避免循环引用直接内联）
const ROLE_MENUS_ALLOWED: Record<string, string[]> = {
  admin: ['dashboard', 'chat', 'nlp', 'voice', 'knowledge', 'bot', 'analytics', 'reports', 'bigscreen', 'quality', 'system'],
  agent: ['dashboard', 'chat', 'nlp', 'voice', 'knowledge'],
  knowledge: ['dashboard', 'chat', 'nlp', 'knowledge', 'bot'],
  analyst: ['dashboard', 'nlp', 'analytics', 'reports', 'bigscreen', 'quality'],
};

export default function App() {
  const theme = useAppStore((s) => s.theme);
  const dark = theme === 'dark';
  return (
    <ConfigProvider
      locale={zhCNLocale}
      theme={{
        algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: { colorPrimary: PRIMARY_COLOR, borderRadius: 8 },
      }}
    >
      <AntApp style={{ minHeight: '100vh', background: dark ? '#141414' : '#f5f6fa' }}>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/login-bigscreen" element={<BigScreen />} />
            <Route element={<MainLayout />}>
              <Route path="/" element={<Guard menuKey="dashboard"><Dashboard /></Guard>} />
              <Route path="/chat" element={<Guard menuKey="chat"><ChatCenter /></Guard>} />
              <Route path="/nlp" element={<Guard menuKey="nlp"><Semantic /></Guard>} />
              <Route path="/voice" element={<Guard menuKey="voice"><VoiceDemo /></Guard>} />
              <Route path="/knowledge" element={<Guard menuKey="knowledge"><Knowledge /></Guard>} />
              <Route path="/bot" element={<Guard menuKey="bot"><BotConfig /></Guard>} />
              <Route path="/analytics/reports" element={<Guard menuKey="reports"><Reports /></Guard>} />
              <Route path="/quality" element={<Guard menuKey="quality"><Quality /></Guard>} />
              <Route path="/system" element={<Guard menuKey="system"><SystemAdmin /></Guard>} />
            </Route>
            <Route path="/analytics/bigscreen" element={<BigScreen />} />
            <Route path="/403" element={<ErrorPage code={403} />} />
            <Route path="/500" element={<ErrorPage code={500} />} />
            <Route path="*" element={<ErrorPage code={404} />} />
          </Routes>
        </HashRouter>
      </AntApp>
    </ConfigProvider>
  );
}
