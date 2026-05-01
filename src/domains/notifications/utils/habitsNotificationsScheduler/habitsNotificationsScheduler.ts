import * as Notifications from 'src/domains/notifications/utils/notifications'
import buildNotifications from './buildNotifications'
import { devLog } from '../../../devTools/utils/devLog'
import groups$ from 'src/domains/groups/stores'
import habits$ from 'src/domains/habits/stores'
import dayBoundaries$ from 'src/domains/misc/stores/dayBoundaries'

const resetNotifications = async (notifications: ReturnType<typeof buildNotifications>) => {
  await Notifications.cancelAllScheduledNotificationsAsync()
  await Promise.all(notifications.map(n =>
    Notifications.scheduleNotificationAsync({
      content: {
        title: n.title,
        body: n.body,
        data: n.data,
        interruptionLevel: 'active',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: n.date,
        channelId: 'reminders',
      },
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

groups$.onChange(() => void reschedule())
habits$.onChange(() => void reschedule())
dayBoundaries$.onChange(() => void reschedule())

Notifications.addNotificationReceivedListener(async () => {
  const pending = await Notifications.getAllScheduledNotificationsAsync()
  if (pending.length === 0) await reschedule()
})
