import { useEffect, useRef, useState } from 'react'
import type { View } from 'react-native'
import type Animated from 'react-native-reanimated'
import {
  Easing,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { useNativeStackNavigation } from 'src/domains/misc/utils/navigation'

const SCROLL_MS = 600
const HOLD_MS = 1200
const FADE_MS = 900
const NUDGE_PX = 26

const out = { easing: Easing.out(Easing.quad) }
const back = { easing: Easing.inOut(Easing.quad) }

type Placement = {
  // undefined while the habit is already in full view
  centredScrollY?: number,
  viewportHeight: number,
}

// Points out one habit on arrival: scrolls it into view, tints it, and slides its swipe control a little as if
// it started moving on its own. The scroll waits for the screen to finish arriving, and the hold waits for the
// scroll, so none of it plays unseen. The two nudges add up to the hold plus the fade.
const useArrivalNudge = (isNudging: boolean) => {
  const navigation = useNativeStackNavigation()
  const viewportRef = useRef<View>(null)
  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const targetRef = useRef<View>(null)
  const contentHeight = useRef(0)
  const hasMeasured = useRef(false)
  const [placement, setPlacement] = useState<Placement>()
  const [hasArrived, setHasArrived] = useState(false)
  const [isTargetInView, setIsTargetInView] = useState(false)
  const scrollY = useSharedValue(0)
  const tint = useSharedValue(isNudging ? 1 : 0)
  const offset = useSharedValue(0)

  useEffect(() => navigation.addListener('transitionEnd', () => void setHasArrived(true)), [navigation])

  useAnimatedReaction(() => scrollY.value, (y, previous) => {
    if (previous !== null) scrollTo(scrollRef, 0, y, false)
  })

  useEffect(() => {
    if (!isNudging || !hasArrived || !placement) return
    const { centredScrollY, viewportHeight } = placement
    if (centredScrollY === undefined) {
      setIsTargetInView(true)
      return
    }

    const maxScrollY = Math.max(0, contentHeight.current - viewportHeight)
    scrollY.value = withTiming(
      Math.min(centredScrollY, maxScrollY),
      { duration: SCROLL_MS, easing: Easing.inOut(Easing.cubic) },
      finished => void (finished && scheduleOnRN(setIsTargetInView, true)),
    )
  }, [isNudging, hasArrived, placement])

  useEffect(() => {
    if (!isTargetInView) return

    tint.value = withDelay(HOLD_MS, withTiming(0, { duration: FADE_MS }))
    offset.value = withSequence(
      withTiming(NUDGE_PX, { duration: 380, ...out }),
      withTiming(0, { duration: 420, ...back }),
      withDelay(300, withTiming(NUDGE_PX / 2, { duration: 380, ...out })),
      withTiming(0, { duration: 620, ...back }),
    )
  }, [isTargetInView])

  const measureTarget = () => {
    const viewport = viewportRef.current
    const target = targetRef.current
    if (!isNudging || hasMeasured.current || !viewport || !target) return
    hasMeasured.current = true

    viewport.measureInWindow((_x, viewportY, _width, viewportHeight) => {
      target.measureInWindow((_targetX, targetY, _targetWidth, targetHeight) => {
        const top = targetY - viewportY
        const isInFullView = top >= 0 && top + targetHeight <= viewportHeight
        setPlacement({
          centredScrollY: isInFullView ? undefined : Math.max(0, top - (viewportHeight - targetHeight) / 2),
          viewportHeight,
        })
      })
    })
  }

  const onContentSizeChange = (_width: number, height: number) => {
    contentHeight.current = height
  }

  return { tint, offset, viewportRef, scrollRef, targetRef, measureTarget, onContentSizeChange }
}

export default useArrivalNudge
