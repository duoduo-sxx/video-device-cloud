import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from '@/router';
import { useData } from '@/store/data';
import { injectEvidence, injectRights, injectMember } from '@/mock/api';
import '@/styles/globals.css';

// 把本地持久化过的用户新增数据回灌进 mock 数据库，保证刷新后仍在
const { newEvidences, newRights, newMembers } = useData.getState();
[...newEvidences].reverse().forEach((e) => injectEvidence(e));
[...newRights].reverse().forEach((r) => injectRights(r));
[...newMembers].reverse().forEach((m) => injectMember(m));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <Toaster
      theme="dark"
      position="top-right"
      toastOptions={{
        style: {
          background: '#131C2E',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#E8EEF9',
          fontSize: '12.5px',
        },
      }}
    />
  </StrictMode>,
);
