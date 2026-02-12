import { Text, TextInput, View, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { $TextInput } from '@legendapp/state/react-native'
import { useObservable } from '@legendapp/state/react'
import { groups$ } from '../../stores'
import { randomUUID } from 'expo-crypto'
import { StyleSheet } from 'react-native-unistyles'
import { TrueSheet } from '@lodev09/react-native-true-sheet'
import { useRef } from 'react'
import Button from '../../components/Button'
import Box from '../../components/Box'
import Groups from './Groups'

const Home = () => {
  const newGroupName$ = useObservable('')
  const inputRef = useRef<TextInput>(null)
  const sheetRef = useRef<TrueSheet>(null)

  const addGroup = () => {
    sheetRef.current?.dismiss()
    const newGroupName = newGroupName$.get()
    setTimeout(() => groups$[randomUUID()].set({ name: newGroupName, habits: {} }), 500)
  }

  const { top } = useSafeAreaInsets()

  return (
    <Box style={{ paddingTop: top + 16 }}>
      <View style={homeStyles.header}>
        <Text style={homeStyles.greeting}>Your Habits</Text>
        <Text style={homeStyles.subtitle}>Stay consistent, stay strong</Text>
      </View>
      <Groups
        footer={
          <AddGroupCard onPress={() => sheetRef.current?.present()} />
        }
      />
      <TrueSheet
        ref={sheetRef}
        detents={['auto']}
        onDidPresent={() => inputRef.current?.focus()}
        onDidDismiss={() => newGroupName$.set('')}
      >
        <View style={sheetStyles.sheet}>
          <Text style={sheetStyles.sheetTitle}>New Group</Text>
          <$TextInput
            style={sheetStyles.input}
            $value={newGroupName$}
            ref={inputRef}
            placeholder="Group name"
            placeholderTextColor="#A8A29E"
            onKeyPress={e => {
              if (e?.nativeEvent.key === 'Enter') {
                addGroup()
              }
            }}
          />
          <Button title="Create" onPress={addGroup} />
        </View>
      </TrueSheet>
    </Box>
  )
}

export default Home

const homeStyles = StyleSheet.create(theme => ({
  header: {
    paddingBottom: theme.spacing.xl,
  },
  greeting: {
    ...theme.typography.title,
    color: theme.colors.text,
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.xs,
  },
}))

const AddGroupCard = ({ onPress }: { onPress: () => void }) => (
  <Pressable
    style={({ pressed }) => [addCardStyles.container, pressed && addCardStyles.pressed]}
    onPress={onPress}
  >
    <Text style={addCardStyles.plus}>+</Text>
    <Text style={addCardStyles.label}>New Group</Text>
  </Pressable>
)

const addCardStyles = StyleSheet.create(theme => ({
  container: {
    borderRadius: theme.radii.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  pressed: {
    backgroundColor: theme.colors.accentSubtle,
    borderColor: theme.colors.accent,
  },
  plus: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.accent,
  },
  label: {
    ...theme.typography.body,
    fontWeight: '500',
    color: theme.colors.accent,
  },
}))

const sheetStyles = StyleSheet.create(theme => ({
  sheet: {
    padding: theme.spacing['3xl'],
    paddingBottom: theme.spacing['4xl'],
    gap: theme.spacing.xl,
  },
  sheetTitle: {
    ...theme.typography.heading,
    color: theme.colors.text,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.text,
  },
}))
