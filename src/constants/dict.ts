import type {
  AlarmLevel,
  AlarmStatus,
  Alarm,
  CalibStatus,
  Conclusion,
  DeviceStatus,
  DeviceType,
  HealthLevel,
  Priority,
  TaskStatus,
} from '../types/models';

export const DEVICE_TYPE_LABEL: Record<DeviceType, string> = {
  FOG_IMU: '光纤陀螺惯测单元',
  MEMS_IMU: 'MEMS 惯测单元',
  DTG: '动力调谐陀螺',
  ACC_SET: '加速度计组件',
  GNSS_INS: '组合导航系统',
  MAG: '三轴磁强计',
  TURNTABLE: '转台',
  TEMP_CHAMBER: '温控箱',
};

export const DEVICE_STATUS_LABEL: Record<DeviceStatus, string> = {
  IN_USE: '在用',
  CALIBRATING: '校准中',
  REPAIRING: '维修',
  IDLE: '闲置',
  RETIRED: '报废',
};

export const DEVICE_STATUS_COLOR: Record<DeviceStatus, string> = {
  IN_USE: 'success',
  CALIBRATING: 'processing',
  REPAIRING: 'purple',
  IDLE: 'default',
  RETIRED: 'default',
};

export const CALIB_STATUS_LABEL: Record<CalibStatus, string> = {
  PENDING: '待开始',
  RUNNING: '进行中',
  REVIEWING: '待审核',
  COMPLETED: '已完成',
  FAILED: '异常',
};

export const CALIB_STATUS_COLOR: Record<CalibStatus, string> = {
  PENDING: 'default',
  RUNNING: 'processing',
  REVIEWING: 'warning',
  COMPLETED: 'success',
  FAILED: 'error',
};

export const CONCLUSION_LABEL: Record<Conclusion, string> = {
  PASS: '合格',
  FAIL: '超差',
  PENDING: '待判定',
};

export const ALARM_LEVEL_LABEL: Record<AlarmLevel, string> = {
  CRITICAL: '紧急',
  MAJOR: '严重',
  MINOR: '一般',
  INFO: '提示',
};

export const ALARM_LEVEL_COLOR: Record<AlarmLevel, string> = {
  CRITICAL: '#f5222d',
  MAJOR: '#fa8c16',
  MINOR: '#faad14',
  INFO: '#1677ff',
};

export const ALARM_STATUS_LABEL: Record<AlarmStatus, string> = {
  OPEN: '待确认',
  ACKED: '已确认',
  PROCESSING: '处理中',
  CLOSED: '已闭环',
};

export const ALARM_TYPE_LABEL: Record<Alarm['type'], string> = {
  BIAS_EXCEED: '零偏超限',
  TEMP_ABNORMAL: '温度异常',
  COMM_LOST: '通信中断',
  STATION_FAULT: '台位故障',
  CAL_DUE: '校准到期',
  DATA_QUALITY: '数据质量',
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: '待开始',
  DOING: '进行中',
  REVIEW: '待审核',
  DONE: '已完成',
  PAUSED: '已暂停',
};

export const TASK_STATUS_COLOR: Record<TaskStatus, string> = {
  TODO: 'default',
  DOING: 'processing',
  REVIEW: 'warning',
  DONE: 'success',
  PAUSED: 'default',
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  P0: '紧急',
  P1: '高',
  P2: '普通',
};

export const HEALTH_LEVEL_LABEL: Record<HealthLevel, string> = {
  EXCELLENT: '优良',
  NORMAL: '正常',
  ATTENTION: '关注',
  WARNING: '预警',
  FAULT: '故障',
};

export const HEALTH_LEVEL_COLOR: Record<HealthLevel, string> = {
  EXCELLENT: '#16a34a',
  NORMAL: '#52c41a',
  ATTENTION: '#faad14',
  WARNING: '#fa8c16',
  FAULT: '#f5222d',
};

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: '系统管理员',
  TEST_ENGINEER: '试验工程师',
  CALIB_ENGINEER: '标定工程师',
  ANALYST: '数据分析师',
  REVIEWER: '质量审核员',
  GUEST: '只读访客',
};

export const REPORT_TYPE_LABEL: Record<string, string> = {
  CALIBRATION: '标定报告',
  PERFORMANCE: '性能测试报告',
  MONTHLY: '月度运行报告',
};

export const REPORT_STATUS_LABEL: Record<string, string> = {
  DRAFT: '草稿',
  REVIEWING: '待审核',
  ARCHIVED: '已归档',
};

export const SERVICE_STATUS_LABEL: Record<string, string> = {
  NEW: '待受理',
  ACCEPTED: '已受理',
  ASSIGNED: '已派单',
  PROCESSING: '处理中',
  RESOLVED: '已解决',
  CLOSED: '已关闭',
};

export const STATION_TYPE_LABEL: Record<string, string> = {
  TURNTABLE: '转台',
  TEMP_CHAMBER: '温控箱',
  VIBRATION: '振动台',
  FIXTURE: '静基座',
};

export function healthLevelOf(score: number): HealthLevel {
  if (score >= 90) return 'EXCELLENT';
  if (score >= 80) return 'NORMAL';
  if (score >= 70) return 'ATTENTION';
  if (score >= 60) return 'WARNING';
  return 'FAULT';
}
