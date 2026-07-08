<script setup lang="ts">
import type { CreateAct } from '@armali/schemas'
import { ACT_TYPE_OPTIONS } from '../composables/useActForm'

defineProps<{
  title: string
  submitLabel: string
  loading: boolean
}>()

const visible = defineModel<boolean>('visible', { required: true })
const form = defineModel<CreateAct>('form', { required: true })

const emit = defineEmits<{
  submit: []
}>()
</script>

<template>
  <el-dialog v-model="visible" :title="title" width="480px" align-center>
    <el-form :model="form" label-position="top" class="act-form">
      <el-form-item label="Nom">
        <el-input v-model="form.name" placeholder="Ex. Consultation générale" />
      </el-form-item>

      <el-form-item label="Type">
        <el-select v-model="form.type" placeholder="Sélectionner un type" style="width: 100%">
          <el-option
            v-for="opt in ACT_TYPE_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Prix de base (€)">
        <el-input-number
          v-model="form.basePrice"
          :min="0"
          :step="0.01"
          :precision="2"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="Description">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="Optionnel" />
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
.act-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
</style>
