import { View, Text, Pressable } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { withAlpha } from 'src/domains/misc/utils/theme'
import type { RecurrenceType } from './recurrence'
import { RECURRENCE_TYPE_LABELS, RECURRENCE_TYPE_DESCRIPTIONS } from './recurrence'

type Props = {
  type: RecurrenceType,
  isSelected: boolean,
  onPress: () => unknown,
  children?: React.ReactNode,
}

const RecurrenceTypeCard = ({ type, isSelected, onPress, children }: Props) => (
  <Pressable
    style={({ pressed }) => [
      styles.chip,
      isSelected && styles.chipSelected,
      pressed && styles.chipPressed,
    ]}
    onPress={onPress}
  >
    <View style={styles.header}>
      <Text style={[styles.label, isSelected && styles.labelSelected]}>
        {RECURRENCE_TYPE_LABELS[type]}
      </Text>
      <Text style={[styles.description, isSelected && styles.descriptionSelected]}>
        {RECURRENCE_TYPE_DESCRIPTIONS[type]}
      </Text>
    </View>
    {isSelected && children && (
      <View style={styles.config}>
        {children}
      </View>
    )}
  </Pressable>
)

export default RecurrenceTypeCard

const styles = StyleSheet.create(theme => ({
  chip: {
    borderRadius: theme.radii.pill,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipSelected: {
    backgroundColor: theme.colors.text,
    borderColor: theme.colors.text,
    borderRadius: theme.radii.md,
  },
  chipPressed: {
    opacity: 0.6,
  },
  header: {
    gap: theme.spacing.xs,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  labelSelected: {
    color: theme.colors.background,
  },
  description: {
    fontFamily: theme.fonts.sans,
    fontSize: 11,
    lineHeight: 14,
    color: theme.colors.textTertiary,
  },
  descriptionSelected: {
    color: theme.colors.background,
    opacity: 0.7,
  },
  config: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: withAlpha(theme.colors.background, 0.15),
  },
}))
