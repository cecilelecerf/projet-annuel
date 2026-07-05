<script lang="ts" setup>
import { computed, ref } from 'vue'
import { http } from '@/lib/api'
import { veterinarianSchema } from '@armali/schemas'
import { useRouter } from 'vue-router'
import z from 'zod'

const router = useRouter()
const veterinarians = await http
  .get('/users/roles/veterinarian')
  .then((data) => z.array(veterinarianSchema).parse(data))

const search = ref('')
const specialityFilter = ref('')

const specialities = computed(() => {
  const byId = new Map<string, string>()
  for (const veto of veterinarians) {
    for (const s of veto.veterinarianProfile?.speciality ?? []) {
      byId.set(s.id, s.name)
    }
  }
  return Array.from(byId, ([id, name]) => ({ id, name }))
})

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return veterinarians.filter((veto) => {
    const matchesSearch =
      !term ||
      `${veto.firstname} ${veto.lastname}`.toLowerCase().includes(term) ||
      veto.email.toLowerCase().includes(term)
    const matchesSpeciality =
      !specialityFilter.value ||
      (veto.veterinarianProfile?.speciality ?? []).some((s) => s.id === specialityFilter.value)
    return matchesSearch && matchesSpeciality
  })
})
</script>

<template>
  <div class="vet-list-page">
    <div class="filters">
      <el-input
        v-model="search"
        placeholder="Rechercher un vétérinaire..."
        clearable
        style="width: 260px"
      />
      <el-select
        v-model="specialityFilter"
        placeholder="Toutes les spécialités"
        clearable
        filterable
        style="width: 220px"
      >
        <el-option v-for="s in specialities" :key="s.id" :label="s.name" :value="s.id" />
      </el-select>
    </div>

    <div v-if="filtered.length === 0" class="empty">Aucun vétérinaire ne correspond aux filtres.</div>

    <div v-else class="vet-list">
      <div
        v-for="veto in filtered"
        :key="veto.id"
        class="vet-item"
        @click="router.push({ name: 'Secretary.Veto.Calendar', params: { id: veto.id } })"
      >
        <div class="vet-avatar">{{ veto.firstname[0] }}{{ veto.lastname[0] }}</div>
        <div class="vet-info">
          <div class="vet-name">{{ veto.firstname }} {{ veto.lastname }}</div>
          <div class="vet-license">{{ veto.veterinarianProfile?.licenseNumber }}</div>
        </div>
        <div class="vet-specialities">
          <el-tag v-for="s in veto.veterinarianProfile?.speciality ?? []" :key="s.id" size="small">
            {{ s.name }}
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vet-list-page {
  padding: 24px;
}
.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}
.empty {
  color: #9ca3af;
  font-size: 14px;
  padding: 24px 0;
  text-align: center;
}
.vet-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 8px 20px;
}
.vet-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
}
.vet-item:last-child {
  border-bottom: none;
}
.vet-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e0e7ff;
  color: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}
.vet-info {
  flex: 1;
}
.vet-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}
.vet-license {
  font-size: 12px;
  color: #9ca3af;
}
.vet-specialities {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  max-width: 240px;
  justify-content: flex-end;
}
</style>
