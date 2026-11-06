export type DeviceType =
  | 'FOG_IMU'
  | 'MEMS_IMU'
  | 'DTG'
  | 'ACC_SET'
  | 'GNSS_INS'
  | 'MAG'
  | 'TURNTABLE'
  | 'TEMP_CHAMBER';

export type DeviceStatus = 'IN_USE' | 'CALIBRATING' | 'REPAIRING' | 'IDLE' | 'RETIRED';
export type CalibStatus = 'PENDING' | 'RUNNING' | 'REVIEWING' | 'COMPLETED' | 'FAILED';
export type Conclusion = 'PASS' | 'FAIL' | 'PENDING';
export type AlarmLevel = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO';
export type AlarmStatus = 'OPEN' | 'ACKED' | 'PROCESSING' | 'CLOSED';
export type TaskStatus = 'TODO' | 'DOING' | 'REVIEW' | 'DONE' | 'PAUSED';
export type Priority = 'P0' | 'P1' | 'P2';
export type HealthLevel = 'EXCELLENT' | 'NORMAL' | 'ATTENTION' | 'WARNING' | 'FAULT';

export interface Axis3 {
  x: number;
  y: number;
  z: number;
}

export interface DeviceSpecs {
  gyroRange: number;
  gyroBiasStability: number;
  gyroBiasRepeatability: number;
  gyroScaleNonlinearity: number;
  arw: number;
  accRange: number;
  accBias: number;
  accScaleNonlinearity: number;
  vrw: number;
  bandwidth: number;
  outputRate: number;
  tempRange: [number, number];
  voltage: number;
  power: number;
  weight: number;
  dimensions: string;
}

export interface DeviceChannel {
  id: string;
  name: string;
  type: 'gyro' | 'acc' | 'temp' | 'mag';
  axis: 'X' | 'Y' | 'Z' | '-';
  unit: string;
  range: number;
  polarity: 1 | -1;
  sampleRate: number;
}

export interface Device {
  id: string;
  code: string;
  name: string;
  type: DeviceType;
  model: string;
  vendor: string;
  serialNo: string;
  grade: 'A' | 'B' | 'C';
  status: DeviceStatus;
  stationId?: string;
  stationName?: string;
  owner: string;
  manufacturedAt: string;
  inServiceAt: string;
  calibratedAt: string;
  calibrationValidUntil: string;
  healthScore: number;
  healthLevel: HealthLevel;
  lastCalibrationId?: string;
  specs: DeviceSpecs;
  channels: DeviceChannel[];
  tags: string[];
  remark?: string;
}

export interface CalibrationPlan {
  id: string;
  name: string;
  method: 'SIX_POSITION' | 'TWENTY_FOUR_POSITION' | 'RATE' | 'TEMP_CYCLE' | 'QUICK';
  applicableTypes: DeviceType[];
  positions: { index: number; label: string; note?: string }[];
  dwellSeconds: number;
  sampleWindowSeconds: number;
  stabilityThreshold: number;
  tempPoints?: number[];
  estimatedMinutes: number;
  description: string;
}

export interface CalibPositionState {
  index: number;
  label: string;
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
  duration: number;
  stability: number;
}

export interface CalibrationTask {
  id: string;
  code: string;
  deviceId: string;
  deviceCode: string;
  deviceModel: string;
  planId: string;
  planName: string;
  stationId: string;
  stationName: string;
  tempPoints: number[];
  operator: string;
  reviewer: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  progress: number;
  status: CalibStatus;
  conclusion: Conclusion;
  positions: CalibPositionState[];
  resultId?: string;
  remark?: string;
}

export interface CalibrationResult {
  id: string;
  taskId: string;
  biases: Axis3;
  biasSigma: Axis3;
  scaleFactors: Axis3;
  nonlinearity: Axis3;
  misalignmentArcsec: number[][];
  tempCoeff: Axis3;
  residual: { r2: number; max: number; rms: number };
  passed: boolean;
  createdAt: string;
  operator: string;
  reviewer: string;
}

