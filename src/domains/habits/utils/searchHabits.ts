import Fuse, { type FuseResult, type IFuseOptions } from 'fuse.js'
import habits$ from 'src/domains/habits/stores/habits'
import groups$ from 'src/domains/habits/stores/groups'

export type SearchableHabit = {
  id: string,
  name: string,
  description?: string,
  images?: string[],
  isInRotation: boolean,
  rotationInfo: string,
}

export type HabitSearchResult = SearchableHabit & {
  score: number,
  matches: FuseResult<SearchableHabit>['matches'],
}

const fuseOptions = {
  keys: ['name'],
  threshold: 0.35,
  ignoreLocation: true,
  includeMatches: true,
  ignoreDiacritics: true,
  minMatchCharLength: 3,
} satisfies IFuseOptions<SearchableHabit>

const getHabitRotationInfo = (habitId: string, currentGroupId?: string) => {
  const groupsMap = groups$.peek()
  const memberGroupIds = Object.keys(groupsMap).filter(id => habitId in groupsMap[id].habits)

  if (memberGroupIds.length === 0) return ''

  const names = memberGroupIds.map(id => groupsMap[id].name)
  const firstGroupName = names[0]
  const restCount = names.length - 1

  if (currentGroupId && memberGroupIds.length === 1 && memberGroupIds[0] === currentGroupId) {
    return 'Already in this rotation'
  }

  if (restCount === 0) return firstGroupName
  if (restCount === 1) return `${firstGroupName} · ${names[1]}`
  return `${firstGroupName} · ${restCount} more`
}

const buildSearchableHabits = (groupId: string): SearchableHabit[] => {
  const habitsMap = habits$.peek()
  const groupsMap = groups$.peek()
  const groupHabits = groupId in groupsMap ? groupsMap[groupId].habits : {}

  return Object.entries(habitsMap).map(([habitId, habit]) => ({
    id: habitId,
    name: habit.name,
    description: habit.description,
    images: habit.images,
    isInRotation: habitId in groupHabits,
    rotationInfo: getHabitRotationInfo(habitId, groupId),
  }))
}

const getFuseIndex = (habits: SearchableHabit[]) => new Fuse(habits, fuseOptions)

export default (groupId: string, query: string): HabitSearchResult[] => {
  const trimmed = query.trim()
  if (!trimmed) return []

  const searchable = buildSearchableHabits(groupId)
  if (searchable.length === 0) return []

  const fuse = getFuseIndex(searchable)
  return fuse.search(trimmed).map(result => ({
    ...result.item,
    score: result.score ?? 1,
    matches: result.matches,
  }))
}
