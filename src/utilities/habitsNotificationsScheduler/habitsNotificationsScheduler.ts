import * as Notifications from 'expo-notifications'
import { SchedulableTriggerInputTypes } from 'expo-notifications'
import { groups$, habits$, dayBoundaries$ } from '../../stores'
import buildNotifications from './buildNotifications'
import { devLog } from '../../domains/devTools/utils/devLog'

const resetNotifications = async (notifications: ReturnType<typeof buildNotifications>) => {
  await Notifications.cancelAllScheduledNotificationsAsync()
  await Promise.all(notifications.map(n =>
    Notifications.scheduleNotificationAsync({
      content: { title: n.title, body: n.body, data: n.data },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: n.date },
    }),
  ))
}

const reschedule = async () => {
  try {
    const notifications = buildNotifications(groups$.get(), habits$.get())
    await resetNotifications(notifications)
  } catch (error) {
    devLog('failed to reschedule notifications', { error })
  }
}

groups$.onChange(() => reschedule())
habits$.onChange(() => reschedule())
dayBoundaries$.onChange(() => reschedule())

Notifications.addNotificationReceivedListener(async () => {
  const pending = await Notifications.getAllScheduledNotificationsAsync()
  if (pending.length === 0) await reschedule()
})
