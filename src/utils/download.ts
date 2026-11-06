function save(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob(['\ufeff' + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function escapeCell(v: unknown) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(name: string, headers: string[], rows: unknown[][]) {
  const head = headers.map(escapeCell).join(',');
  const body = rows.map((r) => r.map(escapeCell).join(',')).join('\n');
  save(`${name}_${new Date().toISOString().slice(0, 10)}.csv`, `${head}\n${body}`, 'text/csv;charset=utf-8');
}

export function downloadJson(name: string, data: unknown) {
  save(`${name}.json`, JSON.stringify(data, null, 2), 'application/json');
}

export function downloadText(name: string, text: string) {
  save(name, text);
}
