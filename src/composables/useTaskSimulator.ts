import { onBeforeUnmount, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'

let timer: number | null = null
let refCount = 0

export function useTaskSimulator() {
  const store = useDataStore()

  onMounted(() => {
    refCount += 1
    if (timer !== null) return
    timer = window.setInterval(() => {
      store.tick()
    }, 900)
  })

  onBeforeUnmount(() => {
    refCount -= 1
    if (refCount <= 0 && timer !== null) {
      window.clearInterval(timer)
      timer = null
      refCount = 0
    }
  })
}
