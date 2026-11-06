import { db, addAlarmHandling, addDevice, addTaskComment, reviewCalibration, updateCalibrationProgress, updateServiceOrder, updateTaskStatus } from '../mock/db';
import type {
  Alarm,
  CalibrationPlan,
  CalibrationResult,
  CalibrationTask,
  DataFile,
  Device,
  HealthRecord,
  KnowledgeArticle,
  Paged,
  Report,
  ServiceOrder,
  Station,
  User,
  WorkTask,
} from '../types/models';
import dayjs from 'dayjs';

const wait = (ms = 260) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = <T>(value: T): T => structuredClone(value);

function paginate<T>(list: T[], page = 1, pageSize = 10): Paged<T> {
  const start = (page - 1) * pageSize;
  return { list: clone(list.slice(start, start + pageSize)), total: list.length, page, pageSize };
}

export const authService = {
  async login(account: string, password: string): Promise<User> {
    await wait(320);
    if (password !== '123456') throw new Error('账号或密码不正确');
    const user = db.users.find((u) => u.account === account);
    if (!user) throw new Error('账号或密码不正确');
    if (user.status === 'DISABLED') throw new Error('该账号已被禁用，请联系管理员');
    return clone(user);
  },
};

export const dashboardService = {
  async overview() {
    await wait(200);
    const total = db.devices.length;
    const online = db.devices.filter((d) => d.status === 'IN_USE' || d.status === 'CALIBRATING').length;
    const calibrating = db.devices.filter((d) => d.status === 'CALIBRATING').length;
    const openAlarms = db.alarms.filter((a) => a.status !== 'CLOSED').length;
    const completed = db.calibrationTasks.filter((t) => t.status === 'COMPLETED');
    const passRate = completed.length ? (completed.filter((t) => t.conclusion === 'PASS').length / completed.length) * 100 : 0;

    return clone({
      metric: {
        online,
        total,
        calibrating,
        todayHours: 18.6,
        monthCompletion: 86.2,
        passRate: Number(passRate.toFixed(1)),
        openAlarms,
      },
      statusDistribution: (['IN_USE', 'IDLE', 'CALIBRATING', 'REPAIRING', 'RETIRED'] as const).map((status) => ({
        status,
        count: db.devices.filter((d) => d.status === status).length,
      })),
      trend: Array.from({ length: 30 }, (_, i) => {
        const day = dayjs('2026-10-19').subtract(29 - i, 'day');
        const count = db.calibrationTasks.filter((t) => dayjs(t.plannedStart).isSame(day, 'day')).length || ((i * 7) % 5) + 2;
        return {
          date: day.format('MM-DD'),
          count,
          rate: Number((88 + Math.sin(i / 3) * 4 + (i % 4)).toFixed(1)),
        };
      }),
      healthTop: clone([...db.devices].sort((a, b) => b.healthScore - a.healthScore).slice(0, 5)),
      healthBottom: clone([...db.devices].sort((a, b) => a.healthScore - b.healthScore).slice(0, 5)),
      alarms: clone(db.alarms.filter((a) => a.status !== 'CLOSED').slice(0, 8)),
      todayTasks: clone(
        db.workTasks
          .filter((t) => t.status === 'DOING' || t.status === 'TODO')
          .sort((a, b) => dayjs(a.plannedStart).valueOf() - dayjs(b.plannedStart).valueOf())
          .slice(0, 5),
      ),
    });
  },
};

export interface DeviceQuery {
  keyword?: string;
  types?: string[];
  statuses?: string[];
  vendor?: string;
  stationId?: string;
  calibFilter?: 'all' | 'soon' | 'expired';
  page?: number;
  pageSize?: number;
}

