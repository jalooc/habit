type Span = readonly [start: number, end: number]

type Run = {
  text: string,
  isMatch: boolean,
  start: number,
}

// Splits text into alternating plain and matched runs; spans may overlap or touch. Walks code units, not
// characters, since that's what the spans count.
const splitMatches = (text: string, spans: readonly Span[]) =>
  Array.from({ length: text.length }, (_, index) => spans.some(([start, end]) => start <= index && index < end))
    .reduce<Run[]>((runs, isMatch, index) => {
      const last = runs.at(-1)
      return last?.isMatch === isMatch ?
        [...runs.slice(0, -1), { ...last, text: last.text + text[index] }] :
        [...runs, { text: text[index], isMatch, start: index }]
    }, [])

export default splitMatches
