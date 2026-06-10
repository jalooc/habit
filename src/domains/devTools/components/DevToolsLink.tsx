import { Text } from 'react-native'
import { useLinkProps } from '@react-navigation/native'
import { Pressable } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

const DevToolsLink = () => {
  const linkProps = useLinkProps({ screen: 'DevTools' })

  return (
    <Pressable
      style={({ pressed }) => [homeStyles.container, pressed && homeStyles.pressed]}
      hitSlop={8}
      {...linkProps}
    >
      <Text style={homeStyles.text}>DEV</Text>
    </Pressable>
  )
}

export default DevToolsLink

const homeStyles = StyleSheet.create(theme => ({
  container: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pressed: {
    backgroundColor: theme.colors.accentSubtle,
    borderColor: theme.colors.accent,
  },
  text: {
    ...theme.typography.label,
    color: theme.colors.textTertiary,
  },
}))
