<script setup lang="ts">
import type { CreatePet } from '@armali/schemas'

defineProps<{
  title: string
  submitLabel: string
  loading: boolean
}>()

const visible = defineModel<boolean>('visible', { required: true })
const form = defineModel<CreatePet>('form', { required: true })

const emit = defineEmits<{ submit: [] }>()
</script>

<template>
  <el-dialog v-model="visible" :title="title" width="440px" align-center>
    <el-form :model="form" label-position="top">
      <el-form-item label="Nom de l'espèce">
        <el-input v-model="form.name" placeholder="Ex. Chien, Chat..." />
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
