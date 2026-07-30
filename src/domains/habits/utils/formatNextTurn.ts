import dayjs from 'dayjs'

import { Recurrence } from 'src/domains/recurrence/utils/recurrence'
import getOccurrence from 'src/domains/recurrence/utils/getOccurrence'

const formatNextTurn = (
  recurrence: Recurrence,
  dayBoundaries: Parameters<typeof getOccurrence['next']>[2],
): string | undefined => {
  const now = dayjs()
  const next = getOccurrence.next(recurrence, now, dayBoundaries)
  if (!next) return undefined

  const time = next.format('H:mm')
  const dayDiff = next.startOf('day').diff(now.startOf('day'), 'day')

  if (dayDiff === 0) return `today · ${time}`
  if (dayDiff === 1) return `tomorrow · ${time}`
  if (dayDiff < 7) return `${next.format('ddd')} · ${time}`
  return next.format('MMM D')
}

export default formatNextTurn
