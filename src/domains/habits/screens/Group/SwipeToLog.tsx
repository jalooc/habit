import { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { StyleSheet } from 'react-native-unistyles'
import Lucide from '@react-native-vector-icons/lucide'
import { withAlpha } from 'src/domains/misc/utils/theme'

const TRIGGER_THRESHOLD = 0.35
const RUBBER_BAND_START = 0.9

type Props = {
  label: string,
  onTrigger: () => unknown,
  children: ReactNode,
}

const SwipeToLog = ({ label, onTrigger, children }: Props) => {
  const width = useSharedValue(0)
  const tx = useSharedValue(0)

  const fire = () => {
    onTrigger()
    tx.value = 0
  }

  const pan = Gesture.Pan()
    .activeOffsetX([-14, 14])
    .failOffsetY([-12, 12])
    .onUpdate(e => {
      const w = width.value || 1
      const cap = w * RUBBER_BAND_START
      const dx = Math.max(0, e.translationX)
      tx.value = dx > cap ? cap + (dx - cap) * 0.25 : dx
    })
    .onEnd(() => {
      const w = width.value || 1
      if (tx.value / w >= TRIGGER_THRESHOLD) {
        tx.value = withTiming(w, { duration: 220, easing: Easing.out(Easing.quad) }, () => {
          scheduleOnRN(fire)
        })
      } else {
        tx.value = withTiming(0, { duration: 340, easing: Easing.bezier(0.2, 0.85, 0.25, 1) })
      }
    })

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }))
  // The pane stays invisible until the row actually moves — the row above it turns
  // translucent while pressed and would reveal it otherwise.
  const paneStyle = useAnimatedStyle(() => ({
    opacity: tx.value < 1 ? 0 : 1,
  }))
  const paneContentStyle = useAnimatedStyle(() => {
    const progress = tx.value / (width.value || 1)
    return {
      opacity: Math.min(1, 0.6 + progress * 0.8),
      transform: [{ scale: 0.92 + Math.min(progress / TRIGGER_THRESHOLD, 1) * 0.16 }],
    }
  })

  return (
    <GestureDetector gesture={pan}>
      <View
        style={styles.wrapper}
        onLayout={e => { width.value = e.nativeEvent.layout.width }}
      >
        <Animated.View style={[styles.pane, paneStyle]}>
          <Animated.View style={[styles.paneContent, paneContentStyle]}>
            <View style={styles.checkCircle}>
              <Lucide name="check" size={12} style={styles.check} />
            </View>
            <Text style={styles.paneLabel}>{label}</Text>
          </Animated.View>
        </Animated.View>
        <Animated.View style={rowStyle}>
          {children}
        </Animated.View>
      </View>
    </GestureDetector>
  )
}

export default SwipeToLog

const styles = StyleSheet.create(theme => ({
  wrapper: {
    overflow: 'hidden',
  },
  pane: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
  },
  paneContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingLeft: 22,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: withAlpha(theme.colors.background, 0.28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    color: theme.colors.background,
  },
  paneLabel: {
    ...theme.typography.button,
    letterSpacing: 1.8,
    color: theme.colors.background,
  },
}))
