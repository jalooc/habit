import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import SectionLabel from './SectionLabel'

const OtherRotationsHeader = () => (
  <View style={styles.container}>
    <SectionLabel style={styles.label}>Other rotations</SectionLabel>
  </View>
)

export default OtherRotationsHeader

const styles = StyleSheet.create(theme => ({
  container: {
    paddingHorizontal: 6,
    paddingBottom: 10,
  },
  label: {
    color: theme.colors.textSecondary,
  },
}))
