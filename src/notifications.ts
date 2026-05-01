/* eslint-disable no-restricted-imports */
import * as Notifications from 'expo-notifications'
import { PermissionStatus } from 'expo-notifications'
import { Platform } from 'react-native'
import { NotificationChannelInput } from 'expo-notifications/src/NotificationChannelManager.types'
import { objectEntries } from 'tsafe'
import { NotificationRequestInput } from 'expo-notifications/src/Notifications.types'

type ChannelId = string
const CHANNELS_DEFINITIONS = {
  reminders: {
    name: 'Habit Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  },
} as const satisfies Record<ChannelId, NotificationChannelInput>

type CHANNELS_ID = keyof typeof CHANNELS_DEFINITIONS

Notifications.setNotificationHandler({
  // eslint-disable-next-line @typescript-eslint/require-await
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export const setupNotifications = async () => {
  if (Platform.OS === 'android') {
    await Promise.all(objectEntries(CHANNELS_DEFINITIONS).map(([channelId, channelConfiguration]) =>
      Notifications.setNotificationChannelAsync(channelId, channelConfiguration)
    ))
  }

  return requestPermissions()
}

const requestPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync()

  if (existingStatus === PermissionStatus.GRANTED) return true

  const { status } = await Notifications.requestPermissionsAsync()

  return status === PermissionStatus.GRANTED
}

export const scheduleNotificationAsyncForChannel = (param: NotificationRequestInput & {
  trigger: {
    channelId: CHANNELS_ID,
  },
}) => Notifications.scheduleNotificationAsync(param)

export {
  getLastNotificationResponse,
  addNotificationResponseReceivedListener,
  cancelAllScheduledNotificationsAsync,
  addNotificationReceivedListener,
  getAllScheduledNotificationsAsync,
  SchedulableTriggerInputTypes,
} from 'expo-notifications'
