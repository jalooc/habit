import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Home from 'src/domains/misc/screens/Home'
import NewGroup from 'src/domains/habits/screens/NewGroup'
import Group from 'src/domains/habits/screens/Group'
import EditGroup from 'src/domains/habits/screens/EditGroup'
import HabitForm from 'src/domains/habits/screens/HabitForm'
import EditSchedule from 'src/domains/habits/screens/EditSchedule'
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
    sheetCornerRadius: 20,
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
    NewGroup: {
      screen: NewGroup,
      options: {
        presentation: 'formSheet',
        sheetAllowedDetents: 'fitToContents',
      },
    },
    EditGroup: {
      screen: EditGroup,
      options: {
        presentation: 'formSheet',
        sheetAllowedDetents: 'fitToContents',
      },
    },
    HabitForm: {
      screen: HabitForm,
      options: {
        presentation: 'formSheet',
        sheetAllowedDetents: 'fitToContents',
      },
    },
    EditSchedule: {
      screen: EditSchedule,
      options: {
        presentation: 'formSheet',
        sheetAllowedDetents: [0.65] as number[],
      },
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
