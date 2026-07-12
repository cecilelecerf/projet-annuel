<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'
import DeleteAccountDialog from '@/components/profile/DeleteAccountDialog.vue'
import EditAccountDialog from '@/components/profile/EditAccountDialog.vue'
import ProfileHeader from '../components/ProfileHeader.vue'
import ProfileInfoRows from '../components/ProfileInfoRows.vue'
import ProfileActions from '../components/ProfileActions.vue'
import ClinicInfoCard from '../components/ClinicInfoCard.vue'
import { useProfileClinicData } from '../composables/useProfileClinicData'
import StaffList from '@/features/staffs/components/StaffList.vue'
import ReviewComponent from '@/features/reviews/components/ReviewComponent.vue'

const authStore = useAuthStore()
const router = useRouter()
const user = authStore.user

const deleteDialog = ref<InstanceType<typeof DeleteAccountDialog> | null>(null)
const editDialog = ref<InstanceType<typeof EditAccountDialog> | null>(null)
const loggingOut = ref(false)

// DIRECTOR n'affiche que l'email ; les autres rôles affichent aussi prénom/nom
const infoRows = computed(() => {
  if (user?.role === 'DIRECTOR') {
    return [{ label: 'Email', value: user.email }]
  }
  return [
    { label: 'Email', value: user?.email ?? '' },
    { label: 'Prénom', value: user?.firstname ?? '' },
    { label: 'Nom', value: user?.lastname ?? '' },
  ]
})

// CLIENT n'a pas de bouton "Modifier"
const showEdit = computed(() => user?.role !== 'CLIENT')

// Seuls véto/secrétaire voient les infos de clinique + l'équipe
const showClinicSections = computed(
  () =>
    user?.role === 'VETERINARIAN' ||
    user?.role === 'SECRETARY' ||
    user?.role === 'DIRECTOR' ||
    user?.role === 'REFERENT',
)

const { clinics, staffByClinic, load: loadClinicData } = useProfileClinicData()

onMounted(() => {
  if (showClinicSections.value) loadClinicData()
})

async function handleLogout() {
  loggingOut.value = true
  try {
    await authStore.logout()
    router.push('/')
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <div class="profil-card" v-if="user">
    <ProfileHeader
      :firstname="user.firstname"
      :lastname="user.lastname"
      :role="user.role"
      :user-id="user.id"
      :avatar-url="user.avatarUrl"
    />

    <el-divider />

    <ProfileInfoRows :rows="infoRows" />

    <el-divider />

    <ProfileActions
      :show-edit="showEdit"
      :loading="loggingOut"
      @edit="editDialog?.open()"
      @logout="handleLogout"
      @delete="deleteDialog?.open()"
    />
  </div>
  <ReviewComponent v-if="user?.role === 'CLIENT'" />
  <template v-if="showClinicSections">
    <template v-for="clinic in clinics" :key="clinic.id">
      <ClinicInfoCard :clinic="clinic" />
      <StaffList
        v-if="staffByClinic[clinic.id]"
        :clinic-name="clinic.name"
        :staffs="staffByClinic[clinic.id] ?? []"
      />
    </template>
  </template>

  <EditAccountDialog ref="editDialog" />
  <DeleteAccountDialog ref="deleteDialog" />
</template>

<style scoped lang="scss">
.profil-card {
  background: var(--el-bg-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
}
</style>
