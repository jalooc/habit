const formatDueTime = (date: Date): string => {
  const hour = date.getHours()
  const minute = date.getMinutes()
  const h12 = ((hour + 11) % 12) + 1
  const ap = hour < 12 ? 'a' : 'p'
  if (minute === 0) return `${h12}${ap}`
  const mm = String(minute).padStart(2, '0')
  return `${h12}:${mm}${ap}`
}

export default formatDueTime
