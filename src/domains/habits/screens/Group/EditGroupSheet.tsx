import { RefObject, useEffect, useRef } from 'react'
import { Alert, Text, View } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { useObservable, useSelector } from '@legendapp/state/react'
import { $TextInput } from '@legendapp/state/react-native'
import { TrueSheet } from '@lodev09/react-native-true-sheet'
import { File } from 'expo-file-system'
import { useNavigation } from '@react-navigation/native'
import habits$ from 'src/domains/habits/stores/habits'
import groups$ from 'src/domains/habits/stores/groups'
import Button from 'src/domains/misc/components/Button'
import { imagesDir } from 'src/domains/habits/utils/habitImages'
import { devLog } from 'src/domains/devTools/utils/devLog'
import { difference, intersection } from 'remeda'
import { batch } from '@legendapp/state'

type Props = {
  groupId: string,
  sheetRef: RefObject<TrueSheet | null>,
}

const EditGroupSheet = ({ groupId, sheetRef }: Props) => {
  const { theme } = useUnistyles()
  const navigation = useNavigation()
  const name$ = useObservable(() => groups$[groupId].name.get())
  const canSave = useSelector(() => name$.get().trim().length > 0)

  const onClose = () => {
    name$.set(groups$[groupId].name.peek())
  }

  const save = async () => {
    const name = name$.peek().trim()
    await sheetRef.current?.dismiss()
    groups$[groupId].name.set(name)
  }

  // deleting the groups and habits data after this screen is unmounted as it relies on them being present
  const deleteCommit = useRef<{ groupHabitIds: string[], otherGroupHabitIds: string[] }>(null)
  useEffect(() => () => {
    if (!deleteCommit.current) return

    const { groupHabitIds, otherGroupHabitIds } = deleteCommit.current
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
  }, [])

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

            deleteCommit.current = { groupHabitIds, otherGroupHabitIds }

            await sheetRef.current?.dismiss()
            navigation.goBack()
          },
        },
      ],
    )
  }

  return (
    <TrueSheet
      ref={sheetRef}
      detents={['auto']}
      onDidDismiss={onClose}
    >
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>Edit Group</Text>
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
    </TrueSheet>
  )
}

export default EditGroupSheet

const styles = StyleSheet.create(theme => ({
  sheet: {
    padding: theme.spacing['3xl'],
    paddingBottom: theme.spacing['4xl'],
    gap: theme.spacing.xl,
  },
  sheetTitle: {
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
