const CHARACTERS = /./gsu
const MARKS = /\p{M}/gu
// letters that carry their mark in the letter itself, so decomposing and stripping marks leaves them alone
const MARKLESS_LETTERS: Partial<Record<string, string>> = { ł: 'l', đ: 'd', ø: 'o', ħ: 'h', ŧ: 't', ı: 'i', ß: 'ss' }

const foldCharacter = (character: string) => {
  const folded = character.toLowerCase().normalize('NFD').replace(MARKS, '')
  return MARKLESS_LETTERS[folded] ?? folded
}

// Folded a character at a time, so each part of the result can be traced back to the character it came from
const foldText = (text: string) => text.replace(CHARACTERS, foldCharacter)

export default foldText

type Span = readonly [start: number, end: number]

// Turns [start, end) spans of foldText(text) into the spans of text they came from. Folding can change a
// character's length ("ß" → "ss", "é" typed as "e" plus an accent → "e", a Korean syllable → three letters).
export const unfoldSpans = (text: string, foldedSpans: readonly Span[]) => {
  const sources = [...text.matchAll(CHARACTERS)].flatMap(({ 0: character, index }) =>
    Array.from({ length: foldCharacter(character).length }, () => ({ start: index, end: index + character.length })))

  // reaching on to where the next folded character's source starts takes in accents that fold to nothing
  return foldedSpans.map(([start, end]) =>
    [sources[start].start, Math.max(sources[end - 1].end, sources.at(end)?.start ?? text.length)] as const)
}
