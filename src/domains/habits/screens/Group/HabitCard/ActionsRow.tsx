import { StyleSheet } from 'react-native-unistyles'
import { Pressable, Text, View } from 'react-native'

type Props = {
  onTickOff: () => void,
  onSkipRound: () => void,
}

const ActionsRow = ({ onTickOff, onSkipRound }: Props) => (
  <View style={actionStyles.container}>
    <View style={actionStyles.divider} />
    <View style={actionStyles.row}>
      <Pressable
        onPress={onTickOff}
        style={({ pressed }) => [actionStyles.tickOff, pressed && actionStyles.tickOffPressed]}
      >
        <View style={actionStyles.tickOffMarkRing}>
          <Text style={actionStyles.tickOffMark}>✓</Text>
        </View>
        <Text style={actionStyles.tickOffLabel}>Tick off</Text>
      </Pressable>
      <Pressable
        onPress={onSkipRound}
        style={({ pressed }) => [actionStyles.skip, pressed && actionStyles.pressedSubtle]}
      >
        <Text style={actionStyles.skipLabel}>Skip round</Text>
      </Pressable>
    </View>
  </View>
)

export default ActionsRow

const actionStyles = StyleSheet.create(theme => ({
  container: {
    marginTop: theme.spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.text,
    opacity: 0.08,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: theme.spacing.sm,
  },
  tickOff: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.accent,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 999,
    shadowColor: theme.colors.accent,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  tickOffPressed: {
    transform: [{ scale: 0.97 }],
    shadowOpacity: 0.18,
  },
  tickOffMarkRing: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: theme.colors.accentText,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickOffMark: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 14,
  },
  tickOffLabel: {
    color: theme.colors.accentText,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  skip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: theme.colors.text,
  },
  skipLabel: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  pressedSubtle: {
    opacity: 0.55,
  },
}))