export const deviceService = {
  async list(query: DeviceQuery = {}): Promise<Paged<Device>> {
    await wait(300);
    let list = [...db.devices];
    if (query.keyword) {
      const kw = query.keyword.trim().toUpperCase();
      list = list.filter((d) => d.code.toUpperCase().includes(kw) || d.name.includes(query.keyword!) || d.model.toUpperCase().includes(kw));
    }
    if (query.types?.length) list = list.filter((d) => query.types!.includes(d.type));
    if (query.statuses?.length) list = list.filter((d) => query.statuses!.includes(d.status));
    if (query.vendor) list = list.filter((d) => d.vendor === query.vendor);
    if (query.stationId) list = list.filter((d) => d.stationId === query.stationId);
    if (query.calibFilter === 'soon') {
      list = list.filter((d) => {
        const days = dayjs(d.calibrationValidUntil).diff(dayjs('2026-10-19'), 'day');
        return days >= 0 && days <= 30;
      });
    }
    if (query.calibFilter === 'expired') {
      list = list.filter((d) => dayjs(d.calibrationValidUntil).isBefore(dayjs('2026-10-19')));
    }
    return paginate(list, query.page, query.pageSize);
  },

  async all(): Promise<Device[]> {
    await wait(120);
    return clone(db.devices);
  },

  async detail(id: string): Promise<Device | undefined> {
    await wait(220);
    const device = db.devices.find((d) => d.id === id);
    return device ? clone(device) : undefined;
  },

  async create(payload: Partial<Device>): Promise<Device> {
    await wait(420);
    const seq = String(db.devices.length + 1).padStart(4, '0');
    const device: Device = {
      id: `DEV-${seq}`,
      code: payload.code ?? `IMU-2026-${seq}`,
      name: payload.name ?? '光纤陀螺惯性测量单元',
      type: payload.type ?? 'FOG_IMU',
      model: payload.model ?? 'HG-200A',
      vendor: payload.vendor ?? '北辰惯性技术有限公司',
      serialNo: payload.serialNo ?? `SN2026${Math.floor(Math.random() * 900000 + 100000)}`,
      grade: payload.grade ?? 'A',
      status: 'IN_USE',
      owner: payload.owner ?? '张启明',
      manufacturedAt: payload.manufacturedAt ?? '2026-09-01',
      inServiceAt: payload.inServiceAt ?? '2026-10-01',
      calibratedAt: '2026-10-01',
      calibrationValidUntil: '2027-09-30',
      healthScore: 95,
      healthLevel: 'EXCELLENT',
      specs: payload.specs ?? {
        gyroRange: 300,
        gyroBiasStability: 0.032,
        gyroBiasRepeatability: 0.021,
        gyroScaleNonlinearity: 42,
        arw: 0.018,
        accRange: 10,
        accBias: 0.48,
        accScaleNonlinearity: 60,
        vrw: 0.021,
        bandwidth: 100,
        outputRate: 200,
        tempRange: [-40, 70],
        voltage: 28,
        power: 12,
        weight: 1.8,
        dimensions: '120×110×95 mm',
      },
      channels: payload.channels ?? [],
      tags: ['新入库'],
    };
    return clone(addDevice(device));
  },

  async updateStatus(id: string, status: Device['status']): Promise<void> {
    await wait(240);
    const device = db.devices.find((d) => d.id === id);
    if (device) device.status = status;
  },

  async vendors(): Promise<string[]> {
    await wait(60);
    return Array.from(new Set(db.devices.map((d) => d.vendor)));
  },
};

export const stationService = {
  async list(): Promise<Station[]> {
    await wait(200);
    return clone(db.stations);
  },
};

export const planService = {
  async list(): Promise<CalibrationPlan[]> {
    await wait(120);
    return clone(db.plans);
  },
};

export interface CalibrationQuery {
  keyword?: string;
  statuses?: string[];
  planId?: string;
  operator?: string;
  page?: number;
  pageSize?: number;
}