export interface DataFile {
  id: string;
  code: string;
  deviceId: string;
  deviceCode: string;
  taskId?: string;
  startedAt: string;
  duration: number;
  sampleRate: number;
  channels: number;
  sizeMB: number;
  tags: string[];
  events: { t: number; label: string; type: 'MARK' | 'ALARM' | 'SEGMENT' }[];
  format: 'BIN' | 'CSV';
}

export interface Alarm {
  id: string;
  code: string;
  level: AlarmLevel;
  type: 'BIAS_EXCEED' | 'TEMP_ABNORMAL' | 'COMM_LOST' | 'STATION_FAULT' | 'CAL_DUE' | 'DATA_QUALITY';
  title: string;
  deviceId: string;
  deviceCode: string;
  metric?: string;
  value?: number;
  threshold?: number;
  unit?: string;
  triggeredAt: string;
  durationMinutes: number;
  status: AlarmStatus;
  assignee?: string;
  handling?: string;
  ackedAt?: string;
  closedAt?: string;
}

export interface WorkTask {
  id: string;
  code: string;
  title: string;
  type: 'CALIBRATION' | 'TEST' | 'RESEARCH' | 'MAINTAIN';
  deviceId: string;
  deviceCode: string;
  priority: Priority;
  status: TaskStatus;
  owner: string;
  participants: string[];
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  progress: number;
  description: string;
  comments: { user: string; time: string; content: string }[];
  logs: { time: string; user: string; action: string }[];
}

export interface Station {
  id: string;
  code: string;
  name: string;
  type: 'TURNTABLE' | 'TEMP_CHAMBER' | 'VIBRATION' | 'FIXTURE';
  accuracy: string;
  status: 'IDLE' | 'BUSY' | 'MAINTAIN';
  currentDeviceId?: string;
  currentDeviceCode?: string;
  lastCalibratedAt: string;
  validUntil: string;
  utilization: number;
}

export interface Report {
  id: string;
  code: string;
  type: 'CALIBRATION' | 'PERFORMANCE' | 'MONTHLY';
  title: string;
  deviceId: string;
  deviceCode: string;
  taskId?: string;
  status: 'DRAFT' | 'REVIEWING' | 'ARCHIVED';
  createdBy: string;
  createdAt: string;
  sections: string[];
}

export interface ServiceOrder {
  id: string;
  code: string;
  customer: string;
  type: 'FAULT' | 'CONSULT' | 'TRAINING' | 'REPAIR';
  title: string;
  deviceId?: string;
  priority: Priority;
  status: 'NEW' | 'ACCEPTED' | 'ASSIGNED' | 'PROCESSING' | 'RESOLVED' | 'CLOSED';
  assignee?: string;
  slaResponseHours: number;
  slaResolveHours: number;
  createdAt: string;
  respondedAt?: string;
  resolvedAt?: string;
  satisfaction?: number;
  description: string;
  records: { time: string; user: string; action: string; note?: string }[];
}

export interface KnowledgeArticle {
  id: string;
  category: '标定规范' | '故障排查' | '软件操作' | '原理科普' | '培训资料';
  title: string;
  summary: string;
  author: string;
  updatedAt: string;
  views: number;
  tags: string[];
  content: string;
}

export interface User {
  id: string;
  account: string;
  name: string;
  role: 'ADMIN' | 'TEST_ENGINEER' | 'CALIB_ENGINEER' | 'ANALYST' | 'REVIEWER' | 'GUEST';
  department: string;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'DISABLED';
  lastLoginAt: string;
  avatarColor: string;
}

export interface AuditLog {
  id: string;
  user: string;
  module: string;
  action: string;
  target: string;
  ip: string;
  costMs: number;
  result: 'SUCCESS' | 'FAIL';
  createdAt: string;
}

export interface HealthRecord {
  deviceId: string;
  date: string;
  score: number;
  metrics: {
    biasStability: number;
    scaleStability: number;
    noiseLevel: number;
    tempCharacteristic: number;
    dataIntegrity: number;
    calibrationTimeliness: number;
  };
  suggestion: string;
}

export interface Paged<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
