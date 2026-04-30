import { File } from 'expo-file-system'
import * as DocumentPicker from 'expo-document-picker'
import { RRuleTemporal } from 'rrule-temporal'
import { z } from 'zod'
import habits$, { habitsSchema } from '../../../../stores/habits'
import groups$, { persistedGroupsSchema } from '../../../../stores/groups'
import dayBoundaries$, { dayBoundariesSchema } from '../../../../stores/dayBoundaries'
import { batch } from '@legendapp/state'

const exportSchema = z.object({
  version: z.literal(1),
  exportedAt: z.iso.datetime(),
  habits: habitsSchema,
  groups: persistedGroupsSchema,
  dayBoundaries: dayBoundariesSchema,
})

export const importData = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
    multiple: false,
  })

  if (result.canceled) return { imported: false as const }

  const text = await new File(result.assets[0].uri).text()
  const parsed = exportSchema.parse(JSON.parse(text))

  batch(() => {
    habits$.set(parsed.habits)
    groups$.set(deserializeGroups(parsed.groups))
    dayBoundaries$.set(parsed.dayBoundaries)
  })

  return { imported: true as const }
}

type PersistedGroups = z.infer<typeof persistedGroupsSchema>

const deserializeGroups = (groups: PersistedGroups) => Object.fromEntries(
  Object.entries(groups).map(([id, group]) => [id, {
    ...group,
    recurrence: group.recurrence
      ? new RRuleTemporal({ rruleString: group.recurrence })
      : undefined,
  }]),
)
