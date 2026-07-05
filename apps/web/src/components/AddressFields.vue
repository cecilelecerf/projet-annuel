<script setup lang="ts">
import type { ClinicAddress } from '@/utils/clinic.utils'

const model = defineModel<ClinicAddress>({ required: true })

withDefaults(defineProps<{ size?: 'default' | 'large' }>(), { size: 'default' })
</script>

<template>
  <el-form-item label="Rue">
    <el-input v-model="model.street" placeholder="12 rue de la Paix" :size="size" />
  </el-form-item>
  <div class="address-row">
    <el-form-item label="Code postal">
      <el-input v-model="model.postalCode" placeholder="75001" maxlength="5" :size="size" />
    </el-form-item>
    <el-form-item label="Ville">
      <el-input v-model="model.city" placeholder="Paris" :size="size" />
    </el-form-item>
    <el-form-item label="Pays">
      <el-input v-model="model.country" placeholder="FR" :size="size" />
    </el-form-item>
  </div>
</template>

<style scoped>
.address-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}
</style>
