import { create } from 'zustand';
import type { ChangeOrder, Suggestion, SuggestionStatus } from '@/types';
import { CHANGE_ORDERS, SUGGESTIONS } from '@/mocks/insights';

interface AppState {
  suggestions: Suggestion[];
  changes: ChangeOrder[];
  /** 预算模拟：planId → 调整后的日预算 */
  draftBudgets: Record<string, number>;

  setSuggestionStatus: (id: string, status: SuggestionStatus) => void;
  /** 采纳并下发：生成变更单，状态置为已下发 */
  dispatch: (id: string, operator: string) => void;
  ignore: (id: string) => void;
  setDraftBudget: (planId: string, budget: number) => void;
  resetDraftBudgets: () => void;
  retryChange: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  suggestions: SUGGESTIONS,
  changes: CHANGE_ORDERS,
  draftBudgets: {},

  setSuggestionStatus: (id, status) =>
    set((s) => ({
      suggestions: s.suggestions.map((x) => (x.id === id ? { ...x, status } : x)),
    })),

  dispatch: (id, operator) => {
    const sg = get().suggestions.find((s) => s.id === id);
    if (!sg) return;
    const now = new Date('2026-10-31T10:00:00');
    const order: ChangeOrder = {
      id: `CH-20261031-${String(100 + get().changes.length + 1).slice(1)}`,
      suggestionId: sg.id,
      accountId: sg.accountId,
      target: sg.target,
      type: sg.type,
      before: sg.evidence[0] ? `${sg.evidence[0].label}：${sg.evidence[0].value}` : '—',
      after: sg.action,
      status: 'dispatched',
      createdAt: now.toISOString().slice(0, 19),
      effectiveAt: null,
      operator,
    };
    set((s) => ({
      changes: [order, ...s.changes],
      suggestions: s.suggestions.map((x) => (x.id === id ? { ...x, status: 'dispatched' } : x)),
    }));
  },

  ignore: (id) =>
    set((s) => ({
      suggestions: s.suggestions.map((x) => (x.id === id ? { ...x, status: 'ignored' } : x)),
    })),

  setDraftBudget: (planId, budget) =>
    set((s) => ({ draftBudgets: { ...s.draftBudgets, [planId]: budget } })),

  resetDraftBudgets: () => set({ draftBudgets: {} }),

  retryChange: (id) =>
    set((s) => ({
      changes: s.changes.map((c) =>
        c.id === id ? { ...c, status: 'dispatched' } : c,
      ),
    })),
}));

export const usePendingCount = () =>
  useAppStore((s) => s.suggestions.filter((x) => x.status === 'pending').length);
