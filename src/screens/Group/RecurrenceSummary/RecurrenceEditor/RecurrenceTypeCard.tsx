import { View, Text, Pressable } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import type { RecurrenceType } from './recurrence'
import { RECURRENCE_TYPE_LABELS, RECURRENCE_TYPE_DESCRIPTIONS } from './recurrence'

type Props = {
  type: RecurrenceType
  isSelected: boolean
  onPress: () => void
  children?: React.ReactNode
}

const RecurrenceTypeCard = ({ type, isSelected, onPress, children }: Props) => (
  <Pressable
    style={[styles.card, isSelected && styles.cardSelected]}
    onPress={onPress}
  >
    <View style={styles.header}>
      <Text style={[styles.label, isSelected && styles.labelSelected]}>
        {RECURRENCE_TYPE_LABELS[type]}
      </Text>
      <Text style={styles.description}>
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
  card: {
    borderRadius: theme.radii.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  cardSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSubtle,
  },
  header: {
    gap: theme.spacing.xs,
  },
  label: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  labelSelected: {
    color: theme.colors.accent,
  },
  description: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  config: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
}))
