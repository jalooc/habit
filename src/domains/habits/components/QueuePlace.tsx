import { ComponentProps } from 'react'
import { Text } from 'react-native'
import { splitQueuePlace } from 'src/domains/habits/utils/queuePlace'

type Props = {
  index: number,
  count: number,
  upNextStyle: ComponentProps<typeof Text>['style'],
}

// Renders inside the consumer's own <Text>, which owns the base style.
const QueuePlace = ({ index, count, upNextStyle }: Props) => {
  const { isUpNext, place, ofTotal } = splitQueuePlace(index, count)

  return (
    <>
      {isUpNext ? <Text style={upNextStyle}>{place}</Text> : place}
      {ofTotal}
    </>
  )
}

export default QueuePlace
