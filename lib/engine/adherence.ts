export type SessionStatus = 'completed' | 'partial' | 'missed' | 'in_progress'

export function calculateAdherence(statuses: SessionStatus[]) {
  const scheduled = statuses.filter(status => status !== 'in_progress').length
  const completed = statuses.filter(status => status === 'completed').length
  const partial = statuses.filter(status => status === 'partial').length
  const missed = statuses.filter(status => status === 'missed').length
  const weightedCompleted = completed + partial * 0.5
  const percent = scheduled ? Math.round((weightedCompleted / scheduled) * 100) : 0
  return { scheduled, completed, partial, missed, percent }
}
