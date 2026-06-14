import dayjs from 'dayjs'
import { RRuleTemporal } from 'rrule-temporal'

const formatNextTurn = (recurrence: RRuleTemporal): string | undefined => {
  const now = new Date()
  const nextInstant = recurrence.next(now)
  if (!nextInstant) return undefined

  const next = new Date(nextInstant.epochMilliseconds)
  const time = dayjs(next).format('H:mm')
  const dayDiff = dayjs(next).startOf('day').diff(dayjs(now).startOf('day'), 'day')

  if (dayDiff === 0) return `today · ${time}`
  if (dayDiff === 1) return `tomorrow · ${time}`
  if (dayDiff < 7) return `${dayjs(next).format('ddd')} · ${time}`
  return dayjs(next).format('MMM D')
}

export default formatNextTurn
