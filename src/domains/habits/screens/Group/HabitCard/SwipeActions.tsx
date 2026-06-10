import { Pressable, Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import Animated, { interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable'

type Props = {
  progress: SharedValue<number>,
  swipeableMethods: SwipeableMethods,
  onTickOff: () => void,
  onSkipRound: () => void,
}

const SwipeActions = ({ progress, swipeableMethods, onTickOff, onSkipRound }: Props) => {
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${(1 - progress.value) * 100}%` }],
  }))
  const tickOffStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.2, 1], [0, 0, 1], 'clamp'),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [25, 0], 'clamp') },
      { scale: interpolate(progress.value, [0, 1], [0.8, 1], 'clamp') },
    ],
  }))
  const skipStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.8, 1], [0, 0, 1], 'clamp'),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [100, 0], 'clamp') },
      { scale: interpolate(progress.value, [0, 1], [0.8, 1], 'clamp') },
    ],
  }))

  const handleTickOff = () => {
    swipeableMethods.close()
    onTickOff()
  }
  const handleSkipRound = () => {
    swipeableMethods.close()
    onSkipRound()
  }

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.itemContainer, tickOffStyle]}>
        <Pressable
          onPress={handleTickOff}
          accessibilityLabel="Tick off"
          style={[styles.item, styles.tickOff]}
        >
          <View style={styles.tickOffMarkRing}>
            <Text style={styles.tickOffMark}>✓</Text>
          </View>
          <Text style={styles.tickOffLabel}>Tick off</Text>
        </Pressable>
      </Animated.View>
      <Animated.View style={[styles.itemContainer, skipStyle]}>
        <Pressable
          onPress={handleSkipRound}
          accessibilityLabel="Skip round"
          style={[styles.item, styles.skipRound]}
        >
          <Text style={styles.skipLabel}>Skip{'\n'}round</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  )
}

export default SwipeActions

const styles = StyleSheet.create(theme => ({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'flex-end',
    paddingLeft: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
  },
  skipLabel: {
    ...theme.typography.button,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 13,
  },
  tickOff: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.text,
    borderRadius: theme.radii.sm,
  },
  skipRound: {
    borderWidth: 1,
    borderColor: theme.colors.accentDim,
    borderRadius: theme.radii.sm,
  },
  tickOffMarkRing: {
    width: 22,
    height: 22,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickOffMark: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 14,
  },
  tickOffLabel: {
    ...theme.typography.button,
    color: theme.colors.background,
  },
  pressedSubtle: {
    opacity: 0.6,
  },
}))
