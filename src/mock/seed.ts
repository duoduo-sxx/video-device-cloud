import dayjs from 'dayjs';
import { Rng } from '../utils/random';
import { healthLevelOf } from '../constants/dict';
import type {
  Alarm,
  AuditLog,
  CalibrationPlan,
  CalibrationResult,
  CalibrationTask,
  DataFile,
  Device,
  DeviceSpecs,
  DeviceType,
  HealthRecord,
  KnowledgeArticle,
  Report,
  ServiceOrder,
  Station,
  User,
  WorkTask,
} from '../types/models';

const NOW = dayjs('2026-10-19 10:27:26');
const rng = new Rng(20261019);
const ts = (d: dayjs.Dayjs) => d.format('YYYY-MM-DD HH:mm:ss');
const dt = (s: string) => dayjs(s);
/** 保留指定位数小数，返回数值而非字符串 */
const round = (v: number, digits = 2) => Number(v.toFixed(digits));

const VENDORS = [
  '北辰惯性技术有限公司',
  '华航天元传感技术研究院',
  '中科感知微系统',
  '恒锐精密仪器',
  '星舆导航',
];

const PEOPLE = ['张启明', '李慧', '王振国', '陈立', '赵敏', '周文博', '孙倩', '吴凯', '郑海涛', '冯雪'];

const TYPE_MODEL: Record<string, { model: string; name: string; vendor: string }[]> = {
  FOG_IMU: [
    { model: 'HG-200A', name: '光纤陀螺惯性测量单元', vendor: VENDORS[0] },
    { model: 'HG-300B', name: '高精度光纤陀螺惯测单元', vendor: VENDORS[0] },
  ],
  MEMS_IMU: [
    { model: 'MP-30', name: 'MEMS 惯性测量单元', vendor: VENDORS[2] },
    { model: 'MP-50', name: '低成本 MEMS 惯测单元', vendor: VENDORS[2] },
  ],
  DTG: [{ model: 'DT-15', name: '动力调谐陀螺', vendor: VENDORS[1] }],
  ACC_SET: [{ model: 'JA-10', name: '三轴加速度计组件', vendor: VENDORS[3] }],
  GNSS_INS: [{ model: 'NS-500', name: '组合导航系统', vendor: VENDORS[4] }],
  MAG: [{ model: 'FM-3', name: '三轴磁强计', vendor: VENDORS[1] }],
};

const CODE_PREFIX: Record<string, string> = {
  FOG_IMU: 'IMU',
  MEMS_IMU: 'IMU',
  DTG: 'GY',
  ACC_SET: 'ACC',
  GNSS_INS: 'INS',
  MAG: 'MAG',
};

function specsOf(type: DeviceType): DeviceSpecs {
  if (type === 'FOG_IMU') {
    return {
      gyroRange: 300,
      gyroBiasStability: Number(rng.float(0.012, 0.048).toFixed(4)),
      gyroBiasRepeatability: Number(rng.float(0.008, 0.03).toFixed(4)),
      gyroScaleNonlinearity: rng.int(30, 48),
      arw: Number(rng.float(0.008, 0.022).toFixed(4)),
      accRange: 10,
      accBias: Number(rng.float(0.2, 0.8).toFixed(2)),
      accScaleNonlinearity: rng.int(40, 90),
      vrw: Number(rng.float(0.01, 0.03).toFixed(3)),
      bandwidth: 100,
      outputRate: rng.pick([100, 200, 400]),
      tempRange: [-40, 70],
      voltage: 28,
      power: Number(rng.float(9, 15).toFixed(1)),
      weight: Number(rng.float(1.6, 2.4).toFixed(1)),
      dimensions: '120×110×95 mm',
    };
  }
  if (type === 'MEMS_IMU') {
    return {
      gyroRange: 500,
      gyroBiasStability: Number(rng.float(0.05, 0.12).toFixed(4)),
      gyroBiasRepeatability: Number(rng.float(0.04, 0.09).toFixed(4)),
      gyroScaleNonlinearity: rng.int(50, 80),
      arw: Number(rng.float(0.03, 0.06).toFixed(4)),
      accRange: 20,
      accBias: Number(rng.float(0.6, 1.5).toFixed(2)),
      accScaleNonlinearity: rng.int(80, 150),
      vrw: Number(rng.float(0.03, 0.06).toFixed(3)),
      bandwidth: 100,
      outputRate: rng.pick([100, 200]),
      tempRange: [-40, 85],
      voltage: 12,
      power: Number(rng.float(1.2, 3.5).toFixed(1)),
      weight: Number(rng.float(0.2, 0.6).toFixed(2)),
      dimensions: '48×42×22 mm',
    };
  }
  if (type === 'GNSS_INS') {
    return {
      gyroRange: 300,
      gyroBiasStability: Number(rng.float(0.015, 0.03).toFixed(4)),
      gyroBiasRepeatability: Number(rng.float(0.01, 0.022).toFixed(4)),
      gyroScaleNonlinearity: rng.int(25, 40),
      arw: Number(rng.float(0.01, 0.018).toFixed(4)),
      accRange: 10,
      accBias: Number(rng.float(0.2, 0.6).toFixed(2)),
      accScaleNonlinearity: rng.int(35, 70),
      vrw: Number(rng.float(0.008, 0.02).toFixed(3)),
      bandwidth: 100,
      outputRate: 200,
      tempRange: [-40, 70],
      voltage: 28,
      power: Number(rng.float(10, 18).toFixed(1)),
      weight: Number(rng.float(2.2, 3.4).toFixed(1)),
      dimensions: '160×140×110 mm',
    };
  }
  if (type === 'DTG') {
    return {
      gyroRange: 200,
      gyroBiasStability: Number(rng.float(0.06, 0.15).toFixed(4)),
      gyroBiasRepeatability: Number(rng.float(0.05, 0.1).toFixed(4)),
      gyroScaleNonlinearity: rng.int(45, 75),
      arw: Number(rng.float(0.04, 0.07).toFixed(4)),
      accRange: 10,
      accBias: Number(rng.float(0.4, 1.1).toFixed(2)),
      accScaleNonlinearity: rng.int(60, 110),
      vrw: Number(rng.float(0.02, 0.05).toFixed(3)),
      bandwidth: 80,
      outputRate: 100,
      tempRange: [-40, 65],
      voltage: 26,
      power: Number(rng.float(6, 10).toFixed(1)),
      weight: Number(rng.float(1.2, 1.9).toFixed(1)),
      dimensions: 'Ø98×110 mm',
    };
  }
  if (type === 'ACC_SET') {
    return {
      gyroRange: 0,
      gyroBiasStability: 0,
      gyroBiasRepeatability: 0,
      gyroScaleNonlinearity: 0,
      arw: 0,
      accRange: 20,
      accBias: Number(rng.float(0.15, 0.45).toFixed(2)),
      accScaleNonlinearity: rng.int(30, 60),
      vrw: Number(rng.float(0.006, 0.015).toFixed(3)),
      bandwidth: 200,
      outputRate: 400,
      tempRange: [-45, 85],
      voltage: 15,
      power: Number(rng.float(0.8, 2.0).toFixed(1)),
      weight: Number(rng.float(0.15, 0.35).toFixed(2)),
      dimensions: '56×44×30 mm',
    };
  }
  return {
    gyroRange: 0,
    gyroBiasStability: 0,
    gyroBiasRepeatability: 0,
    gyroScaleNonlinearity: 0,
    arw: 0,
    accRange: 0,
    accBias: 0,
    accScaleNonlinearity: 0,
    vrw: 0,
    bandwidth: 50,
    outputRate: 100,
    tempRange: [-40, 85],
    voltage: 12,
    power: 0.6,
    weight: 0.09,
    dimensions: '32×28×12 mm',
  };
}

