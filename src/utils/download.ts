/**
 * 导出工具：优先导出 Excel，若 xlsx 不可用则降级为 CSV
 */
import { ElMessage } from 'element-plus'

function toCsv(rows: Record<string, any>[], headers: { key: string; label: string }[]): string {
  const esc = (v: any) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const head = headers.map((h) => esc(h.label)).join(',')
  const body = rows.map((r) => headers.map((h) => esc(r[h.key])).join(',')).join('\n')
  return '\ufeff' + head + '\n' + body
}

export function downloadBlob(content: BlobPart, filename: string, type = 'application/octet-stream'): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function exportCsv(filename: string, rows: Record<string, any>[], headers: { key: string; label: string }[]): void {
  downloadBlob(toCsv(rows, headers), `${filename}.csv`, 'text/csv;charset=utf-8')
  ElMessage.success(`已导出 ${rows.length} 条数据到 ${filename}.csv`)
}

/** 导出 Excel（xlsx 不可用时自动降级为 CSV） */
export async function exportExcel(filename: string, rows: Record<string, any>[], headers: { key: string; label: string }[]): Promise<void> {
  try {
    const XLSX = await import('xlsx')
    const data = rows.map((r) => {
      const obj: Record<string, any> = {}
      headers.forEach((h) => (obj[h.label] = r[h.key]))
      return obj
    })
    const sheet = XLSX.utils.json_to_sheet(data)
    sheet['!cols'] = headers.map((h) => ({ wch: Math.max(12, Math.min(36, h.label.length * 3)) }))
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, '数据')
    const buffer = XLSX.write(book, { bookType: 'xlsx', type: 'array' })
    downloadBlob(buffer, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    ElMessage.success(`已导出 ${rows.length} 条数据到 ${filename}.xlsx`)
  } catch (e) {
    console.warn('[export] xlsx 不可用，降级为 CSV 导出', e)
    exportCsv(filename, rows, headers)
  }
}

/** 导出纯文本/JSON */
export function exportJson(filename: string, data: any): void {
  downloadBlob(JSON.stringify(data, null, 2), `${filename}.json`, 'application/json')
  ElMessage.success(`已导出 ${filename}.json`)
}

/** 复制文本到剪贴板 */
export async function copyText(text: string, tip = '已复制到剪贴板'): Promise<void> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    ElMessage.success(tip)
  } catch {
    ElMessage.warning('复制失败，请手动选择文本复制')
  }
}
