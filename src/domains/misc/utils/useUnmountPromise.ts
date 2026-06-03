import { useEffect, useState } from 'react'

export default () => {
  const [{ promise, resolve }] = useState(() => {
    let resolve: () => void = () => undefined

    const promise = new Promise<void>(_resolve => {
      resolve = _resolve
    })

    return { promise, resolve }
  })

  useEffect(() => resolve, [])

  return promise
}
