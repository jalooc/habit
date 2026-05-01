import { Text, Pressable } from 'react-native'
import { useRef, useState } from 'react'
import { StyleSheet } from 'react-native-unistyles'
import { TrueSheet } from '@lodev09/react-native-true-sheet'
import { useSelector } from '@legendapp/state/react'
import { toText } from 'rrule-temporal/totext'
import RecurrenceEditor from './RecurrenceEditor'
import groups$ from 'src/domains/groups/stores'

type Props = {
  groupId: string,
}

const RecurrenceSummary = ({ groupId }: Props) => {
  const sheetRef = useRef<TrueSheet>(null)
  const [editorKey, setEditorKey] = useState(0)
  const recurrenceText = useSelector(() => {
    const recurrence = groups$[groupId].recurrence.get()
    if (!recurrence) return undefined
    return toText(String(recurrence))
  })

  const summaryCard = recurrenceText ?
    (
      <Pressable
        style={({ pressed }) => [styles.filled, pressed && styles.filledPressed]}
        onPress={() => sheetRef.current?.present()}
      >
        <Text style={styles.filledLabel}>{recurrenceText}</Text>
      </Pressable>
    ) :
    (
      <Pressable
        style={({ pressed }) => [styles.empty, pressed && styles.emptyPressed]}
        onPress={() => sheetRef.current?.present()}
      >
        <Text style={styles.emptyLabel}>Add Schedule</Text>
      </Pressable>
    )

  return (
    <>
      {summaryCard}
      <TrueSheet
        ref={sheetRef}
        detents={[0.65]}
        onDidDismiss={() => void setEditorKey(k => k + 1)}
        scrollable
      >
        <RecurrenceEditor
          key={editorKey}
          groupId={groupId}
          onDismiss={() => sheetRef.current?.dismiss()}
        />
      </TrueSheet>
    </>
  )
}

export default RecurrenceSummary

const styles = StyleSheet.create(theme => ({
  empty: {
    borderRadius: theme.radii.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  emptyPressed: {
    backgroundColor: theme.colors.accentSubtle,
    borderColor: theme.colors.accent,
  },
  emptyLabel: {
    ...theme.typography.body,
    fontWeight: '500',
    color: theme.colors.accent,
  },
  filled: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  filledPressed: {
    backgroundColor: theme.colors.accentSubtle,
  },
  filledLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
  },
}))
