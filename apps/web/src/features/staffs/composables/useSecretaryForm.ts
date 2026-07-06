import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNotify } from '@/composables/useNotify'
import { staffApi } from '@/features/staffs/staff.api'

export function useSecretaryForm() {
  const router = useRouter()
  const notify = useNotify()

  const form = reactive({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    iban: '',
    bic: '',
    domiciliation: '',
    beneficiary: '',
  })

  const loading = ref(false)

  function hasAnyBankingField() {
    return !!(form.iban || form.bic || form.domiciliation || form.beneficiary)
  }

  async function submit() {
    loading.value = true
    try {
      await staffApi.createSecretary({
        firstname: form.firstname,
        lastname: form.lastname,
        email: form.email,
        password: form.password,
        bankingInfo: hasAnyBankingField()
          ? {
              iban: form.iban || undefined,
              bic: form.bic || undefined,
              domiciliation: form.domiciliation || undefined,
              beneficiary: form.beneficiary || undefined,
            }
          : undefined,
      })
      notify.success('Compte secrétaire créé avec succès')
      router.push({ name: 'REFERENT.Staff' })
    } catch (err: unknown) {
      notify.error(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      loading.value = false
    }
  }

  return { form, loading, submit }
}
