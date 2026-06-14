import { View, Text } from 'react-native'
import { useSelector, useValue } from '@legendapp/state/react'
import { StyleSheet } from 'react-native-unistyles'
import dayBoundaries$ from 'src/domains/misc/stores/dayBoundaries'
import TimeSlot from './TimeSlot'

const ActiveHours = () => {
  const start = useValue(dayBoundaries$.start)
  const end = useValue(dayBoundaries$.end)

  const descriptionText = useSelector(() => {
    const s = dayBoundaries$.start.get()
    const e = dayBoundaries$.end.get()
    const fmt = (h: number, m: number) => `${h}:${String(m).padStart(2, '0')}`
    return `Pings only between ${fmt(s.hour, s.minute)} and ${fmt(e.hour, e.minute)}. Outside the window the app stays quiet.`
  })

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>Active hours</Text>
      <Text style={styles.description}>{descriptionText}</Text>
      <View style={styles.slots}>
        <TimeSlot
          label="From"
          value={start}
          onChange={v => void dayBoundaries$.start.set(v)}
        />
        <Text style={styles.separator}>–</Text>
        <TimeSlot
          label="Until"
          value={end}
          onChange={v => void dayBoundaries$.end.set(v)}
        />
      </View>
    </View>
  )
}

export default ActiveHours

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
