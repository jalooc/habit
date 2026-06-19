import { Text, View } from 'react-native'
import { useValue } from '@legendapp/state/react'
import { StyleSheet } from 'react-native-unistyles'
import { useNavigation } from '@react-navigation/native'
import Box from 'src/domains/misc/components/Box'
import RotationsList from 'src/domains/habits/components/RotationsList'
import AddRotationCard from 'src/domains/habits/components/AddRotationCard'
import groups$ from 'src/domains/habits/stores/groups'

const Groups = () => {
  const navigation = useNavigation()
  const groups = useValue(groups$)

  const groupIds = Object.keys(groups)
  const isEmpty = groupIds.length === 0
  const countLabel = `${groupIds.length} ${groupIds.length === 1 ? 'rotation' : 'rotations'}`

  return (
    <Box>
      <RotationsList
        groupIds={groupIds}
        isAppEmpty={isEmpty}
        header={
          <View style={styles.header}>
            <Text style={styles.title}>All rotations</Text>
            {!isEmpty && <Text style={styles.count}>{countLabel}</Text>}
          </View>
        }
        footer={
          <AddRotationCard
            onPress={() => void navigation.navigate('NewGroup')}
            isEmpty={isEmpty}
          />
        }
      />
    </Box>
  )
}

export default Groups

const styles = StyleSheet.create(theme => ({
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.text,
  },
  count: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
}))
