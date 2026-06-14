import { useEffect } from 'react'
import { Pressable, Text } from 'react-native'
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useValue } from '@legendapp/state/react'
import { StyleSheet } from 'react-native-unistyles'
import lastAction$ from 'src/domains/habits/stores/lastAction'
import { undoLastAction, dismissLastAction } from 'src/domains/habits/utils/habitActions'

type Props = {
  bottomOffset?: number,
}

const DISMISS_DELAY_MS = 5500

const UndoToast = ({ bottomOffset = 14 }: Props) => {
  const action = useValue(lastAction$)
  const { bottom: bottomInset } = useSafeAreaInsets()

  useEffect(() => {
    if (!action) return
    const timer = setTimeout(dismissLastAction, DISMISS_DELAY_MS)
    return () => void clearTimeout(timer)
  }, [action?.at])

  if (!action) return null

  const prefix = action.type === 'completed' ? 'Logged' : 'Skipped'
  const label = `${prefix} · ${action.habitName}`

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      exiting={FadeOutDown.duration(200)}
      style={[styles.toast, { bottom: bottomInset + bottomOffset }]}
    >
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      <Pressable onPress={undoLastAction} hitSlop={12}>
        <Text style={styles.undoText}>UNDO</Text>
      </Pressable>
    </Animated.View>
  )
}

export default UndoToast

const styles = StyleSheet.create(theme => ({
  toast: {
    position: 'absolute',
    left: 22,
    right: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    backgroundColor: theme.colors.text,
    borderRadius: theme.radii.pill,
    paddingVertical: 10,
    paddingLeft: 18,
    paddingRight: 14,
    zIndex: 30,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.background,
    flex: 1,
  },
  undoText: {
    ...theme.typography.button,
    color: theme.colors.accent,
  },
}))
