import { Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StyleSheet } from 'react-native-unistyles'
import Lucide from '@react-native-vector-icons/lucide'

const SearchButton = () => {
  const navigation = useNavigation()

  return (
    <Pressable
      onPress={() => void navigation.navigate('Search')}
      accessibilityRole="button"
      accessibilityLabel="Search habits"
      hitSlop={6}
      style={({ pressed }) => [styles.circle, pressed && styles.pressed]}
    >
      <Lucide name="search" size={15} style={styles.icon} />
    </Pressable>
  )
}

export default SearchButton

const styles = StyleSheet.create(theme => ({
  circle: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: theme.colors.accentSubtle,
    borderColor: theme.colors.accent,
  },
  icon: {
    color: theme.colors.textSecondary,
  },
}))
