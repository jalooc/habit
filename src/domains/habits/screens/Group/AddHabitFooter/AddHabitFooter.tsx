import { Pressable, Text } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { useNavigation } from '@react-navigation/native'

type Props = {
  groupId: string,
  hasHabits: boolean,
}

const AddHabitFooter = ({ groupId, hasHabits }: Props) => {
  const navigation = useNavigation()

  return (
    <Pressable
      style={({ pressed }) => [addCardStyles.container, pressed && addCardStyles.pressed]}
      onPress={() => void navigation.navigate('HabitForm', { groupId })}
    >
      <Text style={addCardStyles.plus}>+</Text>
      <Text style={addCardStyles.label}>
        {hasHabits ? 'Add Habit' : 'Add First Habit'}
      </Text>
    </Pressable>
  )
}

export default AddHabitFooter

const addCardStyles = StyleSheet.create(theme => ({
  container: {
    borderRadius: theme.radii.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  pressed: {
    backgroundColor: theme.colors.accentSubtle,
    borderColor: theme.colors.accent,
  },
  plus: {
    fontSize: 20,
    color: theme.colors.accent,
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.accent,
  },
}))
