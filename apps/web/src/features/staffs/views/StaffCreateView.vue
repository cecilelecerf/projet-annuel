<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import ReferentFormTab from '../components/create/ReferentFormTab.vue'
import VeterinarianFormTab from '../components/create/VeterinarianFormTab.vue'
import SecretaryFormTab from '../components/create/SecretaryFormTab.vue'

const router = useRouter()
const authStore = useAuthStore()

const isDirector = computed(() => authStore.user?.role === 'DIRECTOR')

const activeTab = ref<'referent' | 'veterinarian' | 'secretary'>(
  isDirector.value ? 'referent' : 'veterinarian',
)
</script>

<template>
  <div class="create-page">
    <div class="page-header">
      <el-button text @click="router.push({ name: `${authStore.user?.role.toUpperCase()}.Staff` })">
        ← Retour au personnel
      </el-button>
      <h1>Ajouter un membre</h1>
    </div>

    <div class="tabs-shell">
      <el-tabs v-model="activeTab" class="staff-tabs">
        <el-tab-pane v-if="isDirector" label="Référent" name="referent">
          <ReferentFormTab />
        </el-tab-pane>

        <el-tab-pane label="Vétérinaire" name="veterinarian">
          <VeterinarianFormTab />
        </el-tab-pane>

        <el-tab-pane label="Secrétaire" name="secretary">
          <SecretaryFormTab />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-header h1 {
  font-size: var(--fs-4xl);
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: 0;
}

.tabs-shell {
  width: 100%;
}
.staff-tabs {
  width: 100%;
  background: var(--el-bg-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-sm) 28px 28px;
  box-sizing: border-box;
}
</style>
