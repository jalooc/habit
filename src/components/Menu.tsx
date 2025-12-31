import { View } from 'react-native'
import { Link } from '@react-navigation/native'

type Props = {
}

const Menu = ({  }: Props) => {
  return (
    <View>
      <Link screen="Home" params={{ username: 'Jack' }}>Home</Link>
      <Link screen="Email" params={{ email: 'jack@reacher.com' }}>Email</Link>
      <Link screen="Address" params={{ address: 'USA' }}>Address</Link>
    </View>
  )
}

export default Menu
