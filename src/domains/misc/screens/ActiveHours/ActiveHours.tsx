import { View, Text } from 'react-native'
import { useAtomValue, useSetAtom } from 'jotai'
import { StyleSheet } from 'react-native-unistyles'
import dayBoundariesAtom from 'src/domains/misc/stores/dayBoundaries'
import TimeSlot from './TimeSlot'

const ActiveHours = () => {
  const { start, end } = useAtomValue(dayBoundariesAtom)
  const setDayBoundaries = useSetAtom(dayBoundariesAtom)

  const descriptionText = `Pings only between ${formatTime(start.hour, start.minute)} and ` +
    `${formatTime(end.hour, end.minute)}. Outside the window the app stays quiet.`

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>Active hours</Text>
      <Text style={styles.description}>{descriptionText}</Text>
      <View style={styles.slots}>
        <TimeSlot
          label="From"
          value={start}
          onChange={value => void setDayBoundaries(boundaries => ({ ...boundaries, start: value }))}
        />
        <Text style={styles.separator}>–</Text>
        <TimeSlot
          label="Until"
          value={end}
          onChange={value => void setDayBoundaries(boundaries => ({ ...boundaries, end: value }))}
        />
      </View>
    </View>
  )
}

export default ActiveHours

const formatTime = (hour: number, minute: number) => `${hour}:${String(minute).padStart(2, '0')}`

const styles = StyleSheet.create(theme => ({
  container: {
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  kicker: {
    ...theme.typography.label,
    color: theme.colors.textTertiary,
  },
  description: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    lineHeight: 20,
  },
  slots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  separator: {
    ...theme.typography.heading,
    color: theme.colors.textSecondary,
  },
}))
