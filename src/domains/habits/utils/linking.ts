export const GROUP_ID_PARAM = 'id' as const

const createGroupScreenPath = <T extends string>(groupId: T) => `group/${groupId}` as const

export const createGroupScreenLink = (groupId: string) => createGroupScreenPath(groupId)

const groupScreenLinkPlaceholder = createGroupScreenPath(`:${GROUP_ID_PARAM}`)

export const groupScreenLinkingConfig = {
  path: groupScreenLinkPlaceholder,
}
