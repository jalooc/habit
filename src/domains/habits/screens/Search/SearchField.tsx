import { useEffect, useRef, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import Lucide from '@react-native-vector-icons/lucide'
import { useNativeStackNavigation } from 'src/domains/misc/utils/navigation'

type Props = {
  value: string,
  onChangeText: (text: string) => unknown,
  onCancel: () => unknown,
}

const SearchField = ({ value, onChangeText, onCancel }: Props) => {
  const { theme } = useUnistyles()
  const navigation = useNativeStackNavigation()
  const inputRef = useRef<TextInput>(null)
  const [isFocused, setIsFocused] = useState(false)

  // Focused once Search has slid in: any earlier and Android leaves the keyboard down. Only once, as this
  // event fires again when the habit sheet closes, and refocusing then pops the keyboard over the results, or
  // over the Group that replaces Search.
  useEffect(() => {
    const unsubscribe = navigation.addListener('transitionEnd', () => {
      unsubscribe()
      inputRef.current?.focus()
    })
    return unsubscribe
  }, [navigation])

  const clear = () => {
    onChangeText('')
    inputRef.current?.focus()
  }

  return (
    <View style={styles.row}>
      <View style={[styles.field, isFocused && styles.fieldFocused]}>
        <Lucide name="search" size={17} style={styles.icon} />
        <TextInput
          ref={inputRef}
          style={[styles.input, !value && styles.inputEmpty]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => void setIsFocused(true)}
          onBlur={() => void setIsFocused(false)}
          placeholder="Find a habit"
          placeholderTextColor={theme.colors.textSecondary}
          selectionColor={theme.colors.accent}
          accessibilityLabel="Search habits"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="done"
          submitBehavior="blurAndSubmit"
        />
        {value.length > 0 && (
          <Pressable
            onPress={clear}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            style={({ pressed }) => [styles.clear, pressed && styles.pressed]}
          >
            <Lucide name="x" size={13} style={styles.clearIcon} />
          </Pressable>
        )}
      </View>
      <Pressable onPress={onCancel} hitSlop={12} accessibilityRole="button">
        {({ pressed }) => <Text style={[styles.cancel, pressed && styles.pressed]}>Cancel</Text>}
      </Pressable>
    </View>
  )
}

export default SearchField

const styles = StyleSheet.create(theme => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    height: 48,
    paddingLeft: theme.spacing.lg,
    paddingRight: theme.spacing.md,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  fieldFocused: {
    borderColor: theme.colors.accent,
  },
  icon: {
    color: theme.colors.textSecondary,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    fontFamily: theme.fonts.serif,
    fontSize: 18,
    color: theme.colors.text,
  },
  // RN can't style a placeholder on its own, and the field only shows one while empty
  inputEmpty: {
    fontFamily: theme.fonts.serifItalic,
  },
  clear: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accentDim,
  },
  clearIcon: {
    color: theme.colors.text,
  },
  pressed: {
    opacity: 0.6,
  },
  cancel: {
    ...theme.typography.button,
    color: theme.colors.text,
  },
}))