function channelsOf(type: DeviceType, rate: number) {
  const list = [
    { id: 'gx', name: 'Gx', type: 'gyro' as const, axis: 'X' as const, unit: '°/s', range: 300, polarity: 1 as const, sampleRate: rate },
    { id: 'gy', name: 'Gy', type: 'gyro' as const, axis: 'Y' as const, unit: '°/s', range: 300, polarity: 1 as const, sampleRate: rate },
    { id: 'gz', name: 'Gz', type: 'gyro' as const, axis: 'Z' as const, unit: '°/s', range: 300, polarity: 1 as const, sampleRate: rate },
    { id: 'ax', name: 'Ax', type: 'acc' as const, axis: 'X' as const, unit: 'g', range: 10, polarity: 1 as const, sampleRate: rate },
    { id: 'ay', name: 'Ay', type: 'acc' as const, axis: 'Y' as const, unit: 'g', range: 10, polarity: 1 as const, sampleRate: rate },
    { id: 'az', name: 'Az', type: 'acc' as const, axis: 'Z' as const, unit: 'g', range: 10, polarity: 1 as const, sampleRate: rate },
    { id: 't1', name: 'T1', type: 'temp' as const, axis: '-' as const, unit: '℃', range: 125, polarity: 1 as const, sampleRate: 10 },
    { id: 't2', name: 'T2', type: 'temp' as const, axis: '-' as const, unit: '℃', range: 125, polarity: 1 as const, sampleRate: 10 },
  ];
  if (type === 'ACC_SET') return list.filter((c) => c.type !== 'gyro');
  if (type === 'MAG') {
    return [
      { id: 'mx', name: 'Mx', type: 'mag' as const, axis: 'X' as const, unit: 'mG', range: 800, polarity: 1 as const, sampleRate: rate },
      { id: 'my', name: 'My', type: 'mag' as const, axis: 'Y' as const, unit: 'mG', range: 800, polarity: 1 as const, sampleRate: rate },
      { id: 'mz', name: 'Mz', type: 'mag' as const, axis: 'Z' as const, unit: 'mG', range: 800, polarity: 1 as const, sampleRate: rate },
    ];
  }
  return list;
}

function buildStations(): Station[] {
  const defs: Omit<Station, 'currentDeviceId' | 'currentDeviceCode'>[] = [
    { id: 'ST-01', code: 'T-01', name: '静基座工位一', type: 'FIXTURE', accuracy: '水平度 ≤ 5″', status: 'BUSY', lastCalibratedAt: '2026-04-12 09:00:00', validUntil: '2027-04-11', utilization: 0.72 },
    { id: 'ST-02', code: 'T-02', name: '静基座工位二', type: 'FIXTURE', accuracy: '水平度 ≤ 5″', status: 'BUSY', lastCalibratedAt: '2026-03-28 09:00:00', validUntil: '2027-03-27', utilization: 0.64 },
    { id: 'ST-03', code: 'T-03', name: '静基座工位三', type: 'FIXTURE', accuracy: '水平度 ≤ 8″', status: 'IDLE', lastCalibratedAt: '2026-06-05 09:00:00', validUntil: '2027-06-04', utilization: 0.41 },
    { id: 'ST-04', code: 'T-04', name: '静基座工位四', type: 'FIXTURE', accuracy: '水平度 ≤ 8″', status: 'IDLE', lastCalibratedAt: '2026-06-05 09:00:00', validUntil: '2027-06-04', utilization: 0.35 },
    { id: 'ST-05', code: 'RT-01', name: '双轴位置速率转台', type: 'TURNTABLE', accuracy: '±2″ / ±0.001 °/s', status: 'BUSY', lastCalibratedAt: '2026-07-18 09:00:00', validUntil: '2027-07-17', utilization: 0.86 },
    { id: 'ST-06', code: 'RT-02', name: '双轴位置速率转台', type: 'TURNTABLE', accuracy: '±3″ / ±0.002 °/s', status: 'BUSY', lastCalibratedAt: '2026-02-11 09:00:00', validUntil: '2027-02-10', utilization: 0.79 },
    { id: 'ST-07', code: 'W-01', name: '高低温试验箱', type: 'TEMP_CHAMBER', accuracy: '±0.5 ℃（−55~125 ℃）', status: 'BUSY', lastCalibratedAt: '2026-05-22 09:00:00', validUntil: '2027-05-21', utilization: 0.68 },
    { id: 'ST-08', code: 'W-02', name: '高低温试验箱', type: 'TEMP_CHAMBER', accuracy: '±0.8 ℃（−40~150 ℃）', status: 'IDLE', lastCalibratedAt: '2026-08-09 09:00:00', validUntil: '2027-08-08', utilization: 0.52 },
  ];
  return defs.map((d) => ({ ...d }));
}

