import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Text, TextInput, View } from 'react-native'
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { TextInputWrapper } from 'expo-paste-input'
import { File } from 'expo-file-system'
import { randomUUID } from 'expo-crypto'
import * as Haptics from 'expo-haptics'
import { EnrichedMarkdownTextInput } from 'react-native-enriched-markdown'
import type { EnrichedMarkdownTextInputInstance, MarkdownTextInputStyle } from 'react-native-enriched-markdown'
import type { PasteEventPayload } from 'expo-paste-input'
import { atom, useAtomValue, useSetAtom } from 'jotai'
import habitsAtom, { type HabitsStore, withHabitUpdated } from 'src/domains/habits/stores/habits'
import groupsAtom, { withHabitLinked } from 'src/domains/habits/stores/groups'
import Button from 'src/domains/misc/components/Button'
import usePendingImages from 'src/domains/habits/utils/usePendingImages'
import { deleteImageFiles, imageFileUri } from 'src/domains/habits/utils/habitImages'
import { deleteHabit, linkHabit } from 'src/domains/habits/utils/habitActions'
import searchHabits from 'src/domains/habits/utils/searchHabits'
import useUnmountPromise from 'src/domains/misc/utils/useUnmountPromise'
import PendingImageRow from './PendingImageRow'
import HabitSuggestions from './HabitSuggestions'
import AnimatedKicker from './AnimatedKicker'

type Props = {
  onDone: () => unknown,
  onCancel: () => unknown,
} & (
  { groupId: string, habitId?: undefined, onRemoved?: undefined } |
  { groupId?: undefined, habitId: string, onRemoved: () => unknown }
)

type HabitFields = Omit<HabitsStore[string], 'lastActioned'>

// The habit and its membership land in one write, so nothing derived from the stores sees the
// rotation point at a habit that isn't there yet.
const createHabitAtom = atom(null, (_get, set, groupId: string, fields: HabitFields) => {
  const habitId = randomUUID()

  set(habitsAtom, habits => ({ ...habits, [habitId]: fields }))
  set(groupsAtom, groups => withHabitLinked(groups, groupId, habitId))
})

const updateHabitAtom = atom(null, (_get, set, habitId: string, fields: HabitFields) => {
  set(habitsAtom, habits => withHabitUpdated(habits, habitId, ({ lastActioned }) => ({
    ...fields,
    ...(lastActioned && { lastActioned }),
  })))
})

