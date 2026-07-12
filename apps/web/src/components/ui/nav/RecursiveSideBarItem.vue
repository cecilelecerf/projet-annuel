<script setup lang="ts">
import type { NavNode } from './NaveNode.ts'
import RecursiveSideBarItem from './RecursiveSideBarItem.vue'

defineProps<{ item: NavNode }>()
</script>

<template>
  <el-sub-menu v-if="item.children" :index="item.index">
    <template #title>
      <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
      <span>{{ item.label }}</span>
    </template>

    <RecursiveSideBarItem v-for="child in item.children" :key="child.index" :item="child" />
  </el-sub-menu>

  <el-menu-item v-else :index="item.index">
    <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
    <template #title>{{ item.label }}</template>
  </el-menu-item>
</template>
