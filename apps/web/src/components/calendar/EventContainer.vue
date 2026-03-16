<script setup lang="ts">
import type { Meeting } from '@armali/schemas'

const { metting } = defineProps<{
  metting: Meeting
}>()
</script>
<template>
  <div v-if="metting.kind === 'ANIMAL'" class="root animal">
    <el-row class="header">
      <p>Chirurgie</p>
      <p>
        {{ metting.startTime?.getHours() }}h{{ metting.startTime?.getMinutes() }}-{{
          metting.endTime?.getHours()
        }}h{{ metting.endTime?.getMinutes() }}
      </p>
    </el-row>
    <p>{{ metting.ownedPetId }}</p>
    <p>{{ metting.veterinarianId }}</p>
  </div>
  <div v-else-if="metting.kind === 'INTERNAL'" class="root internal">
    <el-row class="header">
      <p>Réunion</p>
      <p>
        {{ metting.startTime?.getHours() }}h{{ metting.startTime?.getMinutes() }}-{{
          metting.endTime?.getHours()
        }}h{{ metting.endTime?.getMinutes() }}
      </p>
    </el-row>
    <p>{{ metting.title }}</p>
  </div>
</template>

<style lang="scss" scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.root {
  border: 1px solid black;
  .internal {
    background: var(--el-color-pink);
    border-color: var(--el-color-pink);
  }
  .animal {
    background: var(--el-color-teal);
    border-color: var(--el-color-teal);
  }
}
</style>
