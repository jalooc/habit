import { StaticScreenProps, useNavigation } from '@react-navigation/native'
import HabitEditor from 'src/domains/habits/components/HabitEditor'

type Props = StaticScreenProps<{
  groupId: string,
}>

const NewHabit = ({ route }: Props) => {
  const navigation = useNavigation()

  return (
    <HabitEditor
      groupId={route.params.groupId}
      onDone={() => void navigation.goBack()}
      onCancel={() => void navigation.goBack()}
    />
  )
}

export default NewHabit
