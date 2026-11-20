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
  // sized to match the search button beside it on Home
  container: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: theme.colors.accentSubtle,
    borderColor: theme.colors.accent,
  },
  text: {
    ...theme.typography.label,
    fontSize: 9,
    letterSpacing: 0.6,
    color: theme.colors.textTertiary,
  },
}))
