import type {
  AnalysisTask,
  AuditLog,
  ModelItem,
  Notification,
  PageResult,
  ProjectItem,
  ReviewItem,
  SearchHit,
  UserItem,
  VideoItem,
} from '../types'
import {
  apiKeys,
  auditLogs,
  models,
  notifications,
  projects,
  reviews,
  spaces,
  tasks,
  users,
  videos,
} from '../mock/data'
import { fallbackSearch, searchPresets } from '../mock/search'
import { getAnalysis } from '../mock/analysis'

const delay = (ms = 320) => new Promise((r) => setTimeout(r, ms))

const store = {
  videos: [...videos],
  users: [...users],
  reviews: [...reviews],
  notifications: [...notifications],
  projects: [...projects],
  apiKeys: [...apiKeys],
}

const KEY = 'vi_state_v1'

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as {
      videos?: VideoItem[]
      users?: UserItem[]
      reviews?: ReviewItem[]
      notifications?: Notification[]
      projects?: ProjectItem[]
    }
    if (parsed.videos?.length) store.videos = parsed.videos
    if (parsed.users?.length) store.users = parsed.users
    if (parsed.reviews?.length) store.reviews = parsed.reviews
    if (parsed.notifications?.length) store.notifications = parsed.notifications
    if (parsed.projects?.length) store.projects = parsed.projects
  } catch {
    /* ignore */
  }
}

function persist() {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        videos: store.videos,
        users: store.users,
        reviews: store.reviews,
        notifications: store.notifications,
        projects: store.projects,
      }),
    )
  } catch {
    /* ignore */
  }
}

