export const formatPayload = (payload: unknown): string => {
  try {
    return JSON.stringify(payload, null, 2)
  } catch {
    return String(payload)
  }
}

export const needsExpansion = (formatted: string): boolean =>
  formatted.split('\n').length > 2 || formatted.length > 120
