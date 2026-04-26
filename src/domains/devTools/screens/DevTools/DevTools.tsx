import { ScrollView, Text, Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { useLinkProps } from '@react-navigation/native'
import Box from '../../../../components/Box'

type Tool = {
  key: string
  title: string
  subtitle: string
  to: { screen: keyof ReactNavigation.RootParamList }
}

const tools = [
  {
    key: 'log',
    title: 'Log',
    subtitle: 'Timeline of devLog() calls',
    to: { screen: 'DevLog' },
  },
] as const satisfies readonly Tool[]

const DevTools = () => (
  <Box>
    <ScrollView contentContainerStyle={styles.list}>
      {tools.map(tool => (
        <ToolRow key={tool.key} tool={tool} />
      ))}
    </ScrollView>
  </Box>
)

export default DevTools

const ToolRow = ({ tool }: { tool: Tool }) => {
  const linkProps = useLinkProps(tool.to)

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      {...linkProps}
    >
      <View style={styles.textArea}>
        <Text style={styles.title}>{tool.title}</Text>
        <Text style={styles.subtitle}>{tool.subtitle}</Text>
      </View>
      <Text style={styles.chevron}>{'›'}</Text>
    </Pressable>
  )
}

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
}))
