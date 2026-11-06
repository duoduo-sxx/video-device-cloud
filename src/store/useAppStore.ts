import { create } from 'zustand';

const COLLAPSE_KEY = 'datarelay_collapsed';

interface AppNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type: 'alert' | 'task' | 'system';
}

const seedNotifications: AppNotification[] = [
  { id: 'N1', title: '通道 CH-03 丢包率超过阈值', desc: '当前 2.1%，已持续 47 分钟，建议切换备用通道。', time: '8 分钟前', read: false, type: 'alert' },
  { id: 'N2', title: '任务 TSK-20261019-1021 已完成', desc: '华东1-新加坡 订单库增量同步，共 1.2 TB，耗时 42 分钟。', time: '26 分钟前', read: false, type: 'task' },
  { id: 'N3', title: '节点 fra-edge-03 心跳超时', desc: '已失联 428 分钟，请检查机房网络。', time: '1 小时前', read: false, type: 'alert' },
  { id: 'N4', title: '本月节省成本 ¥12,480', desc: '压缩与去重策略共节省 3.6 TB 流量。', time: '3 小时前', read: true, type: 'system' },
  { id: 'N5', title: '策略「弱网边缘回传」已停用', desc: '由 林清 操作，影响 0 个任务。', time: '昨天', read: true, type: 'system' },
];

interface AppState {
  collapsed: boolean;
  toggleCollapsed: () => void;
  notifications: AppNotification[];
  markAllRead: () => void;
  unreadCount: () => number;
}

export const useAppStore = create<AppState>((set, get) => ({
  collapsed: localStorage.getItem(COLLAPSE_KEY) === '1',
  toggleCollapsed: () =>
    set((state) => {
      const next = !state.collapsed;
      localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      return { collapsed: next };
    }),
  notifications: seedNotifications,
  markAllRead: () => set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) })),
  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
