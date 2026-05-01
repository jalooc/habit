import { View, ViewProps } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

type Props = ViewProps

const Box = ({ children, style, ...props }: Props) => (
  <View
    style={[styles.box, style]}
    {...props}
  >
    {children}
  </View>
)

const styles = StyleSheet.create(theme => ({
  box: {
    flex: 1,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
}))

export default Box
