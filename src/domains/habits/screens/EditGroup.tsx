import { Alert, Text, View } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { useObservable, useSelector } from '@legendapp/state/react'
import { $TextInput } from '@legendapp/state/react-native'
import { File } from 'expo-file-system'
import { StaticScreenProps, useNavigation } from '@react-navigation/native'
import { batch } from '@legendapp/state'
import { difference, intersection } from 'remeda'
import habits$ from 'src/domains/habits/stores/habits'
import groups$ from 'src/domains/habits/stores/groups'
import Button from 'src/domains/misc/components/Button'
import { imagesDir } from 'src/domains/habits/utils/habitImages'
import { devLog } from 'src/domains/devTools/utils/devLog'
import useUnmountPromise from 'src/domains/misc/utils/useUnmountPromise'

type Props = StaticScreenProps<{
  groupId: string,
}>

const EditGroup = ({ route }: Props) => {
  const { groupId } = route.params
  const { theme } = useUnistyles()
  const navigation = useNavigation()
  const name$ = useObservable(() => groups$[groupId].name.get())
  const canSave = useSelector(() => name$.get().trim().length > 0)
  const unmountPromise = useUnmountPromise()

  const save = () => {
    const name = name$.peek().trim()
    groups$[groupId].name.set(name)
    navigation.goBack()
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Group?',
      'Habits not shared with other groups will also be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const groupHabitIds = Object.keys(groups$[groupId].habits.peek())
            const otherGroupHabitIds = Array.from(new Set(
              Object.entries(groups$.peek())
                .filter(([gId]) => gId !== groupId)
                .flatMap(([, g]) => Object.keys(g.habits))
            ))

            navigation.navigate('Home', undefined, { pop: true })

            await unmountPromise

            // deleting the groups and habits data after this screen is unmounted as it relies on them being present
            const groupHabitsToDelete = difference(groupHabitIds, otherGroupHabitIds)

            devLog(`Deleting group "${groups$[groupId].name.peek()}"`, {
              groupHabitsToDelete,
              remainingHabits: intersection(groupHabitIds, otherGroupHabitIds),
            })

            batch(() => {
              groupHabitsToDelete.forEach(habitId => {
                const images = habits$[habitId].images.peek() ?? []
                images.forEach(filename => {
                  const file = new File(imagesDir, filename)
                  if (file.exists) file.delete()
                })
                habits$[habitId].delete()
              })
              groups$[groupId].delete()
            })

          },
        },
      ],
    )
  }

  return (
    <View style={styles.sheet}>
      <Text style={styles.title}>Edit Group</Text>
      <$TextInput
        style={styles.input}
        $value={name$}
        placeholder="Group name"
        placeholderTextColor={theme.colors.textTertiary}
        onKeyPress={e => {
          if (e.nativeEvent.key === 'Enter' && canSave) void save()
        }}
      />
      <Button title="Save" onPress={save} disabled={!canSave} />
      <Button title="Delete Group" onPress={handleDelete} variant="secondary" />
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
  title: {
    ...theme.typography.heading,
    color: theme.colors.text,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.text,
  },
}))
