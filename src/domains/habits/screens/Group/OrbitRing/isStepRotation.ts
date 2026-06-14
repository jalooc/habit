const isStepRotation = (prev: string[], next: string[]): boolean => {
  if (prev.length !== next.length || prev.length < 2) return false
  const [first, ...rest] = prev
  return next[next.length - 1] === first && rest.every((id, i) => next[i] === id)
}

export default isStepRotation
