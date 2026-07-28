export type AutomationStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'skipped'

export function automationStatusLabel(status: AutomationStatus | string) {
  if (status === 'completed') return 'Completed'
  if (status === 'failed') return 'Failed'
  if (status === 'processing') return 'Processing'
  if (status === 'skipped') return 'Skipped'
  return 'Queued'
}

export function automationTone(status: AutomationStatus | string) {
  if (status === 'completed') return 'pill-success'
  if (status === 'failed') return 'pill-danger'
  return ''
}

export function safeError(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 500) : 'Unknown automation error'
}
