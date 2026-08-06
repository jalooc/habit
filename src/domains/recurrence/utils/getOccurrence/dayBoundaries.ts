type Time = {
  hour: number, minute: number,
}

type DayBoundaries = {
  start: Time,
  end: Time,
}

const minutesIntoDay = (time: Time) => time.hour * 60 + time.minute

// Boundaries that meet leave no active hours for a recurrence to divide.
export const areDayBoundariesZeroDuration = ({ start, end }: DayBoundaries) =>
  minutesIntoDay(start) === minutesIntoDay(end)

// Whether the day time span runs past midnight into the next calendar day, which is what decides
// the day a span's opening is looked for on. Deliberately not the span's length: that is measured
// between the span's two wall-clock ends, since the night an hour is skipped or repeated is not
// the length these boundaries nominally describe.
export const areDayBoundariesAcrossMidnight = ({ start, end }: DayBoundaries) =>
  minutesIntoDay(start) > minutesIntoDay(end)
