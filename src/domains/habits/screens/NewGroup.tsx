import { Text, TextInput, View } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { useSetAtom } from 'jotai'
import { randomUUID } from 'expo-crypto'
import { useRef, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import Button from 'src/domains/misc/components/Button'
import groupsAtom from 'src/domains/habits/stores/groups'

const NewGroup = () => {
  const navigation = useNavigation()
  const { theme } = useUnistyles()
  const setGroups = useSetAtom(groupsAtom)
  const [name, setName] = useState('')
  const inputRef = useRef<TextInput>(null)

  const create = () => {
    const trimmedName = name.trim()
    if (!trimmedName) return
    navigation.goBack()
    setGroups(groups => ({ ...groups, [randomUUID()]: { name: trimmedName, habits: {}, lastServedAt: null }}))
  }

  return (
    <View style={styles.sheet}>
      <Text style={styles.kicker}>New rotation</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        ref={inputRef}
        autoFocus
        placeholder="Rotation name"
        placeholderTextColor={theme.colors.textTertiary}
        onKeyPress={e => {
          if (e.nativeEvent.key === 'Enter') create()
        }}
      />

      <Button title="Create rotation" onPress={create} />
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
  kicker: {
    ...theme.typography.label,
    color: theme.colors.textTertiary,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xs,
    padding: theme.spacing.md,
    fontFamily: theme.fonts.serif,
    fontSize: 18,
    lineHeight: 25,
    letterSpacing: -0.2,
    color: theme.colors.text,
  },
}))
