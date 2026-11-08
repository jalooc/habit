import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'jotai'
import { z } from 'zod'

vi.mock('react-native-mmkv')
vi.mock('src/domains/devTools/utils/devLog', () => ({ devLog: () => undefined }))

import atomWithMMKV, { getUnreadableCopies, getUnreadableCopiesOf, mmkvStorage } from './atomWithMMKV'

const KEY = 'table'
const INITIAL = { n: 0 }

const schema = z.object({ n: z.number() })

const makeAtom = () => atomWithMMKV({ key: KEY, initialValue: INITIAL, parse: data => schema.parse(data) })

const unreadableCopies = () => Object.values(getUnreadableCopies())

beforeEach(() => void mmkvStorage.getAllKeys().forEach(key => void mmkvStorage.remove(key)))

describe('reading', () => {
  it('starts from the initial value when nothing is stored', () => {
    expect(createStore().get(makeAtom())).toBe(INITIAL)
  })

  it('parses what is stored', () => {
    mmkvStorage.set(KEY, '{"n":5}')

    expect(createStore().get(makeAtom())).toEqual({ n: 5 })
  })

  it('starts from the initial value when what is stored is unreadable', () => {
    mmkvStorage.set(KEY, '{"n":"five"}')

    expect(createStore().get(makeAtom())).toBe(INITIAL)
  })

  it('sets nothing aside when everything was read', () => {
    mmkvStorage.set(KEY, '{"n":5}')
    createStore().get(makeAtom())

    expect(unreadableCopies()).toEqual([])
  })
})

describe('writing', () => {
  it('stores the value as JSON', () => {
    createStore().set(makeAtom(), { n: 7 })

    expect(mmkvStorage.getString(KEY)).toBe('{"n":7}')
  })
})

describe('what a read could not make sense of', () => {
  afterEach(() => void vi.useRealTimers())

  it('is set aside when none of it could be read', () => {
    mmkvStorage.set(KEY, '{"n":"five"}')
    createStore().get(makeAtom())

    expect(unreadableCopies()).toEqual(['{"n":"five"}'])
  })

  it('is set aside when the parser had to leave part of it out', () => {
    mmkvStorage.set(KEY, '{"n":5,"extra":true}')
    const tableAtom = atomWithMMKV({
      key: KEY,
      initialValue: INITIAL,
      parse: (data, onUnreadable) => {
        onUnreadable('extra', new Error('not a number'))
        return schema.parse({ n: 5 })
      },
    })

    expect(createStore().get(tableAtom)).toEqual({ n: 5 })
    expect(unreadableCopies()).toEqual(['{"n":5,"extra":true}'])
  })

  it('is set aside once, however many times it is read', () => {
    mmkvStorage.set(KEY, '{"n":"five"}')
    const parse = vi.fn((data: unknown) => schema.parse(data))
    const store = createStore()
    const tableAtom = atomWithMMKV({ key: KEY, initialValue: INITIAL, parse })

    // the first subscriber makes atomWithStorage read storage a second time
    const unsubscribe = store.sub(tableAtom, () => undefined)
    unsubscribe()

    expect(parse).toHaveBeenCalledTimes(2)
    expect(store.get(tableAtom)).toBe(INITIAL)
    expect(unreadableCopies()).toEqual(['{"n":"five"}'])
  })

  it('outlives the next write, which replaces the whole stored value', () => {
    mmkvStorage.set(KEY, '{"n":"five"}')
    createStore().set(makeAtom(), { n: 7 })

    expect(mmkvStorage.getString(KEY)).toBe('{"n":7}')
    expect(unreadableCopies()).toEqual(['{"n":"five"}'])
  })

  it('is listed under its own store only', () => {
    mmkvStorage.set(KEY, '{"n":"five"}')
    makeAtom()
    mmkvStorage.set('other', '{"n":"six"}')
    atomWithMMKV({ key: 'other', initialValue: INITIAL, parse: data => schema.parse(data) })

    expect(getUnreadableCopiesOf(KEY)).toEqual(['{"n":"five"}'])
    expect(getUnreadableCopiesOf('other')).toEqual(['{"n":"six"}'])
  })

  it('is kept next to an earlier copy rather than in its place', () => {
    vi.useFakeTimers()
    mmkvStorage.set(KEY, '{"n":"five"}')
    makeAtom()

    vi.advanceTimersByTime(1)
    mmkvStorage.set(KEY, '{"n":"six"}')
    makeAtom()

    expect(unreadableCopies()).toEqual(['{"n":"five"}', '{"n":"six"}'])
  })
})
