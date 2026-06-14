import { TextInput } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { useState } from 'react'

type Props = {
  value: number,
  max: number,
  onChange: (value: number) => unknown,
  onFilled?: () => unknown,
  ref?: React.Ref<TextInput>,
}

const TimeDigitInput = ({ value, max, onChange, onFilled, ref }: Props) => {
  const [text, setText] = useState(() => String(value).padStart(2, '0'))

  const handleFocus = () => void setText('')

  const handleBlur = () => {
    const parsed = parseInt(text, 10)
    const safeValue = isNaN(parsed) ? value : Math.min(Math.max(parsed, 0), max)
    onChange(safeValue)
    setText(String(safeValue).padStart(2, '0'))
  }

  const handleChangeText = (newText: string) => {
    const digits = newText.replace(/\D/g, '').slice(0, 2)
    setText(digits)
    if (digits.length === 2) {
      const parsed = parseInt(digits, 10)
      const safeValue = Math.min(Math.max(parsed, 0), max)
      onChange(safeValue)
      onFilled?.()
    }
  }

  return (
    <TextInput
      ref={ref}
      style={styles.input}
      value={text}
      onChangeText={handleChangeText}
      onFocus={handleFocus}
      onBlur={handleBlur}
      keyboardType="number-pad"
      maxLength={2}
    />
  )
}

export default TimeDigitInput

const styles = StyleSheet.create(theme => ({
  input: {
    ...theme.typography.heading,
    fontFamily: theme.fonts.serif,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    textAlign: 'center',
    minWidth: 52,
  },
}))
