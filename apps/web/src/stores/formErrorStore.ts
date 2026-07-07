import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ApiError } from '@/lib/api'

export const useFormErrorStore = defineStore('formError', () => {
  const error = ref<string | null>(null)
  const fieldErrors = ref<Record<string, string[]>>({})

  const handle = (err: unknown) => {
    //   TODO : Clean that
    if (err instanceof ApiError) {
      error.value = err.message
      fieldErrors.value = err.errors ?? {}
    } else {
      error.value = 'Une erreur inattendue est survenue'
      fieldErrors.value = {}
    }
  }

  const clear = () => {
    error.value = null
    fieldErrors.value = {}
  }

  return { error, fieldErrors, handle, clear }
})