function buildDevices(stations: Station[]): Device[] {
  const typePlan: DeviceType[] = [];
  for (let i = 0; i < 16; i += 1) typePlan.push('FOG_IMU');
  for (let i = 0; i < 12; i += 1) typePlan.push('MEMS_IMU');
  for (let i = 0; i < 6; i += 1) typePlan.push('GNSS_INS');
  for (let i = 0; i < 5; i += 1) typePlan.push('ACC_SET');
  for (let i = 0; i < 4; i += 1) typePlan.push('DTG');
  for (let i = 0; i < 3; i += 1) typePlan.push('MAG');
  for (let i = 0; i < 2; i += 1) typePlan.push('FOG_IMU');

  const statusPlan: Device['status'][] = [
    ...Array(30).fill('IN_USE'),
    ...Array(5).fill('CALIBRATING'),
    ...Array(4).fill('REPAIRING'),
    ...Array(7).fill('IDLE'),
    ...Array(2).fill('RETIRED'),
  ];

  const devices: Device[] = typePlan.map((type, index) => {
    const meta = TYPE_MODEL[type][index % TYPE_MODEL[type].length];
    const specs = specsOf(type);
    const year = rng.int(2021, 2025);
    const seq = String(index + 1).padStart(4, '0');
    const manufactured = NOW.subtract(rng.int(200, 1400), 'day');
    const inService = manufactured.add(rng.int(10, 90), 'day');
    const calibratedAt = NOW.subtract(rng.int(20, 430), 'day');
    const validUntil = calibratedAt.add(365, 'day');
    const status = statusPlan[index];

    let healthScore = 96 - specs.gyroBiasStability * 190 - specs.arw * 90 - rng.float(0, 6);
    if (validUntil.isBefore(NOW)) healthScore -= 9;
    if (status === 'REPAIRING') healthScore -= 22;
    if (status === 'RETIRED') healthScore -= 30;
    healthScore = Math.max(41, Math.min(99, Math.round(healthScore)));

    return {
      id: `DEV-${seq}`,
      code: `${CODE_PREFIX[type]}-${year}-${seq}`,
      name: meta.name,
      type,
      model: meta.model,
      vendor: meta.vendor,
      serialNo: `SN${year}${String(rng.int(100000, 999999))}`,
      grade: type === 'MEMS_IMU' ? 'B' : type === 'DTG' ? 'B' : 'A',
      status,
      owner: rng.pick(PEOPLE),
      manufacturedAt: manufactured.format('YYYY-MM-DD'),
      inServiceAt: inService.format('YYYY-MM-DD'),
      calibratedAt: calibratedAt.format('YYYY-MM-DD'),
      calibrationValidUntil: validUntil.format('YYYY-MM-DD'),
      healthScore,
      healthLevel: healthLevelOf(healthScore),
      specs,
      channels: channelsOf(type, specs.outputRate),
      tags: rng.bool(0.35) ? ['批产', '重点型号'] : rng.bool(0.5) ? ['批产'] : ['科研'],
      remark: rng.bool(0.25) ? '用于高精度姿态解算验证，标定周期按 12 个月执行。' : undefined,
    } satisfies Device;
  });

  const calibrating = devices.filter((d) => d.status === 'CALIBRATING');
  const inUse = devices.filter((d) => d.status === 'IN_USE');
  const bindings: [Station, Device][] = [
    [stations[0], inUse[0]],
    [stations[1], inUse[1]],
    [stations[2], inUse[2]],
    [stations[3], inUse[3]],
    [stations[4], calibrating[0]],
    [stations[5], calibrating[1]],
    [stations[6], calibrating[2]],
    [stations[7], calibrating[3]],
  ];
  bindings.forEach(([station, device]) => {
    if (!device) return;
    station.currentDeviceId = device.id;
    station.currentDeviceCode = device.code;
    station.status = 'BUSY';
    device.stationId = station.id;
    device.stationName = station.name;
  });

  return devices;
}

function buildPlans(): CalibrationPlan[] {
  return [
    {
      id: 'PLAN-01',
      name: '六位置静态标定法',
      method: 'SIX_POSITION',
      applicableTypes: ['FOG_IMU', 'MEMS_IMU', 'GNSS_INS', 'DTG'],
      positions: ['+X', '−X', '+Y', '−Y', '+Z', '−Z'].map((label, index) => ({ index: index + 1, label })),
      dwellSeconds: 60,
      sampleWindowSeconds: 30,
      stabilityThreshold: 0.02,
      estimatedMinutes: 48,
      description: '依次将器件置于 ±X、±Y、±Z 六个位置，每个位置静止采集 60 s，利用重力矢量分离三轴零偏与标度因数。',
    },
    {
      id: 'PLAN-02',
      name: '二十四位置标定法',
      method: 'TWENTY_FOUR_POSITION',
      applicableTypes: ['FOG_IMU', 'GNSS_INS'],
      positions: Array.from({ length: 24 }, (_, i) => ({
        index: i + 1,
        label: `P${String(i + 1).padStart(2, '0')}`,
        note: ['±X', '±Y', '±Z'][i % 3] + ['+45°', '−45°', '+135°'][Math.floor(i / 3) % 3],
      })),
      dwellSeconds: 45,
      sampleWindowSeconds: 25,
      stabilityThreshold: 0.015,
      estimatedMinutes: 165,
      description: '在六位置基础上增加 45°/135° 倾斜位置，可同时辨识安装误差、非正交误差与 g 敏感系数，适用于高精度器件。',
    },
    {
      id: 'PLAN-03',
      name: '速率试验标定法',
      method: 'RATE',
      applicableTypes: ['FOG_IMU', 'MEMS_IMU', 'DTG', 'GNSS_INS'],
      positions: [1, 5, 10, 20, 50, -1, -5, -10, -20, -50].map((rate, index) => ({
        index: index + 1,
        label: `${rate > 0 ? '+' : ''}${rate} °/s`,
        note: rate > 0 ? '正转' : '反转',
      })),
      dwellSeconds: 30,
      sampleWindowSeconds: 20,
      stabilityThreshold: 0.03,
      estimatedMinutes: 62,
      description: '由转台依次提供 ±1、±5、±10、±20、±50 °/s 角速率激励，辨识标度因数、非线性度与不对称性。',
    },
    {
      id: 'PLAN-04',
      name: '温度循环标定法',
      method: 'TEMP_CYCLE',
      applicableTypes: ['FOG_IMU', 'MEMS_IMU', 'ACC_SET'],
      positions: [-40, -20, 0, 20, 40, 60, 70].map((t, index) => ({
        index: index + 1,
        label: `${t} ℃`,
        note: '保温 2 h 后六位置采集',
      })),
      dwellSeconds: 120,
      sampleWindowSeconds: 60,
      stabilityThreshold: 0.025,
      tempPoints: [-40, -20, 0, 20, 40, 60, 70],
      estimatedMinutes: 420,
      description: '在 −40 ℃ 至 +70 ℃ 范围内取 7 个温度点，每点保温 2 h 后执行六位置采集，拟合零偏与标度因数温度系数。',
    },
    {
      id: 'PLAN-05',
      name: '快速标定法',
      method: 'QUICK',
      applicableTypes: ['MEMS_IMU', 'ACC_SET'],
      positions: ['水平', '倒置', '侧立'].map((label, index) => ({ index: index + 1, label })),
      dwellSeconds: 30,
      sampleWindowSeconds: 20,
      stabilityThreshold: 0.05,
      estimatedMinutes: 18,
      description: '三点快速标定，用于产线抽样复核与现场快速校准，精度低于六位置法但耗时可缩短至 20 min 以内。',
    },
  ];
}

