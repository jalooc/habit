import { TextInput, View, Text } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { useRef } from 'react'
import TimeDigitInput from './TimeDigitInput'

type TimeValue = { hour: number, minute: number }

type Props = {
  label: string,
  value: TimeValue,
  onChange: (value: TimeValue) => unknown,
}

const TimeSlot = ({ label, value, onChange }: Props) => {
  const minuteRef = useRef<TextInput>(null)

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.timeRow}>
        <TimeDigitInput
          value={value.hour}
          max={23}
          onChange={hour => void onChange({ ...value, hour })}
          onFilled={() => void minuteRef.current?.focus()}
        />
        <Text style={styles.colon}>:</Text>
        <TimeDigitInput
          ref={minuteRef}
          value={value.minute}
          max={59}
          onChange={minute => void onChange({ ...value, minute })}
        />
      </View>
    </View>
  )
}

export default TimeSlot

const styles = StyleSheet.create(theme => ({
  container: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.textTertiary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  colon: {
    ...theme.typography.heading,
    color: theme.colors.text,
  },
}))
