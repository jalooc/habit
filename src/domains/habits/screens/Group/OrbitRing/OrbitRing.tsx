import { useEffect, useRef } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { StyleSheet } from 'react-native-unistyles'
import isStepRotation from './isStepRotation'

type Habit = {
  id: string,
  name: string,
}

type Props = {
  habits: Habit[],
  size: number,
  kicker: string,
  kickerAccent?: boolean,
  onPressName: () => unknown,
}

const OrbitRing = ({ habits, size, kicker, kickerAccent, onPressName }: Props) => {
  const n = habits.length
  const radius = (size - 36) / 2
  const cx = size / 2

  const rotation = useSharedValue(0)
  const isRotating = useSharedValue(false)
  const prevIds = useRef<string[]>([])
  const haloScale = useSharedValue(1)
  const haloOpacity = useSharedValue(0.16)

  useEffect(() => {
    const prev = prevIds.current
    const next = habits.map(h => h.id)
    if (prev.length === next.length && prev.every((id, i) => id === next[i])) return
    prevIds.current = next

    if (n < 2 || prev.length === 0) return

    if (isStepRotation(prev, next)) {
      const step = 360 / prev.length
      isRotating.value = true

      rotation.value += step
      rotation.value = withTiming(0, {
        duration: 550,
        easing: Easing.bezier(0.55, 0.06, 0.3, 1),
      }, finished => {
        if (finished) {
          isRotating.value = false
        }
      })
    } else {
      isRotating.value = false
      rotation.value = 0
    }
  }, [habits])

  useEffect(() => {
    const startHalo = () => {
      haloScale.value = withRepeat(
        withSequence(
          withTiming(1.4, { duration: 2400 / 2, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 2400 / 2, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      )
      haloOpacity.value = withRepeat(
        withSequence(
          withTiming(0.06, { duration: 2400 / 2, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.16, { duration: 2400 / 2, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      )
    }

    startHalo()
    return () => {
      cancelAnimation(haloScale)
      cancelAnimation(haloOpacity)
    }
  }, [])

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))

  const haloAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: haloScale.value }],
    opacity: haloOpacity.value,
    display: isRotating.value ? 'none' : 'flex',
  }))

  const upNextName = habits.at(0)?.name ?? ''
  const centerTextSize = size >= 244 ? 21 : 19

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.outerRing,
          {
            width: radius * 2,
            height: radius * 2,
            borderRadius: radius,
            top: cx - radius,
            left: cx - radius,
          },
        ]}
      />

      <Animated.View style={[styles.rotatingLayer, { width: size, height: size }, ringAnimatedStyle]}>
        {Array.from({ length: n }, (_, i) => {
          const angle = (i / n) * 360 - 90
          const rad = (angle * Math.PI) / 180
          const x = cx + radius * Math.cos(rad)
          const y = cx + radius * Math.sin(rad)
          const isActive = i === 0

          return (
            <View
              key={habits[i].id}
              style={[
                styles.dotWrapper,
                { top: y - (isActive ? 12 : 5), left: x - (isActive ? 12 : 5) },
              ]}
            >
              {isActive && (
                <Animated.View
                  style={[
                    styles.halo,
                    { width: 24, height: 24, borderRadius: 12 },
                    haloAnimatedStyle,
                  ]}
                />
              )}
              <View style={isActive ? styles.activeDot : styles.inactiveDot} />
              {isActive && <View style={styles.activeInnerDot} />}
            </View>
          )
        })}
      </Animated.View>

      <View style={[styles.center, { width: size, height: size }]} pointerEvents="box-none">
        <Text
          style={[
            styles.kickerText,
            kickerAccent ? styles.kickerAccent : styles.kickerDefault,
          ]}
          numberOfLines={1}
        >
          {kicker}
        </Text>
        <Pressable
          onPress={onPressName}
          hitSlop={8}
          style={({ pressed }) => pressed && styles.namePressed}
        >
          <Text
            style={[styles.habitName, { fontSize: centerTextSize, maxWidth: size - 100 }]}
            numberOfLines={n > 0 ? 3 : 1}
          >
            {upNextName}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

export default OrbitRing

const styles = StyleSheet.create(theme => ({
  container: {
    position: 'relative',
  },
  outerRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: theme.colors.accentDim,
  },
  rotatingLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  dotWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    backgroundColor: theme.colors.accent,
  },
  activeDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.accent,
  },
  activeInnerDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.surface,
  },
  inactiveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.accentDim,
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  kickerText: {
    ...theme.typography.label,
    marginBottom: 10,
    textAlign: 'center',
  },
  kickerDefault: {
    color: theme.colors.textTertiary,
  },
  kickerAccent: {
    color: theme.colors.accent,
  },
  namePressed: {
    opacity: 0.6,
  },
  habitName: {
    fontFamily: theme.fonts.serif,
    lineHeight: 25,
    letterSpacing: -0.2,
    color: theme.colors.text,
    textAlign: 'center',
  },
}))
