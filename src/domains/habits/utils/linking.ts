export const GROUP_ID_PARAM = 'id' as const

export const createGroupScreenLink = <T extends string>(groupId: T) => `group/${groupId}` as const

export const groupScreenLinkPlaceholder = createGroupScreenLink(`:${GROUP_ID_PARAM}`)
