export function csvEscape(value: unknown): string {
  const text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value)
  return `"${text.replaceAll('"', '""')}"`
}
export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return ''
  const headers = [...new Set(rows.flatMap(Object.keys))]
  return [headers.map(csvEscape).join(','), ...rows.map(row => headers.map(h => csvEscape(row[h])).join(','))].join('\n')
}
