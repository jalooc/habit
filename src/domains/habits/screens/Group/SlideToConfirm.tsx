import { useState } from 'react'
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

const TRACK_HEIGHT = 56
const HANDLE_MARGIN = 4
const HANDLE_SIZE = TRACK_HEIGHT - 2 * HANDLE_MARGIN
const CONFIRM_FRACTION = 0.9
const RESET_MS = 700

type Props = {
  label: string,
  doneLabel: string,
  onConfirm: () => unknown,
}

const SlideToConfirm = ({ label, doneLabel, onConfirm }: Props) => {
  const [trackWidth, setTrackWidth] = useState(0)
  const [done, setDone] = useState(false)
  const travel = Math.max(1, trackWidth - HANDLE_SIZE - 2 * HANDLE_MARGIN)

  const pos = useSharedValue(0)
  const startPos = useSharedValue(0)

  const confirm = () => {
    setDone(true)
    onConfirm()
    setTimeout(() => {
      setDone(false)
      pos.value = 0
    }, RESET_MS)
  }

  const pan = Gesture.Pan()
    .enabled(!done && trackWidth > 0)
    .activeOffsetX([-8, 8])
    .failOffsetY([-12, 12])
    .onStart(() => {
      startPos.value = pos.value
    })
    .onUpdate(e => {
      pos.value = Math.max(0, Math.min(travel, startPos.value + e.translationX))
    })
    .onEnd(() => {
      if (pos.value >= travel * CONFIRM_FRACTION) {
        pos.value = withTiming(travel, { duration: 120 })
        scheduleOnRN(confirm)
      } else {
        pos.value = withTiming(0, { duration: 320, easing: Easing.bezier(0.2, 0.85, 0.25, 1) })
      }
    })

  const handleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pos.value }],
  }))
  const fillStyle = useAnimatedStyle(() => ({
    width: pos.value + HANDLE_SIZE / 2 + HANDLE_MARGIN,
    // hidden at rest — otherwise the trail peeks around the handle as a dark crescent
    opacity: pos.value < 1 ? 0 : 0.92,
  }))
  const labelStyle = useAnimatedStyle(() => ({
    opacity: done ? 1 : Math.max(0.35, 1 - (pos.value / travel) * 0.6),
  }))

  return (
    <View style={styles.track} onLayout={e => void setTrackWidth(e.nativeEvent.layout.width)}>
      <Animated.View style={[styles.fill, fillStyle]} />
      <Animated.View style={[styles.labelRow, labelStyle]} pointerEvents="none">
        {!done && <Lucide name="chevrons-right" size={14} style={styles.chevrons} />}
        <Text style={styles.label}>{done ? doneLabel : label}</Text>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.handle, handleStyle]}>
          <Lucide
            name={done ? 'check' : 'chevron-right'}
            size={done ? 16 : 18}
            style={done ? styles.handleGlyphDone : styles.handleGlyph}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  )
}

export default SlideToConfirm

const styles = StyleSheet.create(theme => ({
  track: {
    width: '100%',
    height: TRACK_HEIGHT,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.accent,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: theme.colors.text,
  },
  labelRow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  chevrons: {
    color: theme.colors.background,
    opacity: 0.75,
  },
  label: {
    ...theme.typography.button,
    color: theme.colors.background,
  },
  handle: {
    position: 'absolute',
    top: HANDLE_MARGIN,
    left: HANDLE_MARGIN,
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(26,24,20,0.28), 0 1px 2px rgba(26,24,20,0.16)',
  },
  handleGlyph: {
    color: theme.colors.accent,
  },
  handleGlyphDone: {
    color: theme.colors.text,
  },
}))
