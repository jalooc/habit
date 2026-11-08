import { getDefaultStore } from 'jotai'
import * as Notifications from 'src/domains/notifications/utils/notifications'
import buildNotifications from './buildNotifications'
import { devLog } from 'src/domains/devTools/utils/devLog'
import groupsAtom from 'src/domains/habits/stores/groups'
import habitsAtom from 'src/domains/habits/stores/habits'
import dayBoundariesAtom from 'src/domains/misc/stores/dayBoundaries'
import { serializeError } from 'serialize-error'
import pDebounce from 'p-debounce'

const store = getDefaultStore()

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

const reschedule = pDebounce.promise(async () => {
  try {
    const notifications = buildNotifications(
      store.get(groupsAtom),
      store.get(habitsAtom),
      store.get(dayBoundariesAtom),
    )
    devLog('rescheduling notifications', { notifications })
    await resetNotifications(notifications)
  } catch (rawError) {
    const error = serializeError(rawError)
    devLog('failed to reschedule notifications', { error })
  }
}, { after: true })

// Rebuilds the queue once on start and after every change to what it derives from. The one on start
// covers changes made before the scheduler was up and carries the 64-notification horizon forward on
// launches where nothing changes; it must run after the notification channels exist (see App).
export const startNotificationsScheduler = () => {
  const unsubscribes = [groupsAtom, habitsAtom, dayBoundariesAtom].map(source => store.sub(source, reschedule))
  const receivedListener = Notifications.addNotificationReceivedListener(async () => {
    const pending = await Notifications.getAllScheduledNotificationsAsync()
    if (pending.length === 0) await reschedule()
  })

  void reschedule()

  return () => {
    unsubscribes.forEach(unsubscribe => void unsubscribe())
    receivedListener.remove()
  }
}