function buildCalibrationTasks(devices: Device[], plans: CalibrationPlan[], stations: Station[]) {
  const tasks: CalibrationTask[] = [];
  const statuses: CalibrationTask['status'][] = [
    ...Array(8).fill('RUNNING'),
    ...Array(26).fill('COMPLETED'),
    ...Array(4).fill('REVIEWING'),
    ...Array(4).fill('FAILED'),
  ];
  const calibDevices = devices.filter((d) => d.status !== 'RETIRED');

  for (let i = 0; i < 42; i += 1) {
    const device = calibDevices[(i * 3 + 1) % calibDevices.length];
    const plan = plans[i % plans.length];
    const status = statuses[i];
    const start = NOW.subtract(rng.int(0, 260), 'day').subtract(rng.int(0, 600), 'minute');
    const durationMin = plan.estimatedMinutes;
    const progress = status === 'COMPLETED' || status === 'FAILED' ? 100 : status === 'REVIEWING' ? 100 : rng.int(18, 78);
    const doneCount = Math.min(plan.positions.length, Math.round((progress / 100) * plan.positions.length));

    tasks.push({
      id: `CT-${String(i + 1).padStart(4, '0')}`,
      code: `CAL-2026-${String(180 + i).padStart(4, '0')}`,
      deviceId: device.id,
      deviceCode: device.code,
      deviceModel: device.model,
      planId: plan.id,
      planName: plan.name,
      stationId: plan.method === 'TEMP_CYCLE' ? stations[6].id : stations[4].id,
      stationName: plan.method === 'TEMP_CYCLE' ? stations[6].name : stations[4].name,
      tempPoints: plan.tempPoints ?? [20],
      operator: rng.pick(PEOPLE.slice(0, 4)),
      reviewer: rng.pick(PEOPLE.slice(4, 7)),
      plannedStart: ts(start),
      plannedEnd: ts(start.add(durationMin, 'minute')),
      actualStart: status === 'PENDING' ? undefined : ts(start.add(rng.int(-8, 12), 'minute')),
      actualEnd: progress === 100 ? ts(start.add(durationMin + rng.int(-6, 18), 'minute')) : undefined,
      progress,
      status,
      conclusion: status === 'COMPLETED' ? 'PASS' : status === 'FAILED' ? 'FAIL' : 'PENDING',
      positions: plan.positions.map((p, idx) => ({
        index: p.index,
        label: p.label,
        status: idx < doneCount ? 'DONE' : idx === doneCount && status === 'RUNNING' ? 'RUNNING' : 'PENDING',
        duration: idx < doneCount ? plan.dwellSeconds + rng.int(-3, 5) : 0,
        stability: idx < doneCount ? Number(rng.float(0.004, 0.019).toFixed(4)) : 0,
      })),
      resultId: progress === 100 && status !== 'REVIEWING' ? `CR-${String(i + 1).padStart(3, '0')}` : undefined,
      remark: status === 'FAILED' ? '第 4 位置稳定度持续超阈值，复测两次仍未收敛，判定本次标定无效。' : undefined,
    });
  }
  return tasks;
}

function buildResults(tasks: CalibrationTask[], devices: Device[]): CalibrationResult[] {
  const results: CalibrationResult[] = [];
  tasks.forEach((task) => {
    if (!task.resultId) return;
    const device = devices.find((d) => d.id === task.deviceId)!;
    const passed = task.conclusion === 'PASS';
    const factor = passed ? 1 : 1.9;
    results.push({
      id: task.resultId,
      taskId: task.id,
      biases: {
        x: round(rng.float(0.012, 0.038) * factor, 4),
        y: -round(rng.float(0.008, 0.03) * factor, 4),
        z: round(rng.float(0.01, 0.032) * factor, 4),
      },
      biasSigma: {
        x: round(rng.float(0.0032, 0.0052), 4),
        y: round(rng.float(0.003, 0.005), 4),
        z: round(rng.float(0.0035, 0.0058), 4),
      },
      scaleFactors: {
        x: round(rng.float(0.99962, 1.00042), 6),
        y: round(rng.float(0.99971, 1.00031), 6),
        z: round(rng.float(0.99968, 1.00038), 6),
      },
      nonlinearity: {
        x: rng.int(34, 48),
        y: rng.int(30, 44),
        z: rng.int(38, 52),
      },
      misalignmentArcsec: [
        [0, round(rng.float(28, 48), 1), -round(rng.float(14, 28), 1)],
        [-round(rng.float(26, 44), 1), 0, round(rng.float(12, 26), 1)],
        [round(rng.float(16, 30), 1), -round(rng.float(12, 24), 1), 0],
      ],
      tempCoeff: {
        x: round(rng.float(0.0012, 0.0026), 4),
        y: -round(rng.float(0.0008, 0.002), 4),
        z: round(rng.float(0.001, 0.0024), 4),
      },
      residual: {
        r2: round(rng.float(0.9962, 0.9993), 4),
        max: round(rng.float(0.0032, 0.0056), 4),
        rms: round(rng.float(0.0011, 0.0021), 4),
      },
      passed,
      createdAt: task.actualEnd ?? ts(NOW),
      operator: task.operator,
      reviewer: task.reviewer,
    });
  });
  return results;
}

