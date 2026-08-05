import getOccurrence from 'src/domains/recurrence/utils/getOccurrence'

type Turn = NonNullable<ReturnType<typeof getOccurrence['currentSlot']>>

// The single source of the "served" rule: a turn is served by a completion made at or after it
// opened, and never having completed anything leaves every turn unserved.
//
// Deliberately one-sided — it asks nothing about the turn's close. A rotation missed all day is
// still served by a tick at 21:00, hours after the 18:00 turn's slot ran out, and that is what
// stops a missed turn from staying behind forever. Adding the upper bound this name might suggest
// would undo it.
const hasCompletedSinceTurnOpened = (turn: Turn, lastCompletedMs: number | undefined): boolean =>
  lastCompletedMs !== undefined && lastCompletedMs >= turn.opensAt.valueOf()

export default hasCompletedSinceTurnOpened
