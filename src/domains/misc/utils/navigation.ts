import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Home from 'src/domains/misc/screens/Home'
import Group from 'src/domains/habits/screens/Group'
import { groupScreenLinkingConfig } from 'src/domains/habits/utils/linking'
import DevTools from 'src/domains/devTools/screens/DevTools'
import DevLog from 'src/domains/devTools/screens/DevLog'
import DevLogEntry from 'src/domains/devTools/screens/DevLogEntry'
import Backup from 'src/domains/devTools/screens/Backup'
import { createStaticNavigation, StaticParamList } from '@react-navigation/native'

const RootStack = createNativeStackNavigator({
  screenOptions: {
    headerShadowVisible: false,
    headerBackTitleVisible: false,
  },
  screens: {
    Home: {
      screen: Home,
      options: { headerShown: false },
    },
    Group: {
      screen: Group,
      options: { headerTitle: '' },
      linking: groupScreenLinkingConfig,
    },
    DevTools: {
      screen: DevTools,
      options: { headerTitle: 'Dev Tools' },
    },
    DevLog: {
      screen: DevLog,
      options: { headerTitle: 'Log' },
    },
    DevLogEntry: {
      screen: DevLogEntry,
      options: { headerTitle: 'Log entry' },
    },
    Backup: {
      screen: Backup,
      options: { headerTitle: 'Backup' },
    },
  },
})

type RootStackParamList = StaticParamList<typeof RootStack>

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {
    }
  }
}

export const Navigation = createStaticNavigation(RootStack)