export const calibrationService = {
  async list(query: CalibrationQuery = {}): Promise<Paged<CalibrationTask>> {
    await wait(300);
    let list = [...db.calibrationTasks].sort((a, b) => dayjs(b.plannedStart).valueOf() - dayjs(a.plannedStart).valueOf());
    if (query.keyword) {
      const kw = query.keyword.trim().toUpperCase();
      list = list.filter((t) => t.code.toUpperCase().includes(kw) || t.deviceCode.toUpperCase().includes(kw));
    }
    if (query.statuses?.length) list = list.filter((t) => query.statuses!.includes(t.status));
    if (query.planId) list = list.filter((t) => t.planId === query.planId);
    if (query.operator) list = list.filter((t) => t.operator === query.operator);
    return paginate(list, query.page, query.pageSize);
  },

  async detail(id: string): Promise<CalibrationTask | undefined> {
    await wait(200);
    const task = db.calibrationTasks.find((t) => t.id === id);
    return task ? clone(task) : undefined;
  },

  async resultOf(taskId: string): Promise<CalibrationResult | undefined> {
    await wait(220);
    const task = db.calibrationTasks.find((t) => t.id === taskId);
    const result = db.results.find((r) => r.taskId === taskId) ?? db.results.find((r) => r.id === task?.resultId);
    return result ? clone(result) : undefined;
  },

  async resultsOfDevice(deviceId: string): Promise<CalibrationResult[]> {
    await wait(160);
    const taskIds = db.calibrationTasks.filter((t) => t.deviceId === deviceId).map((t) => t.id);
    return clone(db.results.filter((r) => taskIds.includes(r.taskId)));
  },

  async tasksOfDevice(deviceId: string): Promise<CalibrationTask[]> {
    await wait(180);
    return clone(
      db.calibrationTasks
        .filter((t) => t.deviceId === deviceId)
        .sort((a, b) => dayjs(b.plannedStart).valueOf() - dayjs(a.plannedStart).valueOf()),
    );
  },

  async advance(id: string, progress: number, positionIndex?: number): Promise<CalibrationTask | undefined> {
    await wait(220);
    const task = updateCalibrationProgress(id, progress, positionIndex);
    return task ? clone(task) : undefined;
  },

  async review(id: string, passed: boolean): Promise<void> {
    await wait(300);
    reviewCalibration(id, passed);
  },

  async create(payload: {
    deviceId: string;
    planId: string;
    stationId: string;
    operator: string;
    reviewer: string;
    plannedStart?: string;
    remark?: string;
  }): Promise<CalibrationTask> {
    await wait(420);
    const device = db.devices.find((d) => d.id === payload.deviceId) ?? db.devices[0];
    const plan = db.plans.find((p) => p.id === payload.planId) ?? db.plans[0];
    const station = db.stations.find((s) => s.id === payload.stationId) ?? db.stations[0];
    const seq = db.calibrationTasks.length + 181;
    const task: CalibrationTask = {
      id: `CT-${String(db.calibrationTasks.length + 1).padStart(4, '0')}`,
      code: `CAL-2026-${String(seq).padStart(4, '0')}`,
      deviceId: device.id,
      deviceCode: device.code,
      deviceModel: device.model,
      planId: plan.id,
      planName: plan.name,
      stationId: station.id,
      stationName: station.name,
      tempPoints: plan.tempPoints ?? [20],
      operator: payload.operator,
      reviewer: payload.reviewer,
      plannedStart: payload.plannedStart ?? '2026-10-20 09:00:00',
      plannedEnd: '2026-10-20 10:00:00',
      actualStart: '2026-10-19 10:27:26',
      progress: 0,
      status: 'RUNNING',
      conclusion: 'PENDING',
      positions: plan.positions.map((p, index) => ({
        index: p.index,
        label: p.label,
        status: index === 0 ? 'RUNNING' : 'PENDING',
        duration: 0,
        stability: 0,
      })),
      remark: payload.remark,
    };
    db.calibrationTasks.unshift(task);
    return clone(task);
  },
};

export interface FileQuery {
  keyword?: string;
  deviceId?: string;
  page?: number;
  pageSize?: number;
}

