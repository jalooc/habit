import { View, Text, Pressable } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { withAlpha } from 'src/domains/misc/utils/theme'
import { WEEKDAYS, WEEKDAY_LABELS } from './recurrence'
import type { Weekday } from './recurrence'

type Props = {
  selected: Weekday[],
  onChange: (days: Weekday[]) => unknown,
  onDark?: boolean,
}

const DayChips = ({ selected, onChange, onDark }: Props) => (
  <View style={styles.container}>
    {WEEKDAYS.map(day => {
      const isSelected = selected.includes(day)
      return (
        <Pressable
          key={day}
          style={({ pressed }) => [
            onDark ? styles.chipOnDark : styles.chip,
            isSelected && (onDark ? styles.chipOnDarkSelected : styles.chipSelected),
            pressed && styles.chipPressed,
          ]}
          onPress={() =>
            void onChange(
              isSelected ?
                selected.filter(d => d !== day) :
                [...selected, day]
            )
          }
        >
          <Text
            style={[
              onDark ? styles.chipTextOnDark : styles.chipText,
              isSelected && (onDark ? styles.chipTextOnDarkSelected : styles.chipTextSelected),
            ]}
          >
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
  chipOnDark: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.background, 0.25),
    backgroundColor: 'transparent',
  },
  chipOnDarkSelected: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.background,
  },
  chipPressed: {
    opacity: 0.6,
  },
  chipText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  chipTextSelected: {
    color: theme.colors.background,
  },
  chipTextOnDark: {
    ...theme.typography.caption,
    color: theme.colors.background,
    opacity: 0.7,
  },
  chipTextOnDarkSelected: {
    color: theme.colors.text,
    opacity: 1,
  },
}))
