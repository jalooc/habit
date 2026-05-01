import { ScrollView, Text, Pressable, View, Alert } from 'react-native'
import { useState } from 'react'
import { StyleSheet } from 'react-native-unistyles'
import Box from '../../../../components/Box'
import { devLog } from '../../utils/devLog'
import { exportData } from './exportData'
import { importData } from './importData'

type Status =
  | { kind: 'idle' } |
  { kind: 'busy', message: string } |
  { kind: 'success', message: string } |
  { kind: 'error', message: string }

const Backup = () => {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const handleExport = async () => {
    setStatus({ kind: 'busy', message: 'Exporting…' })
    try {
      const result = await exportData()
      setStatus(result.saved ?
        { kind: 'success', message: 'Export saved.' } :
        { kind: 'idle' })
    } catch (error) {
      // eslint-disable-next-line no-restricted-syntax
      const message = error instanceof Error ? error.message : String(error)
      devLog('Backup export failed', { error: message })
      setStatus({ kind: 'error', message: `Export failed: ${message}` })
    }
  }

  const runImport = async () => {
    setStatus({ kind: 'busy', message: 'Importing…' })
    try {
      const result = await importData()
      setStatus(result.imported ?
        { kind: 'success', message: 'Import complete.' } :
        { kind: 'idle' })
    } catch (error) {
      // eslint-disable-next-line no-restricted-syntax
      const message = error instanceof Error ? error.message : String(error)
      devLog('Backup import failed', { error: message })
      setStatus({ kind: 'error', message: `Import failed: ${message}` })
    }
  }

  const handleImport = () => {
    Alert.alert(
      'Replace all data?',
      'This overwrites habits, groups, and day boundaries with the contents of the picked file.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Replace', style: 'destructive', onPress: runImport },
      ],
    )
  }

  const actions = [
    {
      key: 'export',
      title: 'Export data',
      subtitle: 'Save habits, groups, day boundaries to a JSON file',
      onPress: handleExport,
    },
    {
      key: 'import',
      title: 'Import data',
      subtitle: 'Pick a JSON backup; replaces existing data',
      onPress: handleImport,
    },
  ]

  return (
    <Box>
      <ScrollView contentContainerStyle={styles.list}>
        {actions.map(action => (
          <ActionRow key={action.key} action={action} disabled={status.kind === 'busy'} />
        ))}
        {status.kind !== 'idle' && (
          <Text style={status.kind === 'error' ? styles.error : styles.note}>
            {status.message}
          </Text>
        )}
      </ScrollView>
    </Box>
  )
}

export default Backup

type Action = {
  key: string,
  title: string,
  subtitle: string,
  onPress: () => void,
}

const ActionRow = ({ action, disabled }: { action: Action, disabled: boolean }) => (
  <Pressable
    onPress={action.onPress}
    disabled={disabled}
    style={({ pressed }) => [styles.row, pressed && styles.rowPressed, disabled && styles.rowDisabled]}
  >
    <View style={styles.textArea}>
      <Text style={styles.title}>{action.title}</Text>
      <Text style={styles.subtitle}>{action.subtitle}</Text>
    </View>
    <Text style={styles.chevron}>›</Text>
  </Pressable>
)

const styles = StyleSheet.create(theme => ({
  list: {
    gap: theme.spacing.md,
  },
  row: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowPressed: {
    opacity: 0.8,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  textArea: {
    flex: 1,
  },
  title: {
    ...theme.typography.heading,
    color: theme.colors.text,
    marginBottom: 2,
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  chevron: {
    fontSize: 24,
    color: theme.colors.textTertiary,
    marginLeft: theme.spacing.sm,
  },
  note: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  error: {
    ...theme.typography.caption,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
}))
