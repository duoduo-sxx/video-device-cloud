import type { AppNotification, AuditLog } from '../types'
import { buildAll } from './build'
import { buildAuditLogs, buildNotifications, CASES, MEMBERS, NODES, PACKAGES, PROJECTS } from './seed'

const base = buildAll()

export const db = {
  ...base,
  projects: PROJECTS,
  members: MEMBERS,
  packages: PACKAGES,
  nodes: NODES,
  cases: CASES,
  notifications: buildNotifications() as AppNotification[],
  auditLogs: buildAuditLogs() as AuditLog[],
}

export type Db = typeof db