function buildDataFiles(devices: Device[], tasks: CalibrationTask[]): DataFile[] {
  const files: DataFile[] = [];
  for (let i = 0; i < 120; i += 1) {
    const device = devices[i % devices.length];
    const task = i % 10 < 7 ? tasks[i % tasks.length] : undefined;
    const started = NOW.subtract(rng.int(0, 220), 'day').subtract(rng.int(0, 900), 'minute');
    const duration = rng.pick([300, 600, 900, 1800, 3600, 5400, 7200]);
    const sampleRate = device.specs.outputRate;
    const channels = device.channels.length;
    files.push({
      id: `DF-${String(i + 1).padStart(4, '0')}`,
      code: `RAW-${started.format('YYYYMMDD')}-${String(i + 1).padStart(4, '0')}`,
      deviceId: device.id,
      deviceCode: device.code,
      taskId: task?.id,
      startedAt: ts(started),
      duration,
      sampleRate,
      channels,
      sizeMB: Number(((duration * sampleRate * channels * 4) / 1024 / 1024).toFixed(1)),
      tags: rng.bool(0.4) ? ['标定原始数据'] : rng.bool(0.5) ? ['动态测试'] : ['静态采集'],
      events: [
        { t: Math.round(duration * 0.18), label: '开始采集', type: 'MARK' as const },
        { t: Math.round(duration * 0.52), label: '转台换向', type: 'MARK' as const },
        ...(rng.bool(0.3) ? [{ t: Math.round(duration * 0.77), label: '温度超限', type: 'ALARM' as const }] : []),
        { t: Math.round(duration * 0.96), label: '采集结束', type: 'MARK' as const },
      ],
      format: 'BIN',
    });
  }
  return files;
}

function buildAlarms(devices: Device[]): Alarm[] {
  const alarms: Alarm[] = [];
  const templates: { type: Alarm['type']; title: string; metric: string; unit: string; base: number; threshold: number }[] = [
    { type: 'BIAS_EXCEED', title: 'Z 轴零偏稳定性超限', metric: '零偏稳定性', unit: '°/h', base: 0.082, threshold: 0.05 },
    { type: 'COMM_LOST', title: '采集链路中断超过阈值', metric: '中断时长', unit: 's', base: 128, threshold: 120 },
    { type: 'CAL_DUE', title: '校准证书已过期', metric: '超期天数', unit: '天', base: 19, threshold: 0 },
    { type: 'TEMP_ABNORMAL', title: '温补通道 T2 读数偏差', metric: '温度偏差', unit: '℃', base: 2.4, threshold: 1.5 },
    { type: 'STATION_FAULT', title: '转台速率波动超差', metric: '速率波动', unit: '%', base: 0.8, threshold: 0.5 },
    { type: 'DATA_QUALITY', title: '采集数据缺失率偏高', metric: '缺失率', unit: '%', base: 0.42, threshold: 0.2 },
  ];

  for (let i = 0; i < 86; i += 1) {
    const tpl = templates[i % templates.length];
    const device = devices[(i * 7) % devices.length];
    const triggered = NOW.subtract(i < 12 ? rng.int(5, 900) : rng.int(1440, 26000), 'minute');
    const open = i < 12;
    const level: Alarm['level'] = i < 2 ? 'CRITICAL' : i < 6 ? 'MAJOR' : i < 12 ? 'MINOR' : i % 9 === 0 ? 'INFO' : i % 3 === 0 ? 'MAJOR' : 'MINOR';
    alarms.push({
      id: `AL-${String(i + 1).padStart(4, '0')}`,
      code: `ALM-${triggered.format('YYYYMMDD')}-${String(i + 1).padStart(4, '0')}`,
      level,
      type: tpl.type,
      title: tpl.title,
      deviceId: device.id,
      deviceCode: device.code,
      metric: tpl.metric,
      value: Number((tpl.base * rng.float(0.9, 1.4)).toFixed(tpl.unit === '%' ? 2 : 1)),
      threshold: tpl.threshold,
      unit: tpl.unit,
      triggeredAt: ts(triggered),
      durationMinutes: rng.int(6, 2880),
      status: open ? (i < 4 ? 'OPEN' : 'PROCESSING') : i % 5 === 0 ? 'ACKED' : 'CLOSED',
      assignee: open ? rng.pick(PEOPLE) : rng.pick(PEOPLE),
      handling: open ? undefined : '已核对采集原始数据，重新执行零偏测试后指标恢复至 0.037 °/h，判定为环境温度波动导致的短时漂移。',
      ackedAt: open ? undefined : ts(triggered.add(rng.int(4, 90), 'minute')),
      closedAt: open ? undefined : ts(triggered.add(rng.int(100, 1600), 'minute')),
    });
  }
  return alarms;
}

function buildWorkTasks(devices: Device[]): WorkTask[] {
  const titles = [
    '某型惯导系统批产标定',
    '高精度 MEMS 陀螺温度补偿技术研究',
    '车载组合导航动态性能验证',
    '光纤陀螺零偏重复性复测',
    '转台速率精度期间核查',
    '惯测单元高低温摸底试验',
    '新型安装误差辨识方法验证',
    '批产器件抽样复核',
    '组合导航跑车试验数据整理',
    '温控箱均匀性测试',
    '某型号陀螺仪故障复现',
    '标定工装夹具精度复检',
  ];
  const statuses: WorkTask['status'][] = [
    ...Array(18).fill('DONE'),
    ...Array(7).fill('DOING'),
    ...Array(6).fill('TODO'),
    ...Array(3).fill('REVIEW'),
    ...Array(2).fill('PAUSED'),
  ];
  return Array.from({ length: 36 }, (_, i) => {
    const device = devices[(i * 5) % devices.length];
    const status = statuses[i];
    const start = NOW.subtract(rng.int(1, 150), 'day');
    const end = start.add(rng.int(2, 12), 'day');
    return {
      id: `WT-${String(i + 1).padStart(4, '0')}`,
      code: `TST-2026-${String(210 + i).padStart(4, '0')}`,
      title: titles[i % titles.length],
      type: i % 5 === 0 ? 'RESEARCH' : i % 7 === 0 ? 'MAINTAIN' : i % 3 === 0 ? 'TEST' : 'CALIBRATION',
      deviceId: device.id,
      deviceCode: device.code,
      priority: i % 6 === 0 ? 'P0' : i % 3 === 0 ? 'P1' : 'P2',
      status,
      owner: rng.pick(PEOPLE),
      participants: rng.picks(PEOPLE, 2),
      plannedStart: ts(start),
      plannedEnd: ts(end),
      actualStart: status === 'TODO' ? undefined : ts(start.add(rng.int(-1, 2), 'day')),
      actualEnd: status === 'DONE' ? ts(end.add(rng.int(-1, 2), 'day')) : undefined,
      progress: status === 'DONE' ? 100 : status === 'REVIEW' ? 100 : status === 'TODO' ? 0 : status === 'PAUSED' ? 45 : rng.int(25, 88),
      description: '按标定大纲执行，重点关注零偏稳定性与温度漂移指标；采集过程保持环境温度波动不超过 ±0.5 ℃。',
      comments: [
        { user: '李慧', time: ts(start.add(1, 'day')), content: '已完成工装安装与水平度复检，水平度 4.2″，满足要求。' },
        { user: '张启明', time: ts(start.add(2, 'day')), content: '第二位置数据稳定度略大，已延长驻留时间至 75 s，复测通过。' },
      ],
      logs: [
        { time: ts(start), user: '系统', action: '创建任务' },
        { time: ts(start.add(1, 'day')), user: rng.pick(PEOPLE), action: '开始执行' },
      ],
    } satisfies WorkTask;
  });
}

