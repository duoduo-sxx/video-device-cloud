import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { exportCsv, exportExcel } from '@/utils/download'

export interface TableColumn {
  prop?: string
  label: string
  width?: number | string
  minWidth?: number | string
  fixed?: boolean | 'left' | 'right'
  sortable?: boolean
  slot?: string
  formatter?: (row: any) => string
  showOverflowTooltip?: boolean
}

interface Options {
  /** 列表接口 */
  api: (params: any) => Promise<{ list: any[]; total: number }>
  /** 是否把筛选条件同步到地址栏（前进后退保持状态） */
  syncQuery?: boolean
  /** 默认查询参数 */
  defaultParams?: Record<string, any>
  /** 是否在挂载时自动加载 */
  immediate?: boolean
}

export function useTable(options: Options) {
  const router = useRouter()
  const route = useRoute()

  const loading = ref(false)
  const list = ref<any[]>([])
  const total = ref(0)
  const selection = ref<any[]>([])
  const page = ref(1)
  const pageSize = ref(20)
  const sortBy = ref('')
  const sortOrder = ref<'asc' | 'desc'>('desc')

  const baseParams = ref<Record<string, any>>({ ...(options.defaultParams || {}) })

  // 从 URL 还原筛选状态
  if (options.syncQuery) {
    const q = route.query
    Object.keys(q).forEach((k) => {
      if (['page', 'pageSize', 'sortBy', 'sortOrder'].includes(k)) return
      baseParams.value[k] = q[k]
    })
    if (q.page) page.value = Number(q.page)
    if (q.pageSize) pageSize.value = Number(q.pageSize)
    if (q.sortBy) sortBy.value = String(q.sortBy)
    if (q.sortOrder) sortOrder.value = q.sortOrder as 'asc' | 'desc'
  }

  const queryParams = computed(() => {
    const params: Record<string, any> = {
      page: page.value,
      pageSize: pageSize.value,
      ...baseParams.value
    }
    if (sortBy.value) {
      params.sortBy = sortBy.value
      params.sortOrder = sortOrder.value
    }
    return params
  })

  function cleanParams(p: Record<string, any>): Record<string, any> {
    const out: Record<string, any> = {}
    Object.keys(p).forEach((k) => {
      const v = p[k]
      if (v === '' || v === null || v === undefined) return
      if (Array.isArray(v) && !v.length) return
      out[k] = Array.isArray(v) ? v.join(',') : v
    })
    return out
  }

  function syncUrl(): void {
    if (!options.syncQuery) return
    const q = cleanParams({ ...baseParams.value, page: page.value, pageSize: pageSize.value, sortBy: sortBy.value, sortOrder: sortOrder.value })
    router.replace({ path: route.path, query: q })
  }

  async function load(): Promise<void> {
    loading.value = true
    try {
      const res = await options.api(cleanParams(queryParams.value))
      list.value = res.list || []
      total.value = res.total || 0
    } catch (e) {
      list.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  function search(): void {
    page.value = 1
    syncUrl()
    load()
  }

  function reset(): void {
    baseParams.value = { ...(options.defaultParams || {}) }
    page.value = 1
    sortBy.value = ''
    sortOrder.value = 'desc'
    syncUrl()
    load()
  }

  function onPageChange(p: number): void {
    page.value = p
    syncUrl()
    load()
  }

  function onSizeChange(s: number): void {
    pageSize.value = s
    page.value = 1
    syncUrl()
    load()
  }

  function onSortChange(payload: { prop: string; order: string | null }): void {
    if (!payload.order) {
      sortBy.value = ''
    } else {
      sortBy.value = payload.prop
      sortOrder.value = payload.order === 'ascending' ? 'asc' : 'desc'
    }
    syncUrl()
    load()
  }

  function onSelectionChange(rows: any[]): void {
    selection.value = rows
  }

  /** 导出当前筛选条件下的全部数据（拉取大分页） */
  async function exportData(
    headers: { key: string; label: string }[],
    filename: string,
    type: 'csv' | 'excel' = 'excel',
    max = 5000
  ): Promise<void> {
    try {
      const res = await options.api(cleanParams({ ...queryParams.value, page: 1, pageSize: max }))
      const rows = (res.list || []).map((r: any) => {
        const o: Record<string, any> = {}
        headers.forEach((h) => {
          const v = h.key.split('.').reduce((acc: any, k) => (acc ? acc[k] : ''), r)
          o[h.key] = v === null || v === undefined ? '' : v
        })
        return o
      })
      if (!rows.length) {
        ElMessage.warning('当前筛选条件下没有数据可导出')
        return
      }
      if (type === 'csv') exportCsv(filename, rows, headers)
      else await exportExcel(filename, rows, headers)
    } catch {
      ElMessage.error('导出失败，请稍后重试')
    }
  }

  if (options.immediate !== false) {
    onMounted(load)
  }

  return {
    loading,
    list,
    total,
    page,
    pageSize,
    sortBy,
    sortOrder,
    selection,
    baseParams,
    queryParams,
    load,
    search,
    reset,
    onPageChange,
    onSizeChange,
    onSortChange,
    onSelectionChange,
    exportData
  }
}

/** 分页配置快捷对象 */
export const paginationLayout = 'total, sizes, prev, pager, next, jumper'
export const paginationSizes = [10, 20, 50, 100]
