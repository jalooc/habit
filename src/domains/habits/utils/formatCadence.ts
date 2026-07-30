import { Recurrence, WEEKDAYS } from 'src/domains/habits/screens/EditSchedule/recurrence'

const formatCadence = (recurrence: Recurrence) => ({
  'times-per-day': () =>
    recurrence.value === 1 ? 'Once a day' : `${recurrence.value}× a day`,
  'every-x-hours': () =>
    recurrence.value === 1 ? 'Every hour' : `Every ${recurrence.value} hours`,
  'every-x-days': () =>
    recurrence.value === 1 ? 'Once a day' : `Every ${recurrence.value} days`,
  'times-per-week': () => {
    const { specificDays, value } = recurrence
    const dayCount = specificDays ? WEEKDAYS.filter(day => specificDays[day]).length : value
    const isExactlyWeekdays = specificDays !== undefined && dayCount === 5 && !specificDays.sa && !specificDays.su
    if (isExactlyWeekdays) return 'Weekdays'
    return dayCount === 1 ? 'Once a week' : `${dayCount}× a week`
  },
  'times-per-month': () =>
    recurrence.value === 1 ? 'Once a month' : `${recurrence.value}× a month`,
} satisfies Record<Recurrence['type'], () => string>)[recurrence.type]()

export default formatCadence