function buildReports(devices: Device[], tasks: CalibrationTask[]): Report[] {
  return Array.from({ length: 26 }, (_, i) => {
    const task = tasks[i % tasks.length];
    const device = devices.find((d) => d.id === task.deviceId)!;
    const type: Report['type'] = i % 6 === 0 ? 'MONTHLY' : i % 3 === 0 ? 'PERFORMANCE' : 'CALIBRATION';
    return {
      id: `RP-${String(i + 1).padStart(3, '0')}`,
      code: `RPT-${type === 'CALIBRATION' ? 'CAL' : type === 'PERFORMANCE' ? 'PERF' : 'MON'}-2026-${String(180 + i).padStart(4, '0')}`,
      type,
      title: `${device.model} ${type === 'CALIBRATION' ? '标定报告' : type === 'PERFORMANCE' ? '性能测试报告' : '月度运行报告'}`,
      deviceId: device.id,
      deviceCode: device.code,
      taskId: task.id,
      status: i < 3 ? 'DRAFT' : i < 6 ? 'REVIEWING' : 'ARCHIVED',
      createdBy: rng.pick(PEOPLE),
      createdAt: ts(NOW.subtract(rng.int(1, 120), 'day')),
      sections: ['概述', '标定依据', '标定设备与环境', '标定方案与步骤', '标定数据与曲线', '参数解算结果', '结论'],
    };
  });
}

function buildServiceOrders(): ServiceOrder[] {
  const titles = [
    'IMU 上电后无数据输出',
    '标定软件采集通道配置异常',
    '转台角度反馈零位偏移',
    '温箱升温速率不达标',
    '组合导航航向漂移偏大',
    '标定报告无法导出 PDF',
    '加速度计零偏重复性咨询',
    '新员工标定流程培训',
    '工装夹具螺纹磨损更换',
    '数据回放时间轴不同步',
    'MEMS 器件温度补偿参数咨询',
    '上位机与采集箱通信超时',
  ];
  return Array.from({ length: 24 }, (_, i) => {
    const created = NOW.subtract(rng.int(0, 45), 'day').subtract(rng.int(0, 600), 'minute');
    const resolved = i % 4 !== 0;
    return {
      id: `SO-${String(i + 1).padStart(4, '0')}`,
      code: `SR-2026-${String(440 + i).padStart(4, '0')}`,
      customer: ['计量测试中心', '第二研究室', '总装车间', '外协单位 · 华航精密'][i % 4],
      type: i % 7 === 0 ? 'TRAINING' : i % 5 === 0 ? 'CONSULT' : i % 3 === 0 ? 'REPAIR' : 'FAULT',
      title: titles[i % titles.length],
      deviceId: undefined,
      priority: i % 7 === 0 ? 'P0' : i % 3 === 0 ? 'P1' : 'P2',
      status: resolved ? (i % 3 === 0 ? 'CLOSED' : 'RESOLVED') : i % 2 === 0 ? 'PROCESSING' : 'NEW',
      assignee: resolved ? rng.pick(PEOPLE) : undefined,
      slaResponseHours: 4,
      slaResolveHours: i % 4 === 0 ? 8 : 24,
      createdAt: ts(created),
      respondedAt: i > 2 ? ts(created.add(rng.int(1, 200), 'minute')) : undefined,
      resolvedAt: resolved ? ts(created.add(rng.int(120, 1600), 'minute')) : undefined,
      satisfaction: resolved && i % 3 === 0 ? rng.int(4, 5) : undefined,
      description: '设备在例行测试中出现异常，已按操作手册完成基础排查，问题仍未消除，请技术支持协助定位。',
      records: [
        { time: ts(created), user: '系统', action: '工单创建', note: '来源：服务门户' },
        ...(i > 2 ? [{ time: ts(created.add(2, 'hour')), user: '李慧', action: '受理并派单', note: '指派给硬件支持组' }] : []),
        ...(resolved ? [{ time: ts(created.add(9, 'hour')), user: '王振国', action: '处理完成', note: '更换采集箱电源模块，连续运行 4 h 无异常。' }] : []),
      ],
    } satisfies ServiceOrder;
  });
}

