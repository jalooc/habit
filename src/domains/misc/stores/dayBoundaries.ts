import { z } from 'zod'
import atomWithMMKV from 'src/domains/misc/utils/atomWithMMKV'

export const dayBoundariesSchema = z.object({
  start: z.object({
    hour: z.number(),
    minute: z.number(),
  }),
  end: z.object({
    hour: z.number(),
    minute: z.number(),
  }),
})

const dayBoundariesAtom = atomWithMMKV({
  key: 'day-boundaries',
  initialValue: { start: { hour: 7, minute: 0 }, end: { hour: 23, minute: 0 }},
  parse: data => dayBoundariesSchema.parse(data),
})

export default dayBoundariesAtom
