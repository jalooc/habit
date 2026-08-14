import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native'
import Lucide from '@react-native-vector-icons/lucide'
import { StyleSheet } from 'react-native-unistyles'
import { HabitSearchResult } from 'src/domains/habits/utils/searchHabits'

import HabitSuggestionRow from './HabitSuggestionRow'

type Props = {
  habitSuggestions: HabitSearchResult[],
  onLink: (habitId: string) => void,
  onDismiss: () => void,
}

const HabitSuggestions = ({ habitSuggestions, onLink, onDismiss }: Props) => {
  const { height } = useWindowDimensions()

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Existing habits with similar name</Text>
        <Pressable
          onPress={onDismiss}
          hitSlop={12}
          style={({ pressed }) => [styles.dismissButton, pressed && styles.dismissPressed]}
        >
          <Lucide name="x" size={18} style={styles.dismissIcon} />
        </Pressable>
      </View>
      <ScrollView
        style={{ maxHeight: height * 0.62 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {habitSuggestions.map((item, index) => (
          <HabitSuggestionRow
            key={item.id}
            habit={item}
            isFirst={index === 0}
            onLink={onLink}
          />
        ))}
      </ScrollView>
    </View>
  )
}

export default HabitSuggestions

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    minHeight: 24,
  },
  title: {
    ...theme.typography.label,
    color: theme.colors.textTertiary,
    flex: 1,
  },
  dismissButton: {
    padding: theme.spacing.xs,
  },
  dismissPressed: {
    opacity: 0.6,
  },
  dismissIcon: {
    color: theme.colors.textTertiary,
  },
}))
