import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { StyleSheet } from 'react-native-unistyles'

type Props = {
  tint: SharedValue<number>,
}

const NudgeTint = ({ tint }: Props) => {
  const tintStyle = useAnimatedStyle(() => ({ opacity: tint.value }))

  return <Animated.View style={[styles.tint, tintStyle]} pointerEvents="none" />
}

export default NudgeTint

const styles = StyleSheet.create(theme => ({
  tint: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.accentSubtle,
  },
}))
