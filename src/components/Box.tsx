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

const styles = StyleSheet.create({
  box: {
    padding: 20,
    gap: 20,
    alignItems: 'center',
  },
})

export default Box