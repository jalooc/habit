import { useState } from 'react'
import { Alert, Text, TextInput, View } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { StaticScreenProps, useNavigation } from '@react-navigation/native'
import { atom, useAtomValue, useSetAtom } from 'jotai'
import { difference, intersection } from 'remeda'
import habitsAtom from 'src/domains/habits/stores/habits'
import groupsAtom, { withGroupUpdated } from 'src/domains/habits/stores/groups'
import lastActionAtom from 'src/domains/habits/stores/lastAction'
import Button from 'src/domains/misc/components/Button'
import { deleteImageFiles } from 'src/domains/habits/utils/habitImages'
import { devLog } from 'src/domains/devTools/utils/devLog'
import useUnmountPromise from 'src/domains/misc/utils/useUnmountPromise'

type Props = StaticScreenProps<{
  groupId: string,
}>

// Habits not shared with another rotation go with it. A pending undo is dismissed too: the toast
// would otherwise keep offering an undo that does nothing.
const deleteGroupAtom = atom(null, (get, set, groupId: string) => {
  const groups = get(groupsAtom)
  const habits = get(habitsAtom)
  const groupHabitIds = Object.keys(groups[groupId].habits)
  const otherGroupHabitIds = Object.entries(groups)
    .filter(([id]) => id !== groupId)
    .flatMap(([, group]) => Object.keys(group.habits))
  const orphanedHabitIds = difference(groupHabitIds, otherGroupHabitIds)

  devLog(`Deleting group "${groups[groupId].name}"`, {
    groupHabitsToDelete: orphanedHabitIds,
    remainingHabits: intersection(groupHabitIds, otherGroupHabitIds),
  })

  deleteImageFiles(orphanedHabitIds
    .filter(habitId => Object.hasOwn(habits, habitId))
    .flatMap(habitId => habits[habitId].images ?? []))

  set(habitsAtom, Object.fromEntries(Object.entries(habits).filter(([id]) => !orphanedHabitIds.includes(id))))
  set(groupsAtom, ({ [groupId]: _deleted, ...remaining }) => remaining)
  set(lastActionAtom, undefined)
})

const EditGroup = ({ route }: Props) => {
  const { groupId } = route.params
  const { theme } = useUnistyles()
  const navigation = useNavigation()
  const initialName = useAtomValue(groupsAtom)[groupId].name
  const setGroups = useSetAtom(groupsAtom)
  const deleteGroup = useSetAtom(deleteGroupAtom)
  const [name, setName] = useState(initialName)
  const canSave = name.trim().length > 0
  const unmountPromise = useUnmountPromise()

  const save = () => {
    setGroups(groups => withGroupUpdated(groups, groupId, group => ({ ...group, name: name.trim() })))
    navigation.goBack()
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete rotation?',
      'Habits not shared with other rotations will also be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            navigation.navigate('Home', undefined, { pop: true })

            // the screens being popped render off this rotation, so it has to stay until they are gone
            await unmountPromise

            deleteGroup(groupId)
          },
        },
      ],
    )
  }

  return (
    <View style={styles.sheet}>
      <Text style={styles.kicker}>Edit rotation</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Rotation name"
        placeholderTextColor={theme.colors.textTertiary}
        onKeyPress={e => {
          if (e.nativeEvent.key === 'Enter' && canSave) void save()
        }}
      />
      <Button title="Save" onPress={save} disabled={!canSave} />
      <Button title="Delete rotation" onPress={handleDelete} variant="secondary" />
    </View>
  )
}

export default EditGroup

const styles = StyleSheet.create(theme => ({
  sheet: {
    padding: theme.spacing['3xl'],
    paddingBottom: theme.spacing['4xl'],
    gap: theme.spacing.xl,
  },
  kicker: {
    ...theme.typography.label,
    color: theme.colors.textTertiary,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xs,
    padding: theme.spacing.md,
    fontFamily: theme.fonts.serif,
    fontSize: 18,
    lineHeight: 25,
    letterSpacing: -0.2,
    color: theme.colors.text,
  },
}))
