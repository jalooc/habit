import { Pressable, Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { useObservable, useValue } from '@legendapp/state/react'
import { useNavigation } from '@react-navigation/native'
import habits$ from 'src/domains/habits/stores/habits'
import ActionsRow from './ActionsRow'
import SwipeActions from './SwipeActions'
import ImageThumbnailRow from './ImageThumbnailRow'
import ImageViewer from './ImageViewer'
import { batch } from '@legendapp/state'
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import Description from './Description'

type Props = {
  id: string,
  groupId: string,
  showTickOffControls?: boolean,
  onAction?: () => void,
}

const HabitCard = ({ id, groupId, showTickOffControls, onAction }: Props) => {
  const habit$ = habits$[id]
  const { name, images, description } = useValue(habit$)
  const viewer$ = useObservable({ visible: false, index: 0 })
  const navigation = useNavigation()
  const viewerVisible = useValue(viewer$.visible)
  const viewerIndex = useValue(viewer$.index)

  const tickOff = () => {
    batch(() => {
      habit$.lastActioned.set({
        timestamp: Date.now(),
        type: 'completed',
      })
      onAction?.()
    })
  }
  const skipRound = () => {
    batch(() => {
      habit$.lastActioned.set({
        timestamp: Date.now(),
        type: 'skipped',
      })
      onAction?.()
    })
  }

  return (
    <>
      <ReanimatedSwipeable
        enabled={!showTickOffControls}
        enableTrackpadTwoFingerGesture
        friction={2}
        rightThreshold={40}
        overshootRight={false}
        renderRightActions={(progress, _, swipeableMethods) => (
          <SwipeActions
            progress={progress}
            swipeableMethods={swipeableMethods}
            onTickOff={tickOff}
            onSkipRound={skipRound}
          />
        )}
      >
        <View style={habitStyles.container(id)}>
          <Pressable onPress={() => void navigation.navigate('HabitForm', { groupId, habitId: id })}>
            <Text style={habitStyles.name}>{name}</Text>
          </Pressable>
          {description && <Description description={description} />}
          {images && images.length > 0 && (
            <>
              <ImageThumbnailRow
                images={images}
                onPress={index => void viewer$.set({ visible: true, index })}
              />
              <ImageViewer
                images={images}
                initialIndex={viewerIndex}
                visible={viewerVisible}
                onClose={() => void viewer$.visible.set(false)}
              />
            </>
          )}
          {showTickOffControls && (
            <ActionsRow
              onTickOff={tickOff}
              onSkipRound={skipRound}
            />
          )}
        </View>
      </ReanimatedSwipeable>
    </>
  )
}

export default HabitCard

const habitStyles = StyleSheet.create(theme => ({
  container: (id: string) => {
    const { bg, border } = theme.pastelOf(id)
    return {
      borderRadius: theme.radii.md,
      borderWidth: 1.5,
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
      backgroundColor: bg,
      borderColor: border,
    }
  },
  name: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
}))
