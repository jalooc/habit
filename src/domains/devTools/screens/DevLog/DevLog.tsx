import { FlatList, Text, Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { useNavigation, useLinkProps } from '@react-navigation/native'
import { useLayoutEffect } from 'react'
import Box from '../../../misc/components/Box'
import { useDevLogs, clearDevLogs, DevLogEntry } from '../../utils/devLog'
import { formatPayload, needsExpansion } from '../DevLogEntry/formatPayload'
import { formatTimestamp } from './formatTimestamp'

const DevLog = () => {
  const entries = useDevLogs()
  const navigation = useNavigation()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={clearDevLogs} hitSlop={8}>
          <Text style={styles.clearButton}>Clear</Text>
        </Pressable>
      ),
    })
  }, [navigation])

  return (
    <Box>
      <FlatList
        data={entries}
        keyExtractor={entry => entry.id}
        renderItem={({ item }) => <LogRow entry={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState />}
      />
    </Box>
  )
}

export default DevLog

const LogRow = ({ entry }: { entry: DevLogEntry }) => {
  const formatted = entry.payload === undefined ? '' : formatPayload(entry.payload)
  const expandable = entry.payload !== undefined && needsExpansion(formatted)
  const linkProps = useLinkProps({ screen: 'DevLogEntry', params: { entry }})

  const content = (
    <>
      <View style={styles.rowHeader}>
        <Text style={styles.label}>{entry.label}</Text>
        <Text style={styles.timestamp}>{formatTimestamp(entry.timestamp)}</Text>
      </View>
      {entry.payload !== undefined && (
        <Text style={styles.payload} numberOfLines={2} ellipsizeMode="tail">
          {formatted}
        </Text>
      )}
    </>
  )

  if (!expandable) {
    return <View style={styles.row}>{content}</View>
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      {...linkProps}
    >
      {content}
    </Pressable>
  )
}

const EmptyState = () => (
  <View style={styles.empty}>
    <Text style={styles.emptyText}>No logs yet</Text>
  </View>
)

const styles = StyleSheet.create(theme => ({
  list: {
    gap: theme.spacing.sm,
  },
  row: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  rowPressed: {
    opacity: 0.8,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: theme.spacing.sm,
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
  },
  timestamp: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  payload: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontFamily: 'Courier',
  },
  clearButton: {
    ...theme.typography.body,
    color: theme.colors.accent,
  },
  empty: {
    paddingVertical: theme.spacing['4xl'],
    alignItems: 'center',
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textTertiary,
  },
}))
