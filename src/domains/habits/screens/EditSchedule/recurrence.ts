import { RRuleTemporal } from 'rrule-temporal'
import { objectFromEntries } from 'tsafe'

export const WEEKDAYS = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'] as const

export type Weekday = typeof WEEKDAYS[number]

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mo: 'Mon', tu: 'Tue', we: 'Wed', th: 'Thu', fr: 'Fri', sa: 'Sat', su: 'Sun',
}

export type RecurrenceType =
  'times-per-day' |
  'every-x-hours' |
  'every-x-days' |
  'times-per-week' |
  'times-per-month'

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

export const distributeMonthDays = (count: number): number[] => {
  if (count >= 28) return Array.from({ length: 28 }, (_, i) => i + 1)
  const step = 28 / count
  return Array.from({ length: count }, (_, i) => Math.round(i * step) + 1)
}

export type Recurrence = {
  type: RecurrenceType,
  value: number,
  specificDays?: Record<Weekday, boolean>,
}

export const parseRRule = (rruleString: string): Recurrence => {
  const rule = new RRuleTemporal({ rruleString })
  const opts = rule.options()
  const weekdaySet = new Set<string>(WEEKDAYS)
  // rrule-temporal normalizes BYDAY to uppercase ('MO'), our Weekday values are lowercase
  const byDay = opts.byDay?.map(d => d.toLowerCase()).filter((d): d is Weekday => weekdaySet.has(d))
  const days = byDay?.length ? byDay : undefined

  const parsers: Partial<Record<string, () => Recurrence>> = {
    HOURLY: () => ({ type: 'every-x-hours', value: opts.interval ?? 1 }),
    DAILY: () =>
      opts.byHour?.length ?
        { type: 'times-per-day', value: opts.byHour.length } :
        { type: 'every-x-days', value: opts.interval ?? 1 },
    WEEKLY: () => ({
      type: 'times-per-week',
      value: days?.length ?? 1,
      specificDays: days && objectFromEntries(WEEKDAYS.map(weekday => [
        weekday,
        days.includes(weekday),
      ])),
    }),
    MONTHLY: () => ({
      type: 'times-per-month',
      value: opts.byMonthDay?.length ?? 1,
    }),
  }

  return parsers[opts.freq]?.() ?? { type: 'every-x-days', value: 1 }
}

export const RECURRENCE_TYPES = [
  'times-per-day',
  'every-x-hours',
  'every-x-days',
  'times-per-week',
  'times-per-month',
] as const satisfies readonly RecurrenceType[]
