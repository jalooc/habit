import { ComponentProps } from 'react'
import Group from 'src/domains/habits/screens/Group'

export const GROUP_ID_PARAM = 'id' as const

const createGroupScreenPath = <T extends string>(groupId: T) => `group/${groupId}` as const

type GroupScreenParamsWithoutId = Omit<ComponentProps<typeof Group>['route']['params'], typeof GROUP_ID_PARAM>

export const createGroupScreenLink = (
  groupId: string,
  params: GroupScreenParamsWithoutId = {}
) =>
  `${createGroupScreenPath(groupId)}${withQmIfPresent(new URLSearchParams({
    ...(params.withTickOff && { withTickOff: params.withTickOff.toString() }),
  }).toString())}`

const groupScreenLinkPlaceholder = createGroupScreenPath(`:${GROUP_ID_PARAM}`)

export const groupScreenLinkingConfig = {
  path: groupScreenLinkPlaceholder,
  parse: {
    withTickOff: (value: string) => ({ true: true, false: false }[value]),
  } satisfies {
    [key in keyof Required<GroupScreenParamsWithoutId>]: (value: string) => GroupScreenParamsWithoutId[key]
  },
}

const withQmIfPresent = (string: string) => string ? `?${string}` : string
