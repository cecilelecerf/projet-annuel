<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { CreateVaccine, Pet } from '@armali/schemas'
import VaccineCountryRulesEditor from './VaccineCountryRulesEditor.vue'
import { petApi } from '@/features/pets/api.ts'

defineProps<{
  title: string
  submitLabel: string
  loading: boolean
}>()

const visible = defineModel<boolean>('visible', { required: true })
const form = defineModel<CreateVaccine>('form', { required: true })

const emit = defineEmits<{
  submit: []
  addRule: []
  removeRule: [index: number]
}>()

const pets = ref<Pet[]>([])

async function loadPets() {
  pets.value = await petApi.getAll()
}

onMounted(loadPets)
</script>

<template>
  <el-dialog v-model="visible" :title="title" width="560px" align-center>
    <el-form :model="form" label-position="top" class="vaccine-form">
      <el-form-item label="Nom du vaccin">
        <el-input v-model="form.name" placeholder="Ex. Rage, CHPPi..." />
      </el-form-item>

      <el-form-item label="Espèce">
        <el-select v-model="form.petId" placeholder="Sélectionner une espèce" style="width: 100%">
          <el-option v-for="pet in pets" :key="pet.id" :label="pet.name" :value="pet.id" />
        </el-select>
      </el-form-item>

      <div class="form-row">
        <el-form-item label="Âge recommandé (sem.)">
          <el-input-number v-model="form.recommendedAge" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Intervalle de rappel (sem.)">
          <el-input-number v-model="form.boosterInterval" :min="0" style="width: 100%" />
        </el-form-item>
      </div>

      <el-form-item label="Prix de base de l'acte (€)">
        <el-input-number
          v-model="form.basePrice"
          :min="0"
          :step="0.01"
          :precision="2"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="Description">
        <el-input v-model="form.description" type="textarea" :rows="2" placeholder="Optionnel" />
      </el-form-item>

      <el-form-item>
        <VaccineCountryRulesEditor
          :rules="form.countryRules"
          @add="emit('addRule')"
          @remove="emit('removeRule', $event)"
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

<style lang="scss" scoped>
.vaccine-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}
</style>
