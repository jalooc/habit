import { Text, TextProps } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

type Props = TextProps

const SectionLabel = ({ children, style, ...props }: Props) => (
  <Text style={[styles.label, style]} {...props}>
    {children}
  </Text>
)

export default SectionLabel

const styles = StyleSheet.create(theme => ({
  label: {
    ...theme.typography.label,
  },
}))
