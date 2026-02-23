import { TextInput, View, Text } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useRef, useState } from 'react'

type TimeValue = { hour: number; minute: number }

type Props = {
  start: TimeValue
  end: TimeValue
  onStartChange: (value: TimeValue) => void
  onEndChange: (value: TimeValue) => void
}

const DayBoundaries = ({ start, end, onStartChange, onEndChange }: Props) => {
  const { theme } = useUnistyles()

  return (
    <View style={styles.dayCard}>
      <Text style={styles.dayCardLabel}>Your day</Text>
      <View style={styles.container}>
        <TimeSlot
          icon={<Ionicons name="sunny-outline" size={22} color={theme.colors.accent}/>}
          label="Wake up"
          value={start}
          onChange={onStartChange}
        />
        <Ionicons name="arrow-forward" size={14} color={theme.colors.textTertiary}/>
        <TimeSlot
          icon={<Ionicons name="moon-outline" size={22} color={theme.colors.textSecondary}/>}
          iconSide="right"
          label="Bedtime"
          value={end}
          onChange={onEndChange}
        />
      </View>
    </View>
  )
}

export default DayBoundaries

type TimeSlotProps = {
  icon: React.ReactNode
  iconSide?: 'left' | 'right'
  label: string
  value: TimeValue
  onChange: (value: TimeValue) => void
}

const TimeSlot = ({ icon, iconSide = 'left', label, value, onChange }: TimeSlotProps) => {
  const minuteRef = useRef<TextInput>(null)

  return (
    <View style={timeSlotStyles.container}>
      <View style={timeSlotStyles.row}>
        {iconSide === 'left' && icon}
        <View style={timeSlotStyles.digitsContainer}>
          <View style={timeSlotStyles.timeRow}>
            <TimeDigitInput
              value={value.hour}
              max={23}
              onChange={hour => onChange({ ...value, hour })}
              onFilled={() => minuteRef.current?.focus()}
            />
            <Text style={timeSlotStyles.colon}>:</Text>
            <TimeDigitInput
              ref={minuteRef}
              value={value.minute}
              max={59}
              onChange={minute => onChange({ ...value, minute })}
            />
          </View>
          <Text style={timeSlotStyles.label}>{label}</Text>
        </View>
        {iconSide === 'right' && icon}
      </View>
    </View>
  )
}

type TimeDigitInputProps = {
  value: number
  max: number
  onChange: (value: number) => void
  onFilled?: () => void
  ref?: React.Ref<TextInput>
}

const TimeDigitInput = ({ value, max, onChange, onFilled, ref }: TimeDigitInputProps) => {
  const [text, setText] = useState(() => String(value).padStart(2, '0'))

  const handleFocus = () => setText('')

  const handleBlur = () => {
    const parsed = parseInt(text, 10)
    const safeValue = isNaN(parsed) ? value : Math.min(Math.max(parsed, 0), max)
    onChange(safeValue)
    setText(String(safeValue).padStart(2, '0'))
  }

  const handleChangeText = (newText: string) => {
    const digits = newText.replace(/\D/g, '').slice(0, 2)
    setText(digits)
    if (digits.length === 2) {
      const parsed = parseInt(digits, 10)
      const safeValue = Math.min(Math.max(parsed, 0), max)
      onChange(safeValue)
      onFilled?.()
    }
  }

  return (
    <TextInput
      ref={ref}
      style={digitInputStyles.input}
      value={text}
      onChangeText={handleChangeText}
      onFocus={handleFocus}
      onBlur={handleBlur}
      keyboardType="number-pad"
      maxLength={2}
    />
  )
}

const TIME_SLOT_LABEL_SIZE = 20

const styles = StyleSheet.create(theme => ({
  dayCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.lg + TIME_SLOT_LABEL_SIZE,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  dayCardLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
}))

const timeSlotStyles = StyleSheet.create(theme => ({
  container: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  digitsContainer: {
    alignItems: 'center',
  },
  colon: {
    ...theme.typography.heading,
    color: theme.colors.text,
    fontWeight: '700',
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    position: 'absolute',
    bottom: -TIME_SLOT_LABEL_SIZE,
  },
}))

const digitInputStyles = StyleSheet.create(theme => ({
  input: {
    ...theme.typography.heading,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    textAlign: 'center',
    minWidth: 52,
  },
}))
