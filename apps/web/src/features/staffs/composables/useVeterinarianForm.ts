import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNotify } from '@/composables/useNotify'
import { staffApi } from '@/features/staffs/staff.api'
import type { Speciality, SpecialityId } from '@armali/schemas'
import { specialityApi } from '@/features/specialities/speciality.api'

export function useVeterinarianForm() {
  const router = useRouter()
  const notify = useNotify()

  const form = reactive({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    licenseNumber: '',
    bio: '',
    birthCity: '',
    birthDepartment: '',
    birthCountry: '',
    nationality: '',
    inseNumber: '',
    diploma: '',
    diplomaObtainedAt: '',
    rppsNumber: '',
    orderRegisteredAt: '',
    practiceAuthorization: false,
    proPhone: '',
    iban: '',
    bic: '',
    domiciliation: '',
    beneficiary: '',
  })

  const selectedSpecialityIds = ref<string[]>([])
  const specialityOptions = ref<Speciality[]>([])
  const specialitySearchLoading = ref(false)
  const loading = ref(false)

  async function searchSpecialities(query: string) {
    if (!query) return
    specialitySearchLoading.value = true
    try {
      specialityOptions.value = await specialityApi.search(query)
    } catch {
      /* silencieux */
    } finally {
      specialitySearchLoading.value = false
    }
  }

  function hasAnyIdentityField() {
    return !!(
      form.birthCity ||
      form.birthDepartment ||
      form.birthCountry ||
      form.nationality ||
      form.inseNumber ||
      form.diploma ||
      form.diplomaObtainedAt ||
      form.rppsNumber ||
      form.orderRegisteredAt ||
      form.practiceAuthorization
    )
  }

  function hasAnyBankingField() {
    return !!(form.iban || form.bic || form.domiciliation || form.beneficiary)
  }

  async function submit() {
    loading.value = true
    try {
      await staffApi.createVeterinarian({
        firstname: form.firstname,
        lastname: form.lastname,
        email: form.email,
        password: form.password,
        licenseNumber: form.licenseNumber,
        bio: form.bio || undefined,
        specialityIds: selectedSpecialityIds.value.length
          ? (selectedSpecialityIds.value as SpecialityId[])
          : undefined,
        identity: hasAnyIdentityField()
          ? {
              birthCity: form.birthCity || undefined,
              birthDepartment: form.birthDepartment || undefined,
              birthCountry: form.birthCountry || undefined,
              nationality: form.nationality || undefined,
              inseNumber: form.inseNumber || undefined,
              diploma: form.diploma || undefined,
              diplomaObtainedAt: form.diplomaObtainedAt
                ? new Date(form.diplomaObtainedAt).toISOString()
                : undefined,
              rppsNumber: form.rppsNumber || undefined,
              orderRegisteredAt: form.orderRegisteredAt
                ? new Date(form.orderRegisteredAt).toISOString()
                : undefined,
              practiceAuthorization: form.practiceAuthorization,
              proPhone: form.proPhone || undefined,
            }
          : undefined,
        bankingInfo: hasAnyBankingField()
          ? {
              iban: form.iban || undefined,
              bic: form.bic || undefined,
              domiciliation: form.domiciliation || undefined,
              beneficiary: form.beneficiary || undefined,
            }
          : undefined,
      })
      notify.success('Compte vétérinaire créé avec succès')
      router.push({ name: 'REFERENT.Staff' })
    } catch (err: unknown) {
      notify.error(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      loading.value = false
    }
  }

  return {
    form,
    selectedSpecialityIds,
    specialityOptions,
    specialitySearchLoading,
    loading,
    searchSpecialities,
    submit,
  }
}
