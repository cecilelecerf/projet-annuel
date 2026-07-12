<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { http } from '@/lib/api'
import { useNotify } from '@/composables/useNotify'

interface Speciality {
  id: string
  name: string
  description: string
}

const props = defineProps<{
  apiPrefix: 'director' | 'referent'
  linked: Speciality[]
}>()
const emit = defineEmits<{ change: [] }>()

const notify = useNotify()
const all = ref<Speciality[]>([])
const selected = ref<string>('')
const busy = ref(false)

const available = computed(() =>
  all.value.filter((s) => !props.linked.some((l) => l.id === s.id)),
)

async function loadAll() {
  try {
    all.value = await http.get('/specialities')
  } catch {
    /* silencieux */
  }
}

async function link() {
  if (!selected.value) return
  busy.value = true
  try {
    await http.post(`/${props.apiPrefix}/clinic/specialities/${selected.value}`, {})
    selected.value = ''
    emit('change')
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur')
  } finally {
    busy.value = false
  }
}

async function unlink(specialityId: string) {
  busy.value = true
  try {
    await http.delete(`/${props.apiPrefix}/clinic/specialities/${specialityId}`)
    emit('change')
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur')
  } finally {
    busy.value = false
  }
}

onMounted(loadAll)
</script>

<template>
  <div class="specialities">
    <div v-if="linked.length" class="tag-list">
      <el-tag
        v-for="s in linked"
        :key="s.id"
        closable
        :disable-transitions="true"
        @close="unlink(s.id)"
      >
        {{ s.name }}
      </el-tag>
    </div>
    <p v-else class="empty">Aucune spécialité associée</p>

    <div class="add-row">
      <el-select v-model="selected" placeholder="Ajouter une spécialité" filterable style="width: 260px">
        <el-option v-for="s in available" :key="s.id" :label="s.name" :value="s.id" />
      </el-select>
      <el-button :disabled="!selected" :loading="busy" @click="link">Ajouter</el-button>
    </div>
  </div>
</template>

<style scoped>
.specialities {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.empty {
  color: #9ca3af;
  font-size: 14px;
  margin: 0;
}
.add-row {
  display: flex;
  gap: 8px;
}
</style>
