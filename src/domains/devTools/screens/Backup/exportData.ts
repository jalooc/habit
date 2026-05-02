import { Directory } from 'expo-file-system'
import habits$ from 'src/domains/habits/stores/stores'
import groups$, { GroupsStore } from 'src/domains/habits/stores/groups'
import dayBoundaries$ from 'src/domains/misc/stores/dayBoundaries'

export const exportData = async () => {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    habits: habits$.get(),
    groups: serializeGroups(groups$.get()),
    dayBoundaries: dayBoundaries$.get(),
  }

  const directory = await pickDirectory()
  if (!directory) return { saved: false as const }

  const filename = `habit-export-${formatTimestamp(new Date())}.json`
  const file = directory.createFile(filename, 'application/json')
  file.write(JSON.stringify(payload, null, 2))

  return { saved: true as const, uri: file.uri }
}

const pickDirectory = async () => {
  try {
    return await Directory.pickDirectoryAsync()
  } catch {
    // User canceled the picker, or no directory was returned.
    return undefined
  }
}

const serializeGroups = (groups: GroupsStore) => Object.fromEntries(
  Object.entries(groups).map(([id, group]) => [id, {
    ...group,
    recurrence: group.recurrence?.toString(),
  }]),
)

const formatTimestamp = (date: Date) => date
  .toISOString()
  .replace(/[:.]/g, '-')
  .replace('T', '_')
  .slice(0, 19)