const FULL_ARTICLES: Partial<KnowledgeArticle>[] = [
  {
    category: '标定规范',
    title: '六位置静态标定操作要点',
    summary: '从工装安装、水平度复检到判稳窗口设置，梳理六位置法最容易出错的六个环节。',
    tags: ['六位置法', '零偏', '标度因数'],
    content:
      '适用对象：FOG_IMU、GNSS_INS 等需要分离三轴零偏与标度因数的器件。\n\n前置条件：转台或静基座水平度优于 8″；环境温度 23 ± 2 ℃；器件预热不少于 30 min。\n\n操作步骤：\n1. 将器件按 X 轴朝上安装于工装，确认定位面贴合、无间隙。\n2. 用电子水平仪复检工装水平度，记录实测值，超过 8″ 需重新调整。\n3. 上电预热 30 min，观察温度通道稳定在 ±0.3 ℃ 以内。\n4. 依次执行 +X、−X、+Y、−Y、+Z、−Z 六个位置，每位置驻留 60 s，取后 30 s 作为有效采样窗口。\n5. 每个位置结束前检查稳定度，低于 0.02 °/h 方可进入下一位置。\n6. 全部位置完成后执行解算，检查残差 RMS 是否小于 0.002 °/h。\n\n注意事项：\n- 换位后必须等待 10 s 再开始采样，避免换位冲击引入的振荡。\n- 同一批次器件应使用同一工装与同一操作人，减少人为差异。\n- 若某位置稳定度持续超标，优先排查线缆牵拉与接地，而非直接重采。',
  },
  {
    category: '故障排查',
    title: 'IMU 上电无数据输出的排查路径',
    summary: '按电源、通信、握手、通道配置四级顺序定位，避免盲目更换器件。',
    tags: ['无输出', '通信', '电源'],
    content:
      '现象：上位机显示设备已连接，但采集页面所有通道无数据或全为零。\n\n排查顺序：\n1. 电源检查：测量输入端电压是否在 26~30 V，纹波是否小于 100 mV。\n2. 通信检查：确认波特率与设备配置一致，检查差分线 A/B 是否接反。\n3. 握手检查：查看采集日志是否出现「握手超时」，若超时先更换通信线缆。\n4. 通道配置：确认采样率不超过器件输出能力，通道掩码未全部关闭。\n5. 器件自检：短接自检引脚，观察输出是否出现特征方波。\n\n常见原因占比：线缆接触不良约 45%，电源纹波超标约 20%，通道配置错误约 18%，器件故障约 17%。\n\n处理完成后需连续采集 10 min，确认无丢包再恢复正式试验。',
  },
  {
    category: '原理科普',
    title: '如何读懂 Allan 方差曲线',
    summary: '五个斜率区间分别对应哪类噪声，谷底为什么是零偏不稳定性。',
    tags: ['Allan 方差', '噪声分析'],
    content:
      'Allan 方差用于描述惯性器件随机误差随平均时间的变化规律，横轴为簇时间 τ，纵轴为 Allan 标准差 σ(τ)，双对数坐标下不同噪声呈现不同斜率。\n\n斜率 −1：量化噪声，出现在极短 τ 段，通常由 ADC 位数决定。\n斜率 −1/2：角度随机游走（ARW），由白噪声积分产生，是陀螺精度的核心指标之一，单位为 °/√h。\n斜率 0：零偏不稳定性，对应 1/f 噪声，曲线谷底即该值，反映器件长期稳定度。\n斜率 +1/2：速率随机游走，由零偏的随机漂移累积形成。\n斜率 +1：速率斜坡，表现为确定性漂移，多与温度或老化有关。\n\n读图要点：谷底位置对应的 τ 说明器件在多大的平均时间下最稳定；若谷底右移，通常意味着温度控制或封装应力存在问题。',
  },
  {
    category: '软件操作',
    title: '标定任务从创建到归档的完整流程',
    summary: '五步走完一次标定：建任务、装器件、跑采集、审参数、归报告。',
    tags: ['标定任务', '流程'],
    content:
      '第一步 创建任务：在「标定与辨识」中选择设备与方案，确认台位与温度点，指定执行人与审核人。\n\n第二步 安装器件：按方案要求安装工装，系统会在准备步骤提示水平度与预热时间要求，确认后进入采集。\n\n第三步 执行采集：逐位置点击「开始本位置」，系统自动判稳并切换；任一位置失败可单独重采，不影响已完成位置。\n\n第四步 参数审核：解算完成后核对零偏、标度因数、安装误差矩阵与残差，超差项会红色标记；审核人填写意见后通过或驳回。\n\n第五步 生成报告：从结果页点击「生成报告」，选择模板与章节，系统自动填入参数表与曲线，归档后不可再修改。',
  },
  {
    category: '标定规范',
    title: '温度循环标定的保温时间如何确定',
    summary: '保温不足是温度系数拟合失真的主要原因，本文给出判定方法。',
    tags: ['温度标定', '温度系数'],
    content:
      '保温时间的目的是让器件内部温度场达到平衡，而非仅让箱体温度到达设定值。\n\n判定方法：在器件壳体与内部各布置一个温度传感器，当两者差值连续 20 min 小于 0.3 ℃ 时，认为热平衡建立。\n\n经验取值：\n- 小型 MEMS 器件：45~60 min。\n- 光纤陀螺 IMU：90~120 min。\n- 带温控罩的高精度 IMU：120~180 min。\n\n常见问题：仅按箱体显示温度开始采集，会导致低温段零偏偏大、温度系数拟合斜率失真，最终表现为常温补偿后残差反而增大。\n\n建议在方案中将保温时间设为可配置项，并在采集日志中记录实际保温时长，便于追溯。',
  },
  {
    category: '培训资料',
    title: '新员工上岗培训：惯性器件测试基础',
    summary: '坐标系、姿态角、零偏与标度因数的直观解释，附常见误区。',
    tags: ['培训', '基础概念'],
    content:
      '一、坐标系：载体坐标系 X 轴指向右、Y 轴指向前、Z 轴指向上，满足右手定则；导航坐标系常用北-东-地。\n\n二、姿态角：横滚 roll 绕 X 轴、俯仰 pitch 绕 Y 轴、航向 yaw 绕 Z 轴，注意不同教材的旋转顺序定义可能不同，本系统统一采用 Z-Y-X。\n\n三、零偏：输入为零时的输出，单位 °/h；零偏稳定性是其随时间波动的标准差，二者不可混用。\n\n四、标度因数：输出增量与输入增量之比，理想值为 1；非线性度描述该比值随输入幅值的变化程度，单位 ppm。\n\n常见误区：\n- 把零偏重复性当作零偏稳定性。\n- 用单次上电数据评价长期稳定性。\n- 忽略安装误差对姿态解算的影响，导致航向缓慢漂移。',
  },
];

function buildArticles(): KnowledgeArticle[] {
  return Array.from({ length: 18 }, (_, i) => {
    const base = FULL_ARTICLES[i % FULL_ARTICLES.length];
    const categories: KnowledgeArticle['category'][] = ['标定规范', '故障排查', '软件操作', '原理科普', '培训资料'];
    const titles = [
      '安装误差矩阵的物理含义与量级判断',
      '采集丢包问题的现场处置清单',
      '数据回放与区间标注使用说明',
      '陀螺零偏温度特性的建模思路',
      '标定数据记录与归档要求',
      '转台速率精度期间核查方法',
      'MEMS 器件冲击后性能复检流程',
      '报告模板字段填写规范',
    ];
    return {
      id: `KB-${String(i + 1).padStart(3, '0')}`,
      category: base.category ?? categories[i % categories.length],
      title: i < FULL_ARTICLES.length ? (base.title as string) : titles[(i - FULL_ARTICLES.length) % titles.length],
      summary: base.summary ?? '围绕现场常见问题整理的处置要点与操作步骤。',
      author: PEOPLE[i % PEOPLE.length],
      updatedAt: NOW.subtract(rng.int(1, 200), 'day').format('YYYY-MM-DD'),
      views: rng.int(120, 3200),
      tags: base.tags ?? ['操作指南'],
      content: base.content ?? '适用对象：试验与标定岗位人员。\n\n操作步骤：\n1. 确认设备状态与工装安装符合方案要求。\n2. 按页面提示逐项完成参数配置。\n3. 执行过程中关注稳定度与数据质量指标。\n4. 完成后核对结果并提交审核。\n\n注意事项：环境温度波动应控制在 ±2 ℃ 以内，异常情况及时记录并上报。',
    } satisfies KnowledgeArticle;
  });
}