export interface VideoQuery {
  keyword?: string
  status?: string
  category?: string
  tag?: string
  duration?: string
  days?: number
  sort?: string
  order?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export async function fetchVideos(q: VideoQuery = {}): Promise<PageResult<VideoItem>> {
  await delay(360)
  let list = [...store.videos]
  if (q.keyword) {
    const k = q.keyword.toLowerCase()
    list = list.filter(
      (v) =>
        v.title.toLowerCase().includes(k) ||
        v.description.toLowerCase().includes(k) ||
        v.tags.some((t) => t.toLowerCase().includes(k)),
    )
  }
  if (q.status && q.status !== 'all') list = list.filter((v) => v.status === q.status)
  if (q.category && q.category !== 'all') list = list.filter((v) => v.category === q.category)
  if (q.tag) {
    const tag = q.tag
    list = list.filter((v) => v.tags.includes(tag))
  }
  if (q.days && q.days > 0) {
    const from = Date.now() - q.days * 86400000
    list = list.filter((v) => +new Date(v.uploadedAt) >= from)
  }
  if (q.duration && q.duration !== 'all') {
    const [min, max] = q.duration.split('-').map(Number)
    list = list.filter((v) => v.duration >= min && v.duration < max)
  }
  const sortKey = q.sort ?? 'uploadedAt'
  const order = q.order ?? 'desc'
  list.sort((a, b) => {
    let av: number | string = 0
    let bv: number | string = 0
    if (sortKey === 'duration') {
      av = a.duration
      bv = b.duration
    } else if (sortKey === 'progress') {
      av = a.progress
      bv = b.progress
    } else if (sortKey === 'playCount') {
      av = a.playCount
      bv = b.playCount
    } else if (sortKey === 'title') {
      av = a.title
      bv = b.title
    } else {
      av = +new Date(a.uploadedAt)
      bv = +new Date(b.uploadedAt)
    }
    if (typeof av === 'string' && typeof bv === 'string') {
      return order === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    }
    return order === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
  })
  const page = q.page ?? 1
  const pageSize = q.pageSize ?? 12
  const total = list.length
  return {
    list: list.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    pageSize,
  }
}

export async function fetchAllVideos(): Promise<VideoItem[]> {
  await delay(120)
  return [...store.videos]
}

export async function fetchVideo(id: string): Promise<VideoItem | undefined> {
  await delay(220)
  return store.videos.find((v) => v.id === id)
}

export async function addVideos(items: Partial<VideoItem>[]): Promise<VideoItem[]> {
  await delay(700)
  const created = items.map((item, i) => {
    const id = `vid_${String(store.videos.length + i + 1).padStart(3, '0')}`
    const base = store.videos[0]
    return {
      ...base,
      id,
      title: item.title || `未命名视频 ${i + 1}`,
      description: item.description || '通过本地上传导入的视频，尚未填写简介。',
      coverUrl: `https://picsum.photos/seed/${id}/640/360`,
      duration: item.duration ?? 240 + i * 60,
      category: (item.category as VideoItem['category']) ?? '新闻资讯',
      tags: item.tags ?? ['待标注'],
      status: 'analyzing' as const,
      progress: 6 + i * 5,
      uploadedAt: new Date().toISOString(),
      analyzedAt: undefined,
      analysisCost: undefined,
      playCount: 0,
      uploaderId: 'u06',
      uploaderName: '顾南枝',
    }
  })
  store.videos = [...created, ...store.videos]
  persist()
  return created
}

export async function updateVideo(id: string, patch: Partial<VideoItem>): Promise<VideoItem | undefined> {
  await delay(280)
  const idx = store.videos.findIndex((v) => v.id === id)
  if (idx < 0) return undefined
  store.videos[idx] = { ...store.videos[idx], ...patch }
  persist()
  return store.videos[idx]
}

export async function deleteVideos(ids: string[]): Promise<void> {
  await delay(420)
  store.videos = store.videos.filter((v) => !ids.includes(v.id))
  persist()
}

export async function fetchTasks(): Promise<AnalysisTask[]> {
  await delay(260)
  return [...tasks]
}

export async function fetchReviews(status?: string): Promise<ReviewItem[]> {
  await delay(300)
  return status && status !== 'all' ? store.reviews.filter((r) => r.status === status) : [...store.reviews]
}

export async function fetchReview(id: string): Promise<ReviewItem | undefined> {
  await delay(200)
  return store.reviews.find((r) => r.id === id)
}

export async function reviewReviewsByVideo(videoId: string): Promise<ReviewItem[]> {
  await delay(240)
  return store.reviews.filter((r) => r.videoId === videoId)
}

export async function updateReview(
  id: string,
  patch: Partial<ReviewItem>,
): Promise<ReviewItem | undefined> {
  await delay(260)
  const idx = store.reviews.findIndex((r) => r.id === id)
  if (idx < 0) return undefined
  store.reviews[idx] = { ...store.reviews[idx], ...patch }
  persist()
  return store.reviews[idx]
}

export async function fetchModels(): Promise<ModelItem[]> {
  await delay(280)
  return [...models]
}

export async function fetchUsers(): Promise<UserItem[]> {
  await delay(280)
  return [...store.users]
}

export async function createUser(u: Omit<UserItem, 'id' | 'avatarUrl' | 'lastLoginAt'>): Promise<UserItem> {
  await delay(360)
  const item: UserItem = {
    ...u,
    id: `u${String(store.users.length + 1).padStart(2, '0')}`,
    avatarUrl: `https://i.pravatar.cc/80?img=${20 + store.users.length}`,
    lastLoginAt: new Date().toISOString(),
  }
  store.users = [...store.users, item]
  persist()
  return item
}

export async function updateUser(id: string, patch: Partial<UserItem>): Promise<void> {
  await delay(280)
  store.users = store.users.map((u) => (u.id === id ? { ...u, ...patch } : u))
  persist()
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  await delay(320)
  return [...auditLogs]
}

export async function fetchNotifications(): Promise<Notification[]> {
  await delay(180)
  return [...store.notifications]
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
  await delay(120)
  store.notifications = store.notifications.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n))
  persist()
}

export async function fetchProjects(): Promise<ProjectItem[]> {
  await delay(260)
  return [...store.projects]
}

export async function fetchProject(id: string): Promise<ProjectItem | undefined> {
  await delay(160)
  return store.projects.find((p) => p.id === id)
}

export async function createProject(input: {
  name: string
  videoId: string
  coverUrl: string
  duration: number
  clipCount: number
  status?: ProjectItem['status']
}): Promise<ProjectItem> {
  await delay(360)
  const item: ProjectItem = {
    id: `prj_${String(store.projects.length + 1).padStart(3, '0')}`,
    name: input.name,
    videoId: input.videoId,
    coverUrl: input.coverUrl,
    duration: input.duration,
    clipCount: input.clipCount,
    status: input.status ?? '草稿',
    updatedAt: new Date().toISOString(),
  }
  store.projects = [item, ...store.projects]
  persist()
  return item
}

