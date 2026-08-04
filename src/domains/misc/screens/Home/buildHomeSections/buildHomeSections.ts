import orderQueue from 'src/domains/habits/utils/orderQueue'
import isGroupDue from 'src/domains/habits/utils/isGroupDue'
import nextTurnDueAt from 'src/domains/habits/utils/nextTurnDueAt'
import lastCompletedInGroup from 'src/domains/habits/utils/lastCompletedInGroup'
import type { HabitsStores } from 'src/domains/habits/stores/habits'
import { Recurrence } from 'src/domains/recurrence/utils/recurrence'
import getOccurrence from 'src/domains/recurrence/utils/getOccurrence'

import isWithinTodayWindow from './isWithinTodayWindow'
import { Dayjs } from 'dayjs'

const NOW_WINDOW_MS = 15 * 60 * 1000

// Only what bucketing needs from a group — satisfied by both the live store
// (GroupsStore, whose values are `… | undefined`) and plain test doubles.
type GroupInput = {
  name: string,
  habits: Record<string, true>,
  recurrence?: Recurrence,
}

type RowBase = {
  groupId: string,
  groupName: string,
  habitId: string,
  habitName: string,
}

export type CarriedRow = RowBase & { dueSinceMs: number }
export type UpNextRow = RowBase & ({ kind: 'now' } | { kind: 'upcoming', dueAtMs: number })

export type HomeSections = {
  carried: CarriedRow[],
  upNext: UpNextRow[],
  otherGroupIds: string[],
}

type NowRow = RowBase & { kind: 'now', elapsed: number, isNew: boolean }
type UpcomingRow = RowBase & { kind: 'upcoming', dueAtMs: number }

const buildHomeSections = (params: {
  groups: Record<string, GroupInput | undefined>,
  habits: HabitsStores,
  dayBoundaries: { start: { hour: number, minute: number }, end: { hour: number, minute: number }},
  now: Dayjs,
}): HomeSections => {
  const { groups, habits, dayBoundaries, now } = params

  const carried: CarriedRow[] = []
  const nowRows: NowRow[] = []
  const upcomingRows: UpcomingRow[] = []
  const otherGroupIds: string[] = []

  for (const [groupId, group] of Object.entries(groups)) {
    if (!group) continue

    const habitIds = Object.keys(group.habits)
    const { recurrence } = group

    if (habitIds.length === 0 || !recurrence) {
      otherGroupIds.push(groupId)
      continue
    }

    const [upNextId] = orderQueue(habitIds, habits)
    const base: RowBase = {
      groupId,
      groupName: group.name,
      habitId: upNextId,
      habitName: habits[upNextId].name,
    }

    const previousOccurrence = getOccurrence.previous(recurrence, now, dayBoundaries)
    const lastCompletedMs = lastCompletedInGroup(habitIds, habits)
    const behind = isGroupDue({ recurrence, lastCompletedMs, now, dayBoundaries })

    if (behind && previousOccurrence) {
      const elapsed = now.diff(previousOccurrence, 'milliseconds')
      const isNew = habitIds.every(id => habits[id].lastActioned === undefined)
      // A never-actioned rotation is new, not "carried" — it has no history to fall behind on,
      // so surface it at the top of Up next. Once anything in it has been actioned (a skip counts
      // as history, even though it doesn't satisfy the turn) it can fall behind like any other.
      // A rotation that fell behind only within the NOW window also reads as "now" rather than carried.
      if (isNew || elapsed <= NOW_WINDOW_MS) {
        nowRows.push({ ...base, kind: 'now', elapsed, isNew })
      } else {
        carried.push({ ...base, dueSinceMs: elapsed })
      }
      continue
    }

    const nextOccurrenceMs = nextTurnDueAt({ recurrence, lastCompletedMs, now, dayBoundaries })?.valueOf()
    if (nextOccurrenceMs !== undefined && isWithinTodayWindow(nextOccurrenceMs, now.valueOf(), dayBoundaries)) {
      upcomingRows.push({ ...base, kind: 'upcoming', dueAtMs: nextOccurrenceMs })
    } else {
      otherGroupIds.push(groupId)
    }
  }

  carried.sort((a, b) => b.dueSinceMs - a.dueSinceMs)
  // new rotations first, then most-overdue first
  nowRows.sort((a, b) => Number(b.isNew) - Number(a.isNew) || b.elapsed - a.elapsed)
  upcomingRows.sort((a, b) => a.dueAtMs - b.dueAtMs)

  const upNext: UpNextRow[] = [
    ...nowRows.map(({ elapsed: _elapsed, isNew: _isNew, ...rest }): UpNextRow => rest),
    ...upcomingRows,
  ]

  return { carried, upNext, otherGroupIds }
}

export default buildHomeSections
