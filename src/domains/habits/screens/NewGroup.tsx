import { Text, TextInput, View } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { $TextInput } from '@legendapp/state/react-native'
import { useObservable } from '@legendapp/state/react'
import { randomUUID } from 'expo-crypto'
import { useRef } from 'react'
import { useNavigation } from '@react-navigation/native'
import Button from 'src/domains/misc/components/Button'
import groups$ from 'src/domains/habits/stores/groups'

const NewGroup = () => {
  const navigation = useNavigation()
  const { theme } = useUnistyles()
  const name$ = useObservable('')
  const inputRef = useRef<TextInput>(null)

  const create = () => {
    const name = name$.peek().trim()
    if (!name) return
    navigation.goBack()
    groups$[randomUUID()].set({ name, habits: {}})
  }

  return (
    <View style={styles.sheet}>
      <Text style={styles.title}>New Group</Text>
      <$TextInput
        style={styles.input}
        $value={name$}
        // @ts-expect-error ref type in Legend State components doesn't match
        ref={inputRef}
        autoFocus
        placeholder="Group name"
        placeholderTextColor={theme.colors.textTertiary}
        onKeyPress={e => {
          if (e.nativeEvent.key === 'Enter') create()
        }}
      />

      <Button title="Create" onPress={create} />
    </View>
  )
}

export default NewGroup

const styles = StyleSheet.create(theme => ({
  sheet: {
    padding: theme.spacing['3xl'],
    paddingBottom: theme.spacing['4xl'],
    gap: theme.spacing.xl,
  },
  title: {
    ...theme.typography.heading,
    color: theme.colors.text,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.text,
  },
}))
