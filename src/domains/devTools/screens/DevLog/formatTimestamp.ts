import dayjs from 'dayjs'

export const formatTimestamp = (timestamp: number): string => {
  const isOlderThanADay = dayjs(timestamp).isBefore(dayjs().subtract(1, 'day'))
  return dayjs(timestamp).format(isOlderThanADay ? 'YYYY-MM-DD HH:mm:ss' : 'HH:mm:ss.SSS')
}
