import { Pressable, Text, TextInput, View } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { useObservable, useSelector } from '@legendapp/state/react'
import { $TextInput } from '@legendapp/state/react-native'
import { TrueSheet } from '@lodev09/react-native-true-sheet'
import { TextInputWrapper } from 'expo-paste-input'
import { File } from 'expo-file-system'
import { randomUUID } from 'expo-crypto'
import { useRef } from 'react'
import type { PasteEventPayload } from 'expo-paste-input'
import { EnrichedMarkdownTextInput } from 'react-native-enriched-markdown'
import type { EnrichedMarkdownTextInputInstance } from 'react-native-enriched-markdown'
import groups$ from 'src/domains/habits/stores/groups'
import habits$ from 'src/domains/habits/stores/habits'
import Button from 'src/domains/misc/components/Button'
import PendingImageRow from './PendingImageRow'
import usePendingImages from 'src/domains/habits/utils/usePendingImages'

type Props = {
  groupId: string,
  hasHabits: boolean,
}

const AddHabitFooter = ({ groupId, hasHabits }: Props) => {
  const { theme } = useUnistyles()
  const newHabitName$ = useObservable('')
  const canSubmit = useSelector(() => newHabitName$.get().trim().length > 0)
  const inputRef = useRef<TextInput>(null)
  const sheetRef = useRef<TrueSheet>(null)
  const descInputRef = useRef<EnrichedMarkdownTextInputInstance | null>(null)
  const pendingCommit = useRef<{ name: string, images: string[], description: string } | null>(null)
  const {
    pendingImages,
    addImage,
    commitImages,
    clearImages,
  } = usePendingImages()

  const addHabit = async () => {
    const description = await descInputRef.current?.getMarkdown() ?? ''
    pendingCommit.current = { name: newHabitName$.get(), images: await commitImages(), description }
    await sheetRef.current?.dismiss()
  }

  const handleDismiss = () => {
    const commit = pendingCommit.current
    pendingCommit.current = null
    clearImages()
    newHabitName$.set('')
    descInputRef.current?.setValue('')
    if (commit) {
      const id = randomUUID()
      habits$[id].set({
        name: commit.name,
        ...(commit.description.trim() && { description: commit.description.trim() }),
        ...(commit.images.length && { images: commit.images }),
      })
      groups$[groupId].habits[id].set(true)
    }
  }

  const handlePaste = async (payload: PasteEventPayload) => {
    if (payload.type !== 'images') return
    await Promise.all(payload.uris.map(addImage))
    payload.uris.forEach(uri => void new File(uri).delete())
  }

  return (
    <>
      <Pressable
        style={({ pressed }) => [addCardStyles.container, pressed && addCardStyles.pressed]}
        onPress={() => sheetRef.current?.present()}
      >
        <Text style={addCardStyles.plus}>+</Text>
        <Text style={addCardStyles.label}>
          {hasHabits ? 'Add Habit' : 'Add First Habit'}
        </Text>
      </Pressable>
      <TrueSheet
        ref={sheetRef}
        detents={['auto']}
        onDidPresent={() => inputRef.current?.focus()}
        onDidDismiss={handleDismiss}
      >
        <View style={sheetStyles.sheet}>
          <Text style={sheetStyles.sheetTitle}>New Habit</Text>
          <TextInputWrapper onPaste={handlePaste}>
            <$TextInput
              style={sheetStyles.input}
              $value={newHabitName$}
              // @ts-expect-error ref type in Legend State components doesn't match
              ref={inputRef}
              placeholder="Habit name"
              placeholderTextColor={theme.colors.textTertiary}
              onKeyPress={e => {
                if (e.nativeEvent.key === 'Enter' && canSubmit) void addHabit()
              }}
            />
          </TextInputWrapper>
          <EnrichedMarkdownTextInput
            ref={descInputRef}
            multiline
            style={sheetStyles.descriptionInput}
            placeholder="Description (optional)"
            placeholderTextColor={theme.colors.textTertiary}
            markdownStyle={{ link: { color: theme.colors.accent }}}
          />
          <PendingImageRow
            pendingImages={pendingImages}
            onAddImage={addImage}
          />
          <Button title="Create" onPress={addHabit} disabled={!canSubmit} />
        </View>
      </TrueSheet>
    </>
  )
}

export default AddHabitFooter

const addCardStyles = StyleSheet.create(theme => ({
  container: {
    borderRadius: theme.radii.lg,
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
    fontWeight: '600',
    color: theme.colors.accent,
  },
  label: {
    ...theme.typography.body,
    fontWeight: '500',
    color: theme.colors.accent,
  },
}))

const sheetStyles = StyleSheet.create(theme => ({
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
