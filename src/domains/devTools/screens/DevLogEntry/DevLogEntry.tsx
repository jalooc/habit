import { ScrollView, Text, View } from 'react-native'
import { StaticScreenProps } from '@react-navigation/native'
import { StyleSheet } from 'react-native-unistyles'
import dayjs from 'dayjs'
import Box from '../../../../components/Box'
import { DevLogEntry as DevLogEntryT } from '../../utils/devLog'
import { formatPayload } from './formatPayload'

type Props = StaticScreenProps<{
  entry: DevLogEntryT
}>

const DevLogEntry = ({ route }: Props) => {
  const { entry } = route.params

  return (
    <Box>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.label}>{entry.label}</Text>
          <Text style={styles.timestamp}>
            {dayjs(entry.timestamp).format('YYYY-MM-DD HH:mm:ss.SSS')}
          </Text>
        </View>
        {entry.payload === undefined ? (
          <Text style={styles.empty}>No payload</Text>
        ) : (
          <Text style={styles.payload} selectable>
            {formatPayload(entry.payload)}
          </Text>
        )}
      </ScrollView>
    </Box>
  )
}

export default DevLogEntry

const styles = StyleSheet.create(theme => ({
  content: {
    gap: theme.spacing.lg,
  },
  header: {
    gap: theme.spacing.xs,
  },
  label: {
    ...theme.typography.heading,
    color: theme.colors.text,
  },
  timestamp: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  payload: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontFamily: 'Courier',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  empty: {
    ...theme.typography.body,
    color: theme.colors.textTertiary,
  },
}))
