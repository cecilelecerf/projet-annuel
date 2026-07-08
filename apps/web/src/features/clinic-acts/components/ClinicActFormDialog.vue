<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Act, ActType, CreateClinicAct } from '@armali/schemas'
import { ACT_TYPE_OPTIONS } from '@/features/acts/composables/useActForm'

const props = defineProps<{
  title: string
  submitLabel: string
  loading: boolean
  acts: Act[]
  linkedActIds: string[] // actIds déjà présents dans cette clinique
  editingActId?: string | null // acte actuellement édité, à ne pas exclure
}>()

const visible = defineModel<boolean>('visible', { required: true })
const form = defineModel<CreateClinicAct>('form', { required: true })

const emit = defineEmits<{ submit: [] }>()

// Filtre UI uniquement — n'existe pas dans le payload envoyé à l'API
const selectedType = ref<ActType | null>(null)

// Actes non encore liés à la clinique (sauf celui en cours d'édition)
const availableActs = computed(() =>
  props.acts.filter((a) => a.id === props.editingActId || !props.linkedActIds.includes(a.id)),
)

const actsForSelectedType = computed(() => {
  if (!selectedType.value) return []
  return availableActs.value.filter((a) => a.type === selectedType.value)
})

const selectedAct = computed(() => props.acts.find((a) => a.id === form.value.actId))

watch(visible, (isVisible) => {
  if (isVisible) {
    selectedType.value = form.value.actId
      ? (props.acts.find((a) => a.id === form.value.actId)?.type ?? null)
      : null
  }
})

function onTypeChange() {
  // Changer de type invalide le choix d'acte précédent
  form.value.actId = undefined as never
  form.value.price = 0
}

function onActChange() {
  // Préremplit avec le prix indicatif du catalogue, modifiable ensuite
  if (selectedAct.value && !form.value.price) {
    form.value.price = selectedAct.value.basePrice
  }
}
</script>

<template>
  <el-dialog v-model="visible" :title="title" width="480px" align-center>
    <el-form :model="form" label-position="top" class="clinic-act-form">
      <el-form-item label="Type d'acte">
        <el-select
          v-model="selectedType"
          placeholder="Sélectionner un type"
          style="width: 100%"
          @change="onTypeChange"
        >
          <el-option
            v-for="opt in ACT_TYPE_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Acte">
        <el-select
          v-model="form.actId"
          placeholder="Sélectionner un acte"
          filterable
          :disabled="!selectedType"
          style="width: 100%"
          @change="onActChange"
        >
          <el-option
            v-for="act in actsForSelectedType"
            :key="act.id"
            :label="act.name"
            :value="act.id"
          />
        </el-select>
        <span v-if="selectedType && actsForSelectedType.length === 0" class="indicative-price">
          Tous les actes de ce type sont déjà tarifés par la clinique.
        </span>
        <span v-if="selectedAct" class="indicative-price">
          Prix indicatif du catalogue : {{ selectedAct.basePrice.toFixed(2) }} €
        </span>
      </el-form-item>

      <el-form-item label="Prix pratiqué par la clinique (€)">
        <el-input-number
          v-model="form.price"
          :min="0"
          :step="0.01"
          :precision="2"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">Annuler</el-button>
      <el-button type="primary" :loading="loading" @click="emit('submit')">
        {{ submitLabel }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.clinic-act-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
.indicative-price {
  display: block;
  margin-top: var(--spacing-2xs);
  font-size: var(--fs-sm, 12px);
  color: var(--color-text-tertiary, #9ca3af);
}
</style>
