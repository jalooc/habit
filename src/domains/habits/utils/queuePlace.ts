const SUFFIX_BY_LAST_DIGIT: Partial<Record<number, string>> = { 1: 'st', 2: 'nd', 3: 'rd' }

const ordinalSuffix = (n: number) => {
  const teens = n % 100
  if (teens >= 11 && teens <= 13) return 'th'

  return SUFFIX_BY_LAST_DIGIT[n % 10] ?? 'th'
}

export const splitQueuePlace = (index: number, count: number) => ({
  isUpNext: index === 0,
  place: index === 0 ? 'up next' : `${index + 1}${ordinalSuffix(index + 1)}`,
  ofTotal: ` of ${count}`,
})

export const formatQueuePlace = (index: number, count: number) => {
  const { place, ofTotal } = splitQueuePlace(index, count)

  return `${place}${ofTotal}`
}