const HabitEditor = ({ groupId, habitId, onDone, onCancel, onRemoved }: Props) => {
  const isEditMode = habitId !== undefined
  const { theme } = useUnistyles()
  const habits = useAtomValue(habitsAtom)
  const groups = useAtomValue(groupsAtom)
  const createHabit = useSetAtom(createHabitAtom)
  const updateHabit = useSetAtom(updateHabitAtom)
  const editedHabit = habitId ? habits[habitId] : undefined
  const [name, setName] = useState(editedHabit?.name ?? '')
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false)
  const query = useDeferredValue(name.trim())
  const suggestionResults = useMemo(
    () => isEditMode ? null : searchHabits({ habits, groups, groupId, query }),
    [isEditMode, habits, groups, groupId, query],
  )
  const showSuggestions = !isEditMode &&
    query.length > 0 &&
    !!suggestionResults &&
    suggestionResults.length > 0 &&
    !suggestionsDismissed
  const canSubmit = name.trim().length > 0
  const nameInputRef = useRef<TextInput>(null)
  const descInputRef = useRef<EnrichedMarkdownTextInputInstance | null>(null)
  const originalFilenames = useRef(editedHabit?.images ?? [])
  const unmountPromise = useUnmountPromise()

  const [existingImages, setExistingImages] = useState(
    () => (editedHabit?.images ?? []).map(filename => ({ filename, uri: imageFileUri(filename) })),
  )

  const existingAsUnified = existingImages.map(img => ({
    uri: img.uri,
    remove: () => void setExistingImages(images => images.filter(image => image.filename !== img.filename)),
  }))

  const { pendingImages, addPendingImage, commitPendingImages, clearPendingImages } = usePendingImages()

  useEffect(() => () => void clearPendingImages(), [])

  const dismissSuggestions = () => void setSuggestionsDismissed(true)

  const submit = async () => {
    const [description, newFilenames] = await Promise.all([
      descInputRef.current?.getMarkdown() ?? '',
      commitPendingImages(),
    ])
    const remainingFilenames = existingImages.map(i => i.filename)
    const images = [...remainingFilenames, ...newFilenames]
    const fields = {
      name: name.trim(),
      ...(description.trim() && { description: description.trim() }),
      ...(images.length && { images }),
    }

    onDone()

    if (isEditMode) {
      deleteImageFiles(originalFilenames.current.filter(f => !remainingFilenames.includes(f)))
      updateHabit(habitId, fields)
    } else {
      createHabit(groupId, fields)
    }
  }

  const handleLink = (targetGroupId: string) => (linkedHabitId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    linkHabit(linkedHabitId, targetGroupId)
    onDone()
  }

  const handlePaste = async (payload: PasteEventPayload) => {
    if (payload.type !== 'images') return
    await Promise.all(payload.uris.map(addPendingImage))
    payload.uris.forEach(uri => void new File(uri).delete())
  }

  const confirmDelete = (habitId: string, onRemoved: () => unknown) => () => {
    const rotationCount = Object.values(groups).filter(group => habitId in group.habits).length

    Alert.alert(
      'Delete habit?',
      rotationCount > 1 ?
        `This habit is in ${rotationCount} rotations. It will be deleted from all of them.` :
        'This habit isn\'t in any other rotation. It will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            onRemoved()
            await unmountPromise

            deleteHabit(habitId)
          },
        },
      ],
    )
  }

  const formSections = (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      layout={LinearTransition.duration(200)}
      style={styles.formSections}
    >
      <View style={styles.fieldGroup}>
        <View style={styles.fieldLabelRow}>
          <Text style={styles.fieldLabel}>Note</Text>
          <Text style={styles.fieldLabelOptional}>· optional</Text>
        </View>
        <EnrichedMarkdownTextInput
          ref={descInputRef}
          defaultValue={editedHabit?.description ?? ''}
          multiline
          style={styles.descriptionInput}
          placeholder="Form cues, why it matters, links."
          placeholderTextColor={theme.colors.textTertiary}
          markdownStyle={{ link: { color: theme.colors.accent }} satisfies MarkdownTextInputStyle}
        />
      </View>

      <View style={styles.fieldGroup}>
        <View style={styles.fieldLabelRow}>
          <Text style={styles.fieldLabel}>Images</Text>
          <Text style={styles.fieldLabelOptional}>· optional</Text>
        </View>
        <PendingImageRow
          pendingImages={[...existingAsUnified, ...pendingImages]}
          onAddImage={addPendingImage}
        />
      </View>

      <View style={styles.footerRow}>
        <View style={styles.footerCancel}>
          <Button title="Cancel" variant="ghost" onPress={onCancel} />
        </View>
        <View style={styles.footerSubmit}>
          <Button
            title={isEditMode ? 'Save' : 'Create'}
            onPress={submit}
            disabled={!canSubmit}
          />
        </View>
      </View>
      {isEditMode && (
        <Button title="Delete habit" onPress={confirmDelete(habitId, onRemoved)} variant="secondary" />
      )}
    </Animated.View>
  )

  const sheetContent = (
    <>
      {isEditMode ? (
        <Text style={styles.kicker}>Edit habit</Text>
      ) : (
        <AnimatedKicker suffix={showSuggestions ? ' / link existing habit' : undefined}>New habit</AnimatedKicker>
      )}

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Name</Text>
        <TextInputWrapper onPaste={handlePaste}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={text => {
              setName(text)
              setSuggestionsDismissed(false)
            }}
            ref={nameInputRef}
            autoFocus={!isEditMode}
            placeholder="e.g. Hollow hold"
            placeholderTextColor={theme.colors.textTertiary}
            onKeyPress={e => {
              if (e.nativeEvent.key === 'Enter' && canSubmit && !showSuggestions) void submit()
            }}
          />
        </TextInputWrapper>
      </View>

      {showSuggestions ? (
        <HabitSuggestions
          habitSuggestions={suggestionResults}
          onLink={handleLink(groupId)}
          onDismiss={dismissSuggestions}
        />
      ) : formSections}
    </>
  )

  return (
    <Animated.View
      style={[styles.sheet, !isEditMode && showSuggestions && styles.sheetExpanded]}
      layout={LinearTransition.duration(200)}
    >
      {sheetContent}
    </Animated.View>
  )
}

export default HabitEditor

const styles = StyleSheet.create(theme => ({
  sheet: {
    padding: theme.spacing['3xl'],
    paddingBottom: theme.spacing['4xl'],
    gap: theme.spacing.xl,
  },
  sheetExpanded: {
    flex: 1,
  },
  kicker: {
    ...theme.typography.label,
    color: theme.colors.textTertiary,
  },
  fieldGroup: {
    gap: theme.spacing.sm,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.xs,
  },
  fieldLabel: {
    ...theme.typography.label,
    color: theme.colors.textSecondary,
  },
  fieldLabelOptional: {
    fontFamily: theme.fonts.sans,
    fontSize: 9,
    lineHeight: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
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
  descriptionInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xs,
    padding: theme.spacing.md,
    fontFamily: theme.fonts.serif,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: theme.colors.text,
    minHeight: 120,
  },
  footerRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  footerCancel: {
    flex: 1,
  },
  footerSubmit: {
    flex: 1.3,
  },
  formSections: {
    gap: theme.spacing.xl,
  },
}))