export const dataFileService = {
  async list(query: FileQuery = {}): Promise<Paged<DataFile>> {
    await wait(280);
    let list = [...db.dataFiles].sort((a, b) => dayjs(b.startedAt).valueOf() - dayjs(a.startedAt).valueOf());
    if (query.keyword) {
      const kw = query.keyword.trim().toUpperCase();
      list = list.filter((f) => f.code.toUpperCase().includes(kw) || f.deviceCode.toUpperCase().includes(kw));
    }
    if (query.deviceId) list = list.filter((f) => f.deviceId === query.deviceId);
    return paginate(list, query.page, query.pageSize);
  },

  async all(): Promise<DataFile[]> {
    await wait(140);
    return clone(db.dataFiles);
  },

  async detail(id: string): Promise<DataFile | undefined> {
    await wait(160);
    const file = db.dataFiles.find((f) => f.id === id);
    return file ? clone(file) : undefined;
  },
};

export interface AlarmQuery {
  levels?: string[];
  statuses?: string[];
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export const alarmService = {
  async list(query: AlarmQuery = {}): Promise<Paged<Alarm>> {
    await wait(280);
    let list = [...db.alarms].sort((a, b) => dayjs(b.triggeredAt).valueOf() - dayjs(a.triggeredAt).valueOf());
    if (query.levels?.length) list = list.filter((a) => query.levels!.includes(a.level));
    if (query.statuses?.length) list = list.filter((a) => query.statuses!.includes(a.status));
    if (query.keyword) {
      const kw = query.keyword.trim();
      list = list.filter((a) => a.title.includes(kw) || a.deviceCode.includes(kw) || a.code.includes(kw));
    }
    return paginate(list, query.page, query.pageSize);
  },

  async stats() {
    await wait(150);
    const open = db.alarms.filter((a) => a.status === 'OPEN').length;
    const processing = db.alarms.filter((a) => a.status === 'PROCESSING').length;
    const today = db.alarms.filter((a) => dayjs(a.triggeredAt).isSame(dayjs('2026-10-19'), 'day')).length;
    return { open, processing, today, avgCloseHours: 6.4 };
  },

  async handle(id: string, status: Alarm['status'], handling?: string): Promise<void> {
    await wait(320);
    addAlarmHandling(id, status, handling, '张启明');
  },
};

export const workTaskService = {
  async list(status?: string): Promise<WorkTask[]> {
    await wait(260);
    let list = [...db.workTasks].sort((a, b) => dayjs(b.plannedStart).valueOf() - dayjs(a.plannedStart).valueOf());
    if (status) list = list.filter((t) => t.status === status);
    return clone(list);
  },

  async detail(id: string): Promise<WorkTask | undefined> {
    await wait(180);
    const task = db.workTasks.find((t) => t.id === id);
    return task ? clone(task) : undefined;
  },

  async setStatus(id: string, status: WorkTask['status']): Promise<void> {
    await wait(260);
    updateTaskStatus(id, status);
  },

  async comment(id: string, content: string): Promise<void> {
    await wait(220);
    addTaskComment(id, content);
  },
};

export const reportService = {
  async list(): Promise<Report[]> {
    await wait(240);
    return clone([...db.reports].sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()));
  },

  async detail(id: string): Promise<Report | undefined> {
    await wait(180);
    const report = db.reports.find((r) => r.id === id);
    return report ? clone(report) : undefined;
  },
};

export const serviceOrderService = {
  async list(): Promise<ServiceOrder[]> {
    await wait(240);
    return clone([...db.serviceOrders].sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()));
  },

  async update(id: string, patch: Partial<ServiceOrder>): Promise<void> {
    await wait(260);
    updateServiceOrder(id, patch);
  },
};

export const knowledgeService = {
  async list(): Promise<KnowledgeArticle[]> {
    await wait(200);
    return clone([...db.articles].sort((a, b) => b.views - a.views));
  },
};

export const healthService = {
  async detail(deviceId: string): Promise<{ records: HealthRecord[]; device?: Device }> {
    await wait(260);
    const records = db.healthRecords.filter((r) => r.deviceId === deviceId).sort((a, b) => a.date.localeCompare(b.date));
    const device = db.devices.find((d) => d.id === deviceId);
    return clone({ records, device });
  },
};

export const systemService = {
  async users(): Promise<User[]> {
    await wait(180);
    return clone(db.users);
  },

  async auditLogs(): Promise<typeof db.auditLogs> {
    await wait(220);
    return clone([...db.auditLogs].sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()).slice(0, 80));
  },
};
