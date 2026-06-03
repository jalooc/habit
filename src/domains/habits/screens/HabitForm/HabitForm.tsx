import { useEffect, useRef } from 'react'
import { Alert, Text, TextInput, View } from 'react-native'
import { StaticScreenProps, useNavigation } from '@react-navigation/native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { useObservable, useSelector } from '@legendapp/state/react'
import { $TextInput } from '@legendapp/state/react-native'
import { TextInputWrapper } from 'expo-paste-input'
import { File } from 'expo-file-system'
import { randomUUID } from 'expo-crypto'
import { EnrichedMarkdownTextInput } from 'react-native-enriched-markdown'
import type { EnrichedMarkdownTextInputInstance, MarkdownTextInputStyle } from 'react-native-enriched-markdown'
import type { PasteEventPayload } from 'expo-paste-input'
import { batch } from '@legendapp/state'
import { isNonNullish } from 'remeda'
import habits$ from 'src/domains/habits/stores/habits'
import groups$ from 'src/domains/habits/stores/groups'
import Button from 'src/domains/misc/components/Button'
import usePendingImages from 'src/domains/habits/utils/usePendingImages'
import { imageFileUri, imagesDir } from 'src/domains/habits/utils/habitImages'
import PendingImageRow from './PendingImageRow'
import useUnmountPromise from 'src/domains/misc/utils/useUnmountPromise'

type Props = StaticScreenProps<{
  groupId: string,
  habitId?: string,
}>

const HabitForm = ({ route }: Props) => {
  const { groupId, habitId } = route.params
  const navigation = useNavigation()
  const isEditMode = isNonNullish(habitId)
  const { theme } = useUnistyles()
  const name$ = useObservable(() => habitId ? habits$[habitId].name.get() : '')
  const canSubmit = useSelector(() => name$.get().trim().length > 0)
  const nameInputRef = useRef<TextInput>(null)
  const descInputRef = useRef<EnrichedMarkdownTextInputInstance | null>(null)
  const originalFilenames = useRef<string[]>(habitId ? habits$[habitId].images.get() ?? [] : [])
  const unmountPromise = useUnmountPromise()

  const existingImages$ = useObservable<{ filename: string, uri: string }[]>(
    () => (habitId ? habits$[habitId].images.get() ?? [] : []).map(f => ({ filename: f, uri: imageFileUri(f) }))
  )

  const existingAsUnified = useSelector(() =>
    existingImages$.get().map(img => ({
      uri: img.uri,
      remove: () => {
        const idx = existingImages$.peek().findIndex(i => i.filename === img.filename)
        if (idx !== -1) void existingImages$.splice(idx, 1)
      },
    }))
  )

  const isInOtherGroup = useSelector(() =>
    isEditMode && Object.entries(groups$.get()).some(([gId, g]) => gId !== groupId && habitId in g.habits)
  )

  const { pendingImages, addPendingImage, commitPendingImages, clearPendingImages } = usePendingImages()

  useEffect(() => () => { clearPendingImages() }, [])

  const submit = async () => {
    const [description, newFilenames] = await Promise.all([
      descInputRef.current?.getMarkdown() ?? '',
      commitPendingImages(),
    ])
    const remainingFilenames = existingImages$.peek().map(i => i.filename)
    const images = [...remainingFilenames, ...newFilenames]
    const name = name$.peek().trim()
    const filesToDelete = originalFilenames.current.filter(f => !remainingFilenames.includes(f))

    navigation.goBack()

    if (isEditMode) {
      filesToDelete.forEach(filename => {
        const file = new File(imagesDir, filename)
        if (file.exists) file.delete()
      })

      batch(() => {
        habits$[habitId].name.set(name)
        habits$[habitId].description.set(description.trim() || undefined)
        habits$[habitId].images.set(images.length > 0 ? images : undefined)
      })
    } else {
      const id = randomUUID()
      batch(() => {
        habits$[id].set({
          name,
          ...(description.trim() && { description: description.trim() }),
          ...(images.length && { images }),
        })
        groups$[groupId].habits[id].set(true)
      })
    }
  }

  const handlePaste = async (payload: PasteEventPayload) => {
    if (payload.type !== 'images') return
    await Promise.all(payload.uris.map(addPendingImage))
    payload.uris.forEach(uri => void new File(uri).delete())
  }

  const handleRemove = () => {
    if (habitId === undefined) {
      throw new Error('removing habit is not possible if habitId is undefined')
    }

    if (isInOtherGroup) {
      Alert.alert(
        'Remove from Group?',
        'This habit will be removed from this group but remain in other groups.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              navigation.goBack()
              await unmountPromise

              groups$[groupId].habits[habitId].delete()
            },
          },
        ],
      )
    } else {
      Alert.alert(
        'Delete Habit?',
        'This habit isn\'t in any other group. It will be permanently deleted.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              navigation.goBack()
              await unmountPromise

              const images = habits$[habitId].images.peek() ?? []
              images.forEach(filename => {
                const file = new File(imagesDir, filename)
                if (file.exists) file.delete()
              })
              batch(() => {
                groups$[groupId].habits[habitId].delete()
                habits$[habitId].delete()
              })
            },
          },
        ],
      )
    }
  }

  return (
    <View style={styles.sheet}>
      <Text style={styles.title}>{isEditMode ? 'Edit Habit' : 'New Habit'}</Text>
      <TextInputWrapper onPaste={handlePaste}>
        <$TextInput
          style={styles.input}
          $value={name$}
          // @ts-expect-error ref type in Legend State components doesn't match
          ref={nameInputRef}
          autoFocus={!isEditMode}
          placeholder="Habit name"
          placeholderTextColor={theme.colors.textTertiary}
          onKeyPress={e => {
            if (e.nativeEvent.key === 'Enter' && canSubmit) void submit()
          }}
        />
      </TextInputWrapper>
      <EnrichedMarkdownTextInput
        ref={descInputRef}
        defaultValue={habitId ? habits$[habitId].description.peek() : ''}
        multiline
        style={styles.descriptionInput}
        placeholder="Description (optional)"
        placeholderTextColor={theme.colors.textTertiary}
        markdownStyle={{ link: { color: theme.colors.accent }} satisfies MarkdownTextInputStyle}
      />
      <PendingImageRow
        pendingImages={[...existingAsUnified, ...pendingImages]}
        onAddImage={addPendingImage}
      />
      <Button
        title={isEditMode ? 'Save' : 'Create'}
        onPress={submit}
        disabled={!canSubmit}
      />
      {isEditMode && (
        <Button
          title={isInOtherGroup ? 'Remove from Group' : 'Delete Habit'}
          onPress={handleRemove}
          variant="secondary"
        />
      )}
    </View>
  )
}

export default HabitForm

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
  descriptionInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.text,
    minHeight: 120,
  },
}))
