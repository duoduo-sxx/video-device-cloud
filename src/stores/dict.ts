import { defineStore } from 'pinia'
import { ref } from 'vue'
import { systemApi } from '@/api'
import type { DictType } from '@/types'

export const useDictStore = defineStore('dict', () => {
  const dicts = ref<DictType[]>([])
  const loaded = ref(false)
  const loading = ref(false)

  async function load(force = false): Promise<void> {
    if (loaded.value && !force) return
    if (loading.value) return
    loading.value = true
    try {
      const data = await systemApi.dicts()
      dicts.value = Array.isArray(data) ? data : []
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  function get(code: string): DictType | undefined {
    return dicts.value.find((d) => d.code === code)
  }

  function items(code: string): { label: string; value: string }[] {
    return (get(code)?.items || []).filter((i) => i.status === 1).map((i) => ({ label: i.label, value: i.value }))
  }

  function label(code: string, value: string): string {
    const item = (get(code)?.items || []).find((i) => i.value === value)
    return item?.label || value || '-'
  }

  return { dicts, loaded, loading, load, get, items, label }
})
