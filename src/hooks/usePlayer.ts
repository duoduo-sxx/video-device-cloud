import { useCallback, useEffect, useRef, useState } from 'react'

export function usePlayer(duration: number, initial = 0) {
  const [time, setTime] = useState(initial)
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(1)
  const loopRef = useRef<[number, number] | null>(null)

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      setTime((t) => Math.min(duration, t + 0.05 * rate))
    }, 50)
    return () => window.clearInterval(id)
  }, [playing, rate, duration])

  useEffect(() => {
    if (!playing) return
    if (time >= duration) {
      const loop = loopRef.current
      if (loop) {
        setTime(loop[0])
      } else {
        setPlaying(false)
      }
    }
  }, [time, playing, duration])

  const seek = useCallback((t: number) => {
    setTime(Math.max(0, Math.min(duration, t)))
  }, [duration])

  const toggle = useCallback(() => setPlaying((p) => !p), [])

  const step = useCallback((frames: number) => {
    setTime((t) => Math.max(0, Math.min(duration, t + frames / 25)))
  }, [duration])

  const setLoop = useCallback((range: [number, number] | null) => {
    loopRef.current = range
    if (range) setTime(range[0])
  }, [])

  return { time, playing, rate, seek, toggle, setPlaying, setRate, step, setLoop }
}
