import { defineStore } from 'pinia'
import { type ClinicStatus } from '@armali/schemas'
import { clinicApi } from '@/features/clinics/clinic.api'

interface ClinicStatusState {
  status: ClinicStatus | null
  loaded: boolean
  loading: Promise<ClinicStatus> | null
}

export const useClinicStatusStore = defineStore('clinicStatus', {
  state: (): ClinicStatusState => ({
    status: null,
    loaded: false,
    loading: null,
  }),

  actions: {
    /**
     * Récupère le statut de la clinique du directeur connecté.
     * Met en cache le résultat pour ne pas re-fetch à chaque changement de route.
     * `force` permet de rafraîchir après une action (ex: soumission d'une demande).
     */
    async fetchStatus(force = false): Promise<ClinicStatus> {
      if (this.loaded && !force) return this.status as ClinicStatus

      // Évite les appels concurrents si plusieurs guards se déclenchent en même temps
      if (this.loading) return this.loading

      this.loading = clinicApi.request
        .status()
        .then((data) => {
          this.status = data.status
          this.loaded = true
          return this.status
        })
        .finally(() => {
          this.loading = null
        })

      return this.loading
    },

    reset() {
      this.status = null
      this.loaded = false
      this.loading = null
    },
  },
})
