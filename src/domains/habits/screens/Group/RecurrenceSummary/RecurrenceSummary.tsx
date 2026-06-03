import { Text, Pressable } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { useSelector } from '@legendapp/state/react'
import { useNavigation } from '@react-navigation/native'
import { toText } from 'rrule-temporal/totext'
import groups$ from 'src/domains/habits/stores/groups'

type Props = {
  groupId: string,
}

const RecurrenceSummary = ({ groupId }: Props) => {
  const navigation = useNavigation()
  const recurrenceText = useSelector(() => {
    const recurrence = groups$[groupId].recurrence.get()
    if (!recurrence) return undefined
    return toText(String(recurrence))
  })

  const goToEditor = () => void navigation.navigate('EditSchedule', { groupId })

  if (recurrenceText) {
    return (
      <Pressable
        style={({ pressed }) => [styles.filled, pressed && styles.filledPressed]}
        onPress={goToEditor}
      >
        <Text style={styles.filledLabel}>{recurrenceText}</Text>
      </Pressable>
    )
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.empty, pressed && styles.emptyPressed]}
      onPress={goToEditor}
    >
      <Text style={styles.emptyLabel}>Add Schedule</Text>
    </Pressable>
  )
}

export default RecurrenceSummary

const styles = StyleSheet.create(theme => ({
  empty: {
    borderRadius: theme.radii.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  emptyPressed: {
    backgroundColor: theme.colors.accentSubtle,
    borderColor: theme.colors.accent,
  },
  emptyLabel: {
    ...theme.typography.body,
    fontWeight: '500',
    color: theme.colors.accent,
  },
  filled: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  filledPressed: {
    backgroundColor: theme.colors.accentSubtle,
  },
  filledLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
  },
}))
