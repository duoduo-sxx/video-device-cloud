import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Evidence, Member, RightsRecord } from '@/types';

interface DataState {
  newEvidences: Evidence[];
  newRights: RightsRecord[];
  newMembers: Member[];
  addEvidence: (e: Evidence) => void;
  addRights: (r: RightsRecord) => void;
  updateRights: (r: RightsRecord) => void;
  addMember: (m: Member) => void;
}

export const useData = create<DataState>()(
  persist(
    (set) => ({
      newEvidences: [],
      newRights: [],
      newMembers: [],
      addEvidence: (e) => set((s) => ({ newEvidences: [e, ...s.newEvidences].slice(0, 50) })),
      addRights: (r) => set((s) => ({ newRights: [r, ...s.newRights].slice(0, 50) })),
      updateRights: (r) =>
        set((s) => ({ newRights: s.newRights.map((x) => (x.id === r.id ? r : x)) })),
      addMember: (m) => set((s) => ({ newMembers: [...s.newMembers, m] })),
    }),
    { name: 'xh-data' },
  ),
);