function buildUsers(): User[] {
  const defs: [string, string, User['role'], string][] = [
    ['admin', '系统管理员', 'ADMIN', '信息中心'],
    ['zhangqm', '张启明', 'CALIB_ENGINEER', '标定测试室'],
    ['lihui', '李慧', 'REVIEWER', '质量保证部'],
    ['wangzg', '王振国', 'TEST_ENGINEER', '第二研究室'],
    ['chenli', '陈立', 'ANALYST', '数据分析组'],
    ['zhaomin', '赵敏', 'TEST_ENGINEER', '计量测试中心'],
    ['zhouwb', '周文博', 'CALIB_ENGINEER', '标定测试室'],
    ['sunqian', '孙倩', 'ANALYST', '数据分析组'],
    ['wukai', '吴凯', 'TEST_ENGINEER', '总装车间'],
    ['zhenght', '郑海涛', 'REVIEWER', '质量保证部'],
    ['fengxue', '冯雪', 'GUEST', '外协单位'],
    ['majun', '马骁', 'TEST_ENGINEER', '第二研究室'],
  ];
  const colors = ['#1668dc', '#13c2c2', '#722ed1', '#fa8c16', '#eb2f96', '#52c41a'];
  return defs.map(([account, name, role, department], i) => ({
    id: `U-${String(i + 1).padStart(3, '0')}`,
    account,
    name,
    role,
    department,
    phone: `138${String(10000000 + i * 1234567).slice(0, 8)}`,
    email: `${account}@inertial.local`,
    status: i === 10 ? 'DISABLED' : 'ACTIVE',
    lastLoginAt: ts(NOW.subtract(rng.int(0, 40), 'hour')),
    avatarColor: colors[i % colors.length],
  }));
}

function buildAuditLogs(): AuditLog[] {
  const modules = ['标定管理', '设备管理', '数据分析', '报告中心', '系统管理', '告警中心'];
  const actions = ['创建标定任务', '下发参数', '导出报告', '修改设备信息', '确认告警', '新增用户', '删除数据文件', '审核通过'];
  return Array.from({ length: 200 }, (_, i) => {
    const created = NOW.subtract(rng.int(0, 30), 'day').subtract(rng.int(0, 1440), 'minute');
    return {
      id: `LOG-${String(i + 1).padStart(5, '0')}`,
      user: rng.pick(PEOPLE),
      module: modules[i % modules.length],
      action: actions[i % actions.length],
      target: i % 3 === 0 ? `DEV-${String(rng.int(1, 48)).padStart(4, '0')}` : `CAL-2026-${String(rng.int(180, 221)).padStart(4, '0')}`,
      ip: `10.20.${rng.int(1, 12)}.${rng.int(2, 240)}`,
      costMs: rng.int(18, 860),
      result: i % 23 === 0 ? 'FAIL' : 'SUCCESS',
      createdAt: ts(created),
    };
  });
}

function buildHealthRecords(devices: Device[]): HealthRecord[] {
  const records: HealthRecord[] = [];
  devices.forEach((device) => {
    for (let d = 89; d >= 0; d -= 1) {
      const day = NOW.subtract(d, 'day');
      const drift = Math.sin((90 - d) / 14) * 2.4 + (90 - d) * 0.02;
      const score = Math.max(42, Math.min(99, Math.round(device.healthScore - drift + rng.float(-1.4, 1.4))));
      records.push({
        deviceId: device.id,
        date: day.format('YYYY-MM-DD'),
        score,
        metrics: {
          biasStability: Math.max(45, Math.min(100, score + rng.int(-5, 4))),
          scaleStability: Math.max(45, Math.min(100, score + rng.int(-6, 5))),
          noiseLevel: Math.max(45, Math.min(100, score + rng.int(-8, 6))),
          tempCharacteristic: Math.max(45, Math.min(100, score + rng.int(-7, 4))),
          dataIntegrity: Math.max(60, Math.min(100, 96 + rng.int(-6, 4))),
          calibrationTimeliness: Math.max(40, Math.min(100, 88 + rng.int(-12, 8))),
        },
        suggestion:
          score < 70
            ? '零偏稳定性连续下降，建议在一个月内安排复标，并检查温控回路。'
            : score < 82
              ? '噪声水平略高于同型号均值，建议关注接地与屏蔽，下次标定时增加温度点。'
              : '各项指标正常，按年度计划执行标定即可。',
      });
    }
  });
  return records;
}

export interface SeedData {
  devices: Device[];
  stations: Station[];
  plans: CalibrationPlan[];
  calibrationTasks: CalibrationTask[];
  results: CalibrationResult[];
  dataFiles: DataFile[];
  alarms: Alarm[];
  workTasks: WorkTask[];
  reports: Report[];
  serviceOrders: ServiceOrder[];
  articles: KnowledgeArticle[];
  users: User[];
  auditLogs: AuditLog[];
  healthRecords: HealthRecord[];
}

export function buildSeedData(): SeedData {
  const stations = buildStations();
  const devices = buildDevices(stations);
  const plans = buildPlans();
  const calibrationTasks = buildCalibrationTasks(devices, plans, stations);
  const results = buildResults(calibrationTasks, devices);

  devices.forEach((device) => {
    const task = calibrationTasks
      .filter((t) => t.deviceId === device.id && t.resultId)
      .sort((a, b) => (dt(b.actualEnd ?? '').valueOf() - dt(a.actualEnd ?? '').valueOf()))[0];
    if (task?.resultId) device.lastCalibrationId = task.resultId;
  });

  return {
    devices,
    stations,
    plans,
    calibrationTasks,
    results,
    dataFiles: buildDataFiles(devices, calibrationTasks),
    alarms: buildAlarms(devices),
    workTasks: buildWorkTasks(devices),
    reports: buildReports(devices, calibrationTasks),
    serviceOrders: buildServiceOrders(),
    articles: buildArticles(),
    users: buildUsers(),
    auditLogs: buildAuditLogs(),
    healthRecords: buildHealthRecords(devices),
  };
}
