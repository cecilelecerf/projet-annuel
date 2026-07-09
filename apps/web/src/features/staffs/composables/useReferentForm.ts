import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNotify } from '@/composables/useNotify'
import { staffApi } from '@/features/staffs/staff.api'
import type { ClinicId } from '@armali/schemas'

export function useReferentForm(clinicId: ClinicId) {
  const router = useRouter()
  const notify = useNotify()

  const form = reactive({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
  })

  const loading = ref(false)

  async function submit() {
    loading.value = true
    try {
      await staffApi.createReferent(clinicId, {
        firstname: form.firstname,
        lastname: form.lastname,
        email: form.email,
        password: form.password,
      })
      notify.success('Compte référent créé avec succès')
      router.push({ name: 'REFERENT.Staff' })
    } catch (err: unknown) {
      notify.error(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      loading.value = false
    }
  }

  return { form, loading, submit }
}
