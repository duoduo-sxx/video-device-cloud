import type { DB } from './db'

export function validateDB(db: DB): string[] {
  const issues: string[] = []
  const spaceIds = new Set(db.spaces.map((s) => s.id))
  const deviceIds = new Set(db.devices.map((d) => d.id))
  const sceneIds = new Set(db.scenes.map((s) => s.id))

  db.devices.forEach((d) => {
    if (!spaceIds.has(d.spaceId)) issues.push(`设备 ${d.id} 引用了不存在的空间 ${d.spaceId}`)
  })

  db.scenes.forEach((s) => {
    if (!spaceIds.has(s.spaceId)) issues.push(`场景 ${s.id} 引用了不存在的空间 ${s.spaceId}`)
    const ids = new Set<string>()
    s.steps.forEach((st) =>
      st.actions.forEach((a) => {
        ids.add(a.deviceId)
        if (!deviceIds.has(a.deviceId)) issues.push(`场景 ${s.id} 动作引用了不存在的设备 ${a.deviceId}`)
      }),
    )
    if (ids.size !== s.deviceCount) {
      issues.push(`场景 ${s.id} deviceCount 不一致：声明 ${s.deviceCount}，实际 ${ids.size}`)
    }
  })

  db.alerts.forEach((a) => {
    if (!deviceIds.has(a.deviceId)) issues.push(`告警 ${a.id} 引用了不存在的设备 ${a.deviceId}`)
  })

  db.tickets.forEach((t) => {
    if (t.deviceId && !deviceIds.has(t.deviceId)) issues.push(`工单 ${t.id} 引用了不存在的设备 ${t.deviceId}`)
  })

  db.tasks.forEach((t) => {
    if (t.sceneId && !sceneIds.has(t.sceneId)) issues.push(`任务 ${t.id} 引用了不存在的场景 ${t.sceneId}`)
  })

  return issues
}
