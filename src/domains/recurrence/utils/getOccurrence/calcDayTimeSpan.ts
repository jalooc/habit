const MINUTES_IN_DAY = 24 * 60

type Time = {
  hour: number, minute: number,
}

type DayBoundaries = {
  start: Time,
  end: Time,
}

export default (dayBoundaries: DayBoundaries) => {
  const endMinutes = dayBoundaries.end.hour * 60 + dayBoundaries.end.minute
  const startMinutes = dayBoundaries.start.hour * 60 + dayBoundaries.start.minute

  if (startMinutes === endMinutes) {
    throw new RangeError('Day boundaries can\'t be zero-duration.')
  }

  const areDayBoundariesAcrossMidnight = startMinutes > endMinutes

  if (!areDayBoundariesAcrossMidnight) {
    return {
      dayTimeSpan: endMinutes - startMinutes,
      startMinutes,
      endMinutes,
    }
  } else {
    const previousDayPart = MINUTES_IN_DAY - startMinutes
    const nextDayPart = endMinutes

    return {
      dayTimeSpan: previousDayPart + nextDayPart,
      startMinutes,
      endMinutes,
    }
  }
}
