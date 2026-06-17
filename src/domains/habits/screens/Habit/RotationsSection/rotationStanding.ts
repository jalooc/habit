const ordinalSuffix = (n: number): string => {
  const teens = n % 100
  if (teens >= 11 && teens <= 13) return 'th'
  const ones = n % 10
  return ones === 1 ? 'st' : ones === 2 ? 'nd' : ones === 3 ? 'rd' : 'th'
}

export const formatStanding = (index: number): string =>
  index === 0 ? 'up next' : `${index + 1}${ordinalSuffix(index + 1)} in line`
