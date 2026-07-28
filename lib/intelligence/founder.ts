export type FounderMetric = {
  label: string
  value: string
  detail?: string
  tone?: 'neutral' | 'positive' | 'warning' | 'danger'
}

export function eurosFromCents(cents: number | null | undefined) {
  return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format((cents ?? 0) / 100)
}

export function percentage(part: number, total: number) {
  if (total <= 0) return '0%'
  return `${Math.round((part / total) * 100)}%`
}

export function healthLabel(status?: string | null) {
  if (status === 'healthy') return 'Healthy'
  if (status === 'degraded') return 'Degraded'
  if (status === 'down') return 'Down'
  return 'Unknown'
}
