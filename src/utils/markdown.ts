/**
 * 轻量 Markdown 渲染（不引入第三方依赖，适配打包体积与离线约束）
 * 支持：标题、段落、粗体、行内代码、代码块、有序/无序列表、引用、表格、分割线
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inline(text: string): string {
  let out = escapeHtml(text)
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>')
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
  return out
}

export function renderMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const html: string[] = []
  let inCode = false
  let codeLines: string[] = []
  let listType: 'ul' | 'ol' | null = null
  let tableBuffer: string[] = []

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`)
      listType = null
    }
  }

  const flushTable = () => {
    if (!tableBuffer.length) return
    const rows = tableBuffer.filter((r) => !/^[\s|:-]+$/.test(r))
    const cells = rows.map((r) => r.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim()))
    if (cells.length) {
      html.push('<table><thead><tr>' + cells[0].map((c) => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>')
      cells.slice(1).forEach((row) => {
        html.push('<tr>' + row.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>')
      })
      html.push('</tbody></table>')
    }
    tableBuffer = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
        codeLines = []
        inCode = false
      } else {
        closeList()
        flushTable()
        inCode = true
      }
      continue
    }
    if (inCode) {
      codeLines.push(line)
      continue
    }

    if (/^\|.*\|$/.test(trimmed)) {
      closeList()
      tableBuffer.push(trimmed)
      continue
    }
    if (tableBuffer.length) flushTable()

    if (!trimmed) {
      closeList()
      continue
    }

    if (/^###\s+/.test(trimmed)) {
      closeList()
      html.push(`<h3>${inline(trimmed.replace(/^###\s+/, ''))}</h3>`)
      continue
    }
    if (/^##\s+/.test(trimmed)) {
      closeList()
      html.push(`<h2>${inline(trimmed.replace(/^##\s+/, ''))}</h2>`)
      continue
    }
    if (/^#\s+/.test(trimmed)) {
      closeList()
      html.push(`<h3>${inline(trimmed.replace(/^#\s+/, ''))}</h3>`)
      continue
    }
    if (/^>\s?/.test(trimmed)) {
      closeList()
      html.push(`<blockquote>${inline(trimmed.replace(/^>\s?/, ''))}</blockquote>`)
      continue
    }
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      closeList()
      html.push('<hr/>')
      continue
    }

    const ol = trimmed.match(/^(\d+)\.\s+(.*)$/)
    if (ol) {
      if (listType !== 'ol') {
        closeList()
        html.push('<ol>')
        listType = 'ol'
      }
      html.push(`<li>${inline(ol[2])}</li>`)
      continue
    }
    if (/^[-*]\s+/.test(trimmed)) {
      if (listType !== 'ul') {
        closeList()
        html.push('<ul>')
        listType = 'ul'
      }
      html.push(`<li>${inline(trimmed.replace(/^[-*]\s+/, ''))}</li>`)
      continue
    }

    closeList()
    html.push(`<p>${inline(trimmed)}</p>`)
  }

  if (inCode && codeLines.length) html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
  closeList()
  flushTable()
  return html.join('\n')
}
