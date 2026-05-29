import { useRef } from 'react'
import { Pressable, Text, View, ViewStyle } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { useObservable, useValue } from '@legendapp/state/react'
import { TrueSheet } from '@lodev09/react-native-true-sheet'
import habits$ from 'src/domains/habits/stores/habits'
import ActionsRow from './ActionsRow'
import SwipeActions from './SwipeActions'
import ImageThumbnailRow from './ImageThumbnailRow'
import ImageViewer from './ImageViewer'
import { batch } from '@legendapp/state'
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import EditHabitSheet from './EditHabitSheet'
import Description from './Description'

type Props = {
  id: string,
  style?: ViewStyle,
  showTickOffControls?: boolean,
  onAction?: () => void,
}

const HabitCard = ({ id, style, showTickOffControls, onAction }: Props) => {
  const habit$ = habits$[id]
  const { name, images, description } = useValue(habit$)
  const viewer$ = useObservable({ visible: false, index: 0 })
  const editSheetRef = useRef<TrueSheet>(null)
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
        <View style={[habitStyles.container, style]}>
          <Pressable onPress={() => editSheetRef.current?.present()}>
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
      <EditHabitSheet id={id} sheetRef={editSheetRef} />
    </>
  )
}

export default HabitCard

const habitStyles = StyleSheet.create(theme => ({
  container: {
    borderRadius: theme.radii.lg,
    borderWidth: 1.5,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  name: {
    ...theme.typography.body,
    fontWeight: '500',
    color: theme.colors.text,
  },
}))
