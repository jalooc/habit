import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import dayjs from 'dayjs'
import isWithinTodayWindow from './isWithinTodayWindow'

// Non-wrapping window: 07:00–23:00 (same day)
const nonWrapping = { start: { hour: 7, minute: 0 }, end: { hour: 23, minute: 0 }}

// Wrapping window: 10:00–02:00 (crosses midnight)
const wrapping = { start: { hour: 10, minute: 0 }, end: { hour: 2, minute: 0 }}

describe('isWithinTodayWindow', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  describe('non-wrapping window (07:00–23:00)', () => {
    it('counts an occurrence before the 23:00 close as within the window', () => {
      const now = dayjs().hour(12).minute(0).second(0).millisecond(0).valueOf()
      const occurrence = dayjs(now).hour(18).valueOf()
      expect(isWithinTodayWindow(occurrence, now, nonWrapping)).toBe(true)
    })

    it('counts an occurrence after the 23:00 close as outside the window', () => {
      const now = dayjs().hour(12).minute(0).second(0).millisecond(0).valueOf()
      const occurrence = dayjs(now).hour(23).minute(1).valueOf()
      expect(isWithinTodayWindow(occurrence, now, nonWrapping)).toBe(false)
    })

    it('treats 23:00 exactly as within the window (boundary)', () => {
      const now = dayjs().hour(12).minute(0).second(0).millisecond(0).valueOf()
      const occurrence = dayjs(now).hour(23).minute(0).valueOf()
      expect(isWithinTodayWindow(occurrence, now, nonWrapping)).toBe(true)
    })

    it('still closes at today 23:00 when now is before the window opens (quiet gap)', () => {
      const now = dayjs().hour(5).minute(0).second(0).millisecond(0).valueOf()
      const beforeClose = dayjs(now).hour(22).minute(59).valueOf()
      const afterClose = dayjs(now).hour(23).minute(1).valueOf()
      expect(isWithinTodayWindow(beforeClose, now, nonWrapping)).toBe(true)
      expect(isWithinTodayWindow(afterClose, now, nonWrapping)).toBe(false)
    })
  })

  describe('wrapping window (10:00–02:00)', () => {
    it('closes at the next-day 02:00 when now is inside the evening window', () => {
      const now = dayjs().hour(20).minute(0).second(0).millisecond(0).valueOf()
      const beforeClose = dayjs(now).add(1, 'day').hour(1).minute(59).valueOf()
      const afterClose = dayjs(now).add(1, 'day').hour(2).minute(1).valueOf()
      expect(isWithinTodayWindow(beforeClose, now, wrapping)).toBe(true)
      expect(isWithinTodayWindow(afterClose, now, wrapping)).toBe(false)
    })

    it('closes at today 02:00 when now is past midnight inside the wrap', () => {
      const now = dayjs().hour(1).minute(0).second(0).millisecond(0).valueOf()
      const beforeClose = dayjs(now).hour(1).minute(59).valueOf()
      const afterClose = dayjs(now).hour(2).minute(1).valueOf()
      expect(isWithinTodayWindow(beforeClose, now, wrapping)).toBe(true)
      expect(isWithinTodayWindow(afterClose, now, wrapping)).toBe(false)
    })

    it('closes at the next-day 02:00 when now is in the quiet gap (03:00–10:00)', () => {
      const now = dayjs().hour(5).minute(0).second(0).millisecond(0).valueOf()
      const beforeClose = dayjs(now).add(1, 'day').hour(1).minute(59).valueOf()
      const afterClose = dayjs(now).add(1, 'day').hour(2).minute(1).valueOf()
      expect(isWithinTodayWindow(beforeClose, now, wrapping)).toBe(true)
      expect(isWithinTodayWindow(afterClose, now, wrapping)).toBe(false)
    })
  })
})
