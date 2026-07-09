import { ref } from 'vue'
import { useNotify } from '@/composables/useNotify'
import { medicalHistoriesApi } from '../medical-history.api'
import type { FileWithUrl } from '@armali/schemas'

export function useDocumentUpload(medicalHistoryId: string) {
  const notify = useNotify()

  const files = ref<FileWithUrl[]>([])
  const loading = ref(false)
  const uploading = ref(false)

  async function load() {
    loading.value = true
    try {
      files.value = await medicalHistoriesApi.files.getByHistory(medicalHistoryId)
    } catch (err: unknown) {
      notify.error(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      loading.value = false
    }
  }

  async function upload(file: File) {
    uploading.value = true
    try {
      const { fileId } = await medicalHistoriesApi.files.upload({
        medicalHistoryId,
        file,
      })
      await medicalHistoriesApi.files.confirm({ medicalHistoryId, fileId })
      notify.success('Document ajouté')
      await load()
    } catch (err: unknown) {
      notify.error(err instanceof Error ? err.message : "Erreur lors de l'upload")
    } finally {
      uploading.value = false
    }
  }

  return { files, loading, uploading, load, upload }
}
