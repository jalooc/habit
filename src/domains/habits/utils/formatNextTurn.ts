import dayjs from 'dayjs'

import { Recurrence } from 'src/domains/recurrence/utils/recurrence'
import getOccurrence from 'src/domains/recurrence/utils/getOccurrence'
import nextTurnDueAt from 'src/domains/habits/utils/nextTurnDueAt'

const formatNextTurn = (
  recurrence: Recurrence,
  lastCompletedMs: number | undefined,
  dayBoundaries: Parameters<typeof getOccurrence['next']>[2],
): string | undefined => {
  const now = dayjs()
  const next = nextTurnDueAt({ recurrence, lastCompletedMs, now, dayBoundaries })
  if (!next) return undefined

  const time = next.format('H:mm')
  const dayDiff = next.startOf('day').diff(now.startOf('day'), 'day')

  if (dayDiff === 0) return `today · ${time}`
  if (dayDiff === 1) return `tomorrow · ${time}`
  if (dayDiff < 7) return `${next.format('ddd')} · ${time}`
  return next.format('MMM D')
}

export default formatNextTurn
