import dayjs from 'dayjs'

type ActiveHours = {
  start: { hour: number, minute: number },
  end: { hour: number, minute: number },
}

// End instant of the active-hours window that currently contains `now`; if `now`
// is in the quiet gap between windows, the end of the next upcoming window.
// Wrapping windows (end <= start, e.g. 10:00–02:00) span into the next day.
const currentActiveWindowEnd = (now: number, activeHours: ActiveHours): number => {
  const startMin = activeHours.start.hour * 60 + activeHours.start.minute
  const endMin = activeHours.end.hour * 60 + activeHours.end.minute
  const durationMin = endMin > startMin ? endMin - startMin : endMin - startMin + 24 * 60

  // candidate window-ends for windows starting yesterday / today / tomorrow, ascending
  const candidateEnds = [-1, 0, 1].map(dayOffset =>
    dayjs(now).startOf('day').add(dayOffset, 'day')
      .hour(activeHours.start.hour).minute(activeHours.start.minute).second(0).millisecond(0)
      .add(durationMin, 'minute').valueOf(),
  )

  return candidateEnds.find(end => end >= now) ?? dayjs(now).endOf('day').valueOf()
}

export default (occurrenceMs: number, now: number, activeHours: ActiveHours): boolean =>
  occurrenceMs <= currentActiveWindowEnd(now, activeHours)
