import { Text, View } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { StyleSheet } from 'react-native-unistyles'

type Props = {
  suffix?: string,
  children: string,
}

const AnimatedKicker = ({ suffix, children }: Props) => (
  <View style={styles.row}>
    <Text style={styles.kicker}>{children}</Text>
    {suffix && (
      <Animated.Text
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.suffix}
      >
        {suffix}
      </Animated.Text>
    )}
  </View>
)

export default AnimatedKicker

const styles = StyleSheet.create(theme => ({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
  },
  kicker: {
    ...theme.typography.label,
    color: theme.colors.textTertiary,
  },
  suffix: {
    ...theme.typography.label,
    color: theme.colors.textTertiary,
  },
}))
