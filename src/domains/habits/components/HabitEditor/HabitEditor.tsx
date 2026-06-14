import { useEffect, useRef } from 'react'
import { Alert, Text, TextInput, View } from 'react-native'
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
import useUnmountPromise from 'src/domains/misc/utils/useUnmountPromise'
import PendingImageRow from './PendingImageRow'

type Props = {
  groupId: string,
  habitId?: string,
  onDone: () => unknown,
  onCancel: () => unknown,
  onRemoved?: () => unknown,
}

const HabitEditor = ({ groupId, habitId, onDone, onCancel, onRemoved }: Props) => {
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

  useEffect(() => () => void clearPendingImages(), [])

  const submit = async () => {
    const [description, newFilenames] = await Promise.all([
      descInputRef.current?.getMarkdown() ?? '',
      commitPendingImages(),
    ])
    const remainingFilenames = existingImages$.peek().map(i => i.filename)
    const images = [...remainingFilenames, ...newFilenames]
    const name = name$.peek().trim()
    const filesToDelete = originalFilenames.current.filter(f => !remainingFilenames.includes(f))

    onDone()

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

  const handleRemove = (habitId: string, onRemoved: () => unknown) => () => {
    if (isInOtherGroup) {
      Alert.alert(
        'Remove from rotation?',
        'This habit will be removed from this rotation but remain in others.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              onRemoved()
              await unmountPromise

              groups$[groupId].habits[habitId].delete()
            },
          },
        ],
      )
    } else {
      Alert.alert(
        'Delete habit?',
        'This habit isn\'t in any other rotation. It will be permanently deleted.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              onRemoved()
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
      <Text style={styles.kicker}>{isEditMode ? 'Edit habit' : 'New habit'}</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Name</Text>
        <TextInputWrapper onPaste={handlePaste}>
          <$TextInput
            style={styles.input}
            $value={name$}
            // @ts-expect-error ref type in Legend State components doesn't match
            ref={nameInputRef}
            autoFocus={!isEditMode}
            placeholder="e.g. Hollow hold"
            placeholderTextColor={theme.colors.textTertiary}
            onKeyPress={e => {
              if (e.nativeEvent.key === 'Enter' && canSubmit) void submit()
            }}
          />
        </TextInputWrapper>
      </View>

      <View style={styles.fieldGroup}>
        <View style={styles.fieldLabelRow}>
          <Text style={styles.fieldLabel}>Note</Text>
          <Text style={styles.fieldLabelOptional}>· optional</Text>
        </View>
        <EnrichedMarkdownTextInput
          ref={descInputRef}
          defaultValue={habitId ? habits$[habitId].description.peek() : ''}
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
      {isEditMode && onRemoved && (
        <Button
          title={isInOtherGroup ? 'Remove from rotation' : 'Delete habit'}
          onPress={handleRemove(habitId, onRemoved)}
          variant="secondary"
        />
      )}
    </View>
  )
}

export default HabitEditor

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
}))
