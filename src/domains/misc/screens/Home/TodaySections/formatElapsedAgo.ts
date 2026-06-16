const formatElapsedAgo = (ms: number): string => {
  const clamped = Math.max(0, ms)
  const totalMinutes = Math.floor(clamped / (60 * 1000))
  if (totalMinutes < 60) return `${totalMinutes}m`
  const totalHours = Math.floor(clamped / (60 * 60 * 1000))
  if (totalHours < 24) return `${totalHours}h`
  const totalDays = Math.floor(clamped / (24 * 60 * 60 * 1000))
  return `${totalDays}d`
}

export default formatElapsedAgo
