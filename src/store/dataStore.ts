import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import dayjs from 'dayjs';
import type { AlertItem, AlertRule, Approval, Policy, TransferJob } from '../types';
import { ALERTS, APPROVALS, POLICIES, RULES, SEED_DAY, JOBS } from '../mock/seed';

interface DataState {
  seedDay: string;
  jobs: TransferJob[];
  alerts: AlertItem[];
  approvals: Approval[];
  policies: Policy[];
  rules: AlertRule[];
  addJob: (job: TransferJob) => void;
  updateJob: (id: string, patch: Partial<TransferJob>) => void;
  updateJobs: (ids: string[], patch: Partial<TransferJob>) => void;
  removeJobs: (ids: string[]) => void;
  updateAlert: (id: string, patch: Partial<AlertItem>) => void;
  updateApproval: (id: string, patch: Partial<Approval>) => void;
  addPolicy: (p: Policy) => void;
  updatePolicy: (id: string, patch: Partial<Policy>) => void;
  removePolicy: (id: string) => void;
  toggleRule: (id: string, enabled: boolean) => void;
  tick: () => void;
  reset: () => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      seedDay: SEED_DAY,
      jobs: JOBS,
      alerts: ALERTS,
      approvals: APPROVALS,
      policies: POLICIES,
      rules: RULES,
      addJob: (job) => set({ jobs: [job, ...get().jobs] }),
      updateJob: (id, patch) =>
        set({ jobs: get().jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)) }),
      updateJobs: (ids, patch) =>
        set({ jobs: get().jobs.map((j) => (ids.includes(j.id) ? { ...j, ...patch } : j)) }),
      removeJobs: (ids) => set({ jobs: get().jobs.filter((j) => !ids.includes(j.id)) }),
      updateAlert: (id, patch) =>
        set({ alerts: get().alerts.map((a) => (a.id === id ? { ...a, ...patch } : a)) }),
      updateApproval: (id, patch) =>
        set({ approvals: get().approvals.map((a) => (a.id === id ? { ...a, ...patch } : a)) }),
      addPolicy: (p) => set({ policies: [p, ...get().policies] }),
      updatePolicy: (id, patch) =>
        set({ policies: get().policies.map((p) => (p.id === id ? { ...p, ...patch } : p)) }),
      removePolicy: (id) => set({ policies: get().policies.filter((p) => p.id !== id) }),
      toggleRule: (id, enabled) =>
        set({ rules: get().rules.map((r) => (r.id === id ? { ...r, enabled } : r)) }),
      tick: () => {
        const jobs = get().jobs;
        let changed = false;
        const next = jobs.map((j) => {
          if (j.status !== 'running' || j.progress >= 100) return j;
          changed = true;
          const step = 0.18 + Math.random() * 0.9;
          const progress = Math.min(100, Number((j.progress + step).toFixed(1)));
          const totalBytes = j.totalBytes;
          const speedBps = Math.round(j.speedBps * (0.94 + Math.random() * 0.12));
          const transferredBytes = Math.round((totalBytes * progress) / 100);
          const done = progress >= 100;
          return {
            ...j,
            progress,
            transferredBytes: done ? totalBytes : transferredBytes,
            speedBps: done ? 0 : speedBps,
            etaSeconds: done ? 0 : Math.round((totalBytes - transferredBytes) / Math.max(speedBps, 1)),
            status: done ? ('success' as const) : j.status,
            finishedAt: done ? dayjs().toISOString() : j.finishedAt,
          };
        });
        if (changed) set({ jobs: next });
      },
      reset: () =>
        set({
          seedDay: SEED_DAY,
          jobs: JOBS,
          alerts: ALERTS,
          approvals: APPROVALS,
          policies: POLICIES,
          rules: RULES,
        }),
    }),
    {
      name: 'cf-data-v1',
      version: 1,
      partialize: (s) => ({
        seedDay: s.seedDay,
        jobs: s.jobs,
        alerts: s.alerts,
        approvals: s.approvals,
        policies: s.policies,
        rules: s.rules,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.seedDay !== SEED_DAY) state.reset();
      },
    },
  ),
);
