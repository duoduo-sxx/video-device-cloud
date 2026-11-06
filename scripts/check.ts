import { assets, clients, jobs, nodes, orders, presets, projects, tickets, auditLogs, team } from '../src/mock/data'
import { weightedProgress } from '../src/lib/calc'

const errs: string[] = []
const ids = new Set<string>()
const dup = (arr: { id: string }[], label: string) => {
  arr.forEach((x) => {
    if (ids.has(x.id)) errs.push(`duplicate id ${label}: ${x.id}`)
    ids.add(x.id)
  })
}
dup(clients, 'client')
dup(projects, 'project')
dup(assets, 'asset')
dup(jobs, 'job')
dup(presets, 'preset')
dup(orders, 'order')
dup(tickets, 'ticket')
dup(nodes, 'node')
dup(team, 'member')

jobs.forEach((j) => {
  if (!assets.find((a) => a.id === j.assetId)) errs.push(`job ${j.code} missing asset ${j.assetId}`)
  if (!clients.find((c) => c.id === j.clientId)) errs.push(`job ${j.code} missing client ${j.clientId}`)
  if (j.projectId && !projects.find((p) => p.id === j.projectId)) errs.push(`job ${j.code} missing project ${j.projectId}`)
  const wp = weightedProgress(j.stages)
  if (Math.abs(wp - j.progress) > 2) errs.push(`job ${j.code} progress mismatch ${wp} vs ${j.progress}`)
  if (j.status === 'completed' && (!j.metrics || j.progress !== 100)) errs.push(`job ${j.code} completed but incomplete`)
})

nodes.forEach((n) => {
  if (n.currentJobId && !jobs.find((j) => j.id === n.currentJobId)) errs.push(`node ${n.hostname} bad job ref`)
  if (n.status === 'busy' && !n.currentJobId) errs.push(`node ${n.hostname} busy without job`)
})

orders.forEach((o) => {
  const sub = o.items.reduce((s, i) => s + i.minutes * i.unitPriceCNY, 0)
  if (Math.abs(sub - o.subtotalCNY) > 1) errs.push(`order ${o.code} subtotal ${sub} vs ${o.subtotalCNY}`)
  if (!projects.find((p) => p.id === o.projectId)) errs.push(`order ${o.code} missing project`)
  if (o.totalCNY <= 0) errs.push(`order ${o.code} total <= 0`)
})

tickets.forEach((t) => {
  if (!clients.find((c) => c.id === t.clientId)) errs.push(`ticket ${t.code} missing client`)
})

const statusCount = jobs.reduce<Record<string, number>>((m, j) => {
  m[j.status] = (m[j.status] ?? 0) + 1
  return m
}, {})

console.log(
  JSON.stringify(
    {
      clients: clients.length,
      projects: projects.length,
      assets: assets.length,
      jobs: jobs.length,
      orders: orders.length,
      tickets: tickets.length,
      nodes: nodes.length,
      team: team.length,
      logs: auditLogs.length,
      statusCount,
      errors: errs,
    },
    null,
    2,
  ),
)
