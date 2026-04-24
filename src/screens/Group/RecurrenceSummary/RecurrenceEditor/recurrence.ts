import { RRuleTemporal } from 'rrule-temporal'
import { Temporal } from '@js-temporal/polyfill'

export const WEEKDAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const

export type Weekday = typeof WEEKDAYS[number]

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  MO: 'Mon', TU: 'Tue', WE: 'Wed', TH: 'Thu', FR: 'Fri', SA: 'Sat', SU: 'Sun'
}

export type RecurrenceType =
  | 'times-per-day'
  | 'every-x-hours'
  | 'every-x-days'
  | 'times-per-week'
  | 'times-per-month'

export type RecurrenceConfig = {
  type: RecurrenceType
  value: number
  specificDays?: Weekday[]
  restrictDays?: Weekday[]
}

export const RECURRENCE_TYPE_LABELS: Record<RecurrenceType, string> = {
  'times-per-day': 'Times per day',
  'every-x-hours': 'Every X hours',
  'every-x-days': 'Every X days',
  'times-per-week': 'Times per week',
  'times-per-month': 'Times per month',
}

export const RECURRENCE_TYPE_DESCRIPTIONS: Record<RecurrenceType, string> = {
  'times-per-day': 'Evenly spaced throughout your day',
  'every-x-hours': 'Repeat at a fixed hour interval',
  'every-x-days': 'Repeat at a fixed day interval',
  'times-per-week': 'Set number of times each week',
  'times-per-month': 'Set number of times each month',
}

export const distributeWeekdays = (count: number): Weekday[] => {
  if (count >= 7) return [...WEEKDAYS]
  const step = 7 / count
  return Array.from({ length: count }, (_, i) => WEEKDAYS[Math.round(i * step) % 7])
}

export const distributeMonthDays = (count: number): number[] => {
  if (count >= 28) return Array.from({ length: 28 }, (_, i) => i + 1)
  const step = 28 / count
  return Array.from({ length: count }, (_, i) => Math.round(i * step) + 1)
}

export const buildRRule = (
  config: RecurrenceConfig,
  dayBoundaries: { start: { hour: number; minute: number }; end: { hour: number; minute: number } }
): RRuleTemporal => {
  const now = Temporal.Now.zonedDateTimeISO()
  const baseOpts = {
    dtstart: now,
    tzid: Temporal.Now.timeZoneId(),
  }

  const addDayRestriction = (byDay?: Weekday[]) =>
    config.restrictDays?.length ? config.restrictDays : byDay

  // TODO: this is all potentially wrong, written by AI
  const ruleBuilders: Record<RecurrenceType, () => RRuleTemporal> = {
    'times-per-day': () => {
      const startMinutes = dayBoundaries.start.hour * 60 + dayBoundaries.start.minute
      const endMinutes = dayBoundaries.end.hour * 60 + dayBoundaries.end.minute
      const spanMinutes = endMinutes - startMinutes
      const hours = [...new Set(
        Array.from(
          { length: config.value },
          (_, i) => Math.round((startMinutes + (i + 1) * spanMinutes / (config.value + 1)) / 60)
        )
      )].sort((a, b) => a - b)
      return new RRuleTemporal({
        ...baseOpts,
        freq: 'DAILY',
        byHour: hours,
        byMinute: [0],
        byDay: addDayRestriction(),
      })
    },
    'every-x-hours': () => new RRuleTemporal({
      ...baseOpts,
      freq: 'HOURLY',
      interval: config.value,
      byDay: addDayRestriction(),
    }),
    'every-x-days': () => new RRuleTemporal({
      ...baseOpts,
      freq: 'DAILY',
      interval: config.value,
      byDay: addDayRestriction(),
    }),
    'times-per-week': () => {
      const days = config.specificDays?.length
        ? config.specificDays
        : distributeWeekdays(config.value)
      return new RRuleTemporal({
        ...baseOpts,
        freq: 'WEEKLY',
        byDay: addDayRestriction(days),
      })
    },
    'times-per-month': () => {
      const monthDays = distributeMonthDays(config.value)
      return new RRuleTemporal({
        ...baseOpts,
        freq: 'MONTHLY',
        byMonthDay: monthDays,
        byDay: addDayRestriction(),
      })
    },
  }

  return ruleBuilders[config.type]()
}

export const parseRRule = (rruleString: string): RecurrenceConfig => {
  const rule = new RRuleTemporal({ rruleString })
  const opts = rule.options()
  const weekdaySet = new Set<string>(WEEKDAYS)
  const byDay = opts.byDay?.filter((d): d is Weekday => weekdaySet.has(d))
  const days = byDay?.length ? byDay : undefined

  const parsers: Record<string, () => RecurrenceConfig> = {
    HOURLY: () => ({ type: 'every-x-hours', value: opts.interval ?? 1, restrictDays: days }),
    DAILY: () =>
      opts.byHour?.length
        ? { type: 'times-per-day', value: opts.byHour.length, restrictDays: days }
        : { type: 'every-x-days', value: opts.interval ?? 1, restrictDays: days },
    WEEKLY: () => ({
      type: 'times-per-week',
      value: days?.length ?? 1,
      specificDays: days,
    }),
    MONTHLY: () => ({
      type: 'times-per-month',
      value: opts.byMonthDay?.length ?? 1,
      restrictDays: days,
    }),
  }

  const parser = opts.freq ? parsers[opts.freq] : undefined
  if (!parser) {
    return { type: 'every-x-days', value: 1 }
  }
  return parser()
}

export const RECURRENCE_TYPES = [
  'times-per-day',
  'every-x-hours',
  'every-x-days',
  'times-per-week',
  'times-per-month',
] as const satisfies readonly RecurrenceType[]


