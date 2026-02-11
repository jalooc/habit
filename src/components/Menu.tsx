import { Link } from '@react-navigation/native'
import Box from './Box'

const Menu = () => (
  <Box>
    <Link screen="Home" params={{ username: 'Jack' }}>Home</Link>
    <Link screen="Email" params={{ email: 'jack@reacher.com' }}>Email</Link>
    <Link screen="Address" params={{ address: 'USA' }}>Address</Link>
  </Box>
)

export default Menu