export async function updateProject(id: string, patch: Partial<ProjectItem>): Promise<ProjectItem | undefined> {
  await delay(200)
  const idx = store.projects.findIndex((p) => p.id === id)
  if (idx < 0) return undefined
  store.projects[idx] = { ...store.projects[idx], ...patch, updatedAt: new Date().toISOString() }
  persist()
  return store.projects[idx]
}

export async function fetchSpaces() {
  await delay(200)
  return [...spaces]
}

export async function fetchApiKeys() {
  await delay(220)
  return [...store.apiKeys]
}

export async function createApiKey(name: string, scope: string) {
  await delay(400)
  const key = `sk-live-${Math.random().toString(16).slice(2, 18)}${Math.random().toString(16).slice(2, 18)}`
  const item = {
    id: `key_${String(store.apiKeys.length + 1).padStart(2, '0')}`,
    name,
    key,
    scope,
    createdAt: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
    status: 'active',
  }
  store.apiKeys = [item, ...store.apiKeys]
  return item
}

export async function searchVideos(query: string): Promise<SearchHit[]> {
  await delay(1500)
  const hit = searchPresets.find((p) => p.query.includes(query) || query.includes(p.query.slice(0, 6)))
  if (hit) return hit.hits
  return fallbackSearch(query)
}

export async function fetchAnalysis(videoId: string) {
  await delay(420)
  return getAnalysis(videoId)
}

export async function fetchDashboard() {
  await delay(300)
  const list = store.videos
  const completed = list.filter((v) => v.status === 'completed')
  const totalSeconds = completed.reduce((s, v) => s + v.duration, 0)
  const avgCost = Math.round(
    completed.reduce((s, v) => s + (v.analysisCost ?? 0), 0) / Math.max(1, completed.length),
  )
  const tagCount = new Map<string, number>()
  list.forEach((v) => v.tags.forEach((t) => tagCount.set(t, (tagCount.get(t) ?? 0) + 1)))
  const topTags = [...tagCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
  const catCount = new Map<string, number>()
  list.forEach((v) => catCount.set(v.category, (catCount.get(v.category) ?? 0) + 1))
  const categories = [...catCount.entries()].map(([name, value]) => ({ name, value }))
  const durBuckets = [
    { name: '1 分钟内', min: 0, max: 60 },
    { name: '1-5 分钟', min: 60, max: 300 },
    { name: '5-15 分钟', min: 300, max: 900 },
    { name: '15-30 分钟', min: 900, max: 1800 },
    { name: '30-60 分钟', min: 1800, max: 3600 },
    { name: '60 分钟以上', min: 3600, max: 999999 },
  ]
  const durationDist = durBuckets.map((b) => ({
    name: b.name,
    value: list.filter((v) => v.duration >= b.min && v.duration < b.max).length,
  }))
  const reviewStat = {
    passed: store.reviews.filter((r) => r.status === 'passed').length,
    pending: store.reviews.filter((r) => r.status === 'pending').length,
    rejected: store.reviews.filter((r) => r.status === 'rejected').length,
    doubt: store.reviews.filter((r) => r.status === 'doubt').length,
  }
  const trend = Array.from({ length: 30 }, (_, i) => {
    const d = new Date('2026-10-19T00:00:00+08:00')
    d.setDate(d.getDate() - (29 - i))
    const seed = (i * 37) % 23
    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      tasks: 3 + seed + (i % 4),
      hours: Math.round((2 + seed * 0.42) * 10) / 10,
    }
  })
  const modelCalls = models.map((m) => ({ name: m.name.split(' ')[0], value: m.calls }))
  return {
    totalVideos: list.length,
    totalSeconds,
    monthTasks: 128,
    avgCost,
    violationRate: ((reviewStat.rejected + reviewStat.pending) / Math.max(1, store.reviews.length)) * 100,
    searchCount: 1284,
    topTags,
    categories,
    durationDist,
    reviewStat,
    trend,
    modelCalls,
  }
}
