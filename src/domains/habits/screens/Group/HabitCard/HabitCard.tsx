import { Text, View, ViewStyle } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { useValue } from '@legendapp/state/react'
import habits$ from 'src/domains/habits/stores/habits'
import ActionsRow from './ActionsRow'
import { batch } from '@legendapp/state'

type Props = {
  id: string,
  style?: ViewStyle,
  showTickOffControls?: boolean,
  onAction?: () => void,
}

const HabitCard = ({ id, style, showTickOffControls, onAction }: Props) => {
  const habit$ = habits$[id]
  const { name } = useValue(habit$)

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
    <View style={[habitStyles.container, style]}>
      <Text style={habitStyles.name}>{name}</Text>
      {showTickOffControls && (
        <ActionsRow
          onTickOff={tickOff}
          onSkipRound={skipRound}
        />
      )}
    </View>
  )
}

export default HabitCard

const habitStyles = StyleSheet.create(theme => ({
  container: {
    borderRadius: theme.radii.lg,
    borderWidth: 1.5,
    padding: theme.spacing.lg,
  },
  name: {
    ...theme.typography.body,
    fontWeight: '500',
    color: theme.colors.text,
  },
}))
