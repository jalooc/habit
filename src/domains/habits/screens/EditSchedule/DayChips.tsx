import { View, Text, Pressable } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { WEEKDAYS, WEEKDAY_LABELS } from './recurrence'
import type { Weekday } from './recurrence'

type Props = {
  selected: Weekday[],
  onChange: (days: Weekday[]) => void,
}

const DayChips = ({ selected, onChange }: Props) => (
  <View style={styles.container}>
    {WEEKDAYS.map(day => {
      const isSelected = selected.includes(day)
      return (
        <Pressable
          key={day}
          style={[styles.chip, isSelected && styles.chipSelected]}
          onPress={() =>
            void onChange(
              isSelected ?
                selected.filter(d => d !== day) :
                [...selected, day]
            )
          }
        >
          <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
            {WEEKDAY_LABELS[day]}
          </Text>
        </Pressable>
      )
    })}
  </View>
)

export default DayChips

const styles = StyleSheet.create(theme => ({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipSelected: {
    backgroundColor: theme.colors.text,
    borderColor: theme.colors.text,
  },
  chipText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  chipTextSelected: {
    color: theme.colors.background,
  },
}))
