import { toText } from 'rrule-temporal/totext'
import { Freq, RRuleTemporal } from 'rrule-temporal'

const WEEKDAY_SET = new Set(['MO', 'TU', 'WE', 'TH', 'FR'])
const ALL_WEEKDAYS = ['MO', 'TU', 'WE', 'TH', 'FR']

const isExactlyWeekdays = (days: string[]): boolean =>
  days.length === 5 && ALL_WEEKDAYS.every(d => days.includes(d))

const formatCadence = (recurrence: RRuleTemporal): string => {
  const opts = recurrence.options()
  const freq = opts.freq

  const byDay = opts.byDay?.filter(d => WEEKDAY_SET.has(d) || ['SA', 'SU'].includes(d))

  const handlers = {
    DAILY: () => {
      if (opts.byHour?.length) {
        const n = opts.byHour.length
        return n === 1 ? 'Once a day' : `${n}× a day`
      }
      const interval = opts.interval ?? 1
      return interval === 1 ? 'Once a day' : `Every ${interval} days`
    },
    HOURLY: () => {
      const interval = opts.interval ?? 1
      return interval === 1 ? 'Every hour' : `Every ${interval} hours`
    },
    MINUTELY: () => {
      const interval = opts.interval ?? 1
      return interval === 1 ? 'Every minute' : `Every ${interval} minutes`
    },
    WEEKLY: () => {
      const interval = opts.interval ?? 1
      if (interval > 1) return `Every ${interval} weeks`
      const days = byDay ?? []
      if (days.length === 0) return 'Once a week'
      if (isExactlyWeekdays(days)) return 'Weekdays'
      return days.length === 1 ? 'Once a week' : `${days.length}× a week`
    },
    MONTHLY: () => {
      const interval = opts.interval ?? 1
      return interval === 1 ? 'Once a month' : `Every ${interval} months`
    },
  } satisfies Partial<Record<Freq, () => string>>

  const isHandler = (freq: Freq): freq is keyof typeof handlers => freq in handlers

  const handler = isHandler(freq) ? handlers[freq] : undefined
  if (handler) return handler()

  return toText(String(recurrence)).toLowerCase()
}

export default formatCadence
