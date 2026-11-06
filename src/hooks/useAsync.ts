import { useEffect, useState } from 'react'

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    fn()
      .then((res) => {
        if (alive) {
          setData(res)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (alive) {
          setError(err)
          setLoading(false)
        }
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error, setData }
}
