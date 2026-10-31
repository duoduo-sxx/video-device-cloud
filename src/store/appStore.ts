import { create } from 'zustand';
import type { Bill, ComputeInstance, Invoice, MatchPair } from '@/types';
import { BILL_STATE } from '@/mocks/bills';
import { INVOICE_STATE } from '@/mocks/invoices';
import { INSTANCES } from '@/mocks/compute';
import { MATCH_PAIRS } from '@/mocks/matches';
import { TENANTS } from '@/mocks/tenants';
import { round2 } from '@/lib/calc';

interface AppState {
  bills: Bill[];
  invoices: Invoice[];
  instances: ComputeInstance[];
  pairs: MatchPair[];
  balance: number;

  confirmBill: (id: string) => void;
  disputeBill: (id: string) => void;
  applyInvoice: (inv: Invoice) => void;
  issueInvoice: (id: string, invoiceNo: string) => void;
  addInstance: (i: ComputeInstance) => void;
  setInstanceStatus: (id: string, status: ComputeInstance['status']) => void;
  reviewPair: (id: string, status: MatchPair['reviewStatus']) => void;
  reviewPairs: (ids: string[], status: MatchPair['reviewStatus']) => void;
  recharge: (amount: number) => void;
  markSettled: (billId: string, paymentId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  bills: Object.values(BILL_STATE).map((b) => ({ ...b })),
  invoices: Object.values(INVOICE_STATE).map((i) => ({ ...i })),
  instances: INSTANCES.map((i) => ({ ...i })),
  pairs: MATCH_PAIRS.map((p) => ({ ...p })),
  balance: TENANTS[0].balance,

  confirmBill: (id) =>
    set((s) => ({
      bills: s.bills.map((b) =>
        b.id === id ? { ...b, status: 'confirmed', confirmedAt: '2026-10-31T23:45:00' } : b,
      ),
    })),

  disputeBill: (id) =>
    set((s) => ({
      bills: s.bills.map((b) => (b.id === id ? { ...b, status: 'disputed' } : b)),
    })),

  applyInvoice: (inv) => set((s) => ({ invoices: [inv, ...s.invoices] })),

  issueInvoice: (id, invoiceNo) =>
    set((s) => ({
      invoices: s.invoices.map((i) =>
        i.id === id ? { ...i, status: 'issued', invoiceNo, issuedAt: '2026-10-31T23:50:00' } : i,
      ),
      bills: s.bills.map((b) =>
        s.invoices.find((i) => i.id === id)?.billIds.includes(b.id)
          ? { ...b, status: 'invoiced', invoiceId: id }
          : b,
      ),
    })),

  addInstance: (i) => set((s) => ({ instances: [i, ...s.instances] })),

  setInstanceStatus: (id, status) =>
    set((s) => ({ instances: s.instances.map((i) => (i.id === id ? { ...i, status } : i)) })),

  reviewPair: (id, status) =>
    set((s) => ({ pairs: s.pairs.map((p) => (p.id === id ? { ...p, reviewStatus: status } : p)) })),

  reviewPairs: (ids, status) =>
    set((s) => ({
      pairs: s.pairs.map((p) => (ids.includes(p.id) ? { ...p, reviewStatus: status } : p)),
    })),

  recharge: (amount) => set((s) => ({ balance: round2(s.balance + amount) })),

  markSettled: (billId) =>
    set((s) => ({
      bills: s.bills.map((b) =>
        b.id === billId ? { ...b, status: 'settled', paidAt: '2026-10-31T23:55:00' } : b,
      ),
    })),
}));
