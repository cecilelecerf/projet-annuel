<script setup lang="ts">
import { Menu } from '@element-plus/icons-vue'
import type { NavNode } from './NaveNode'
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RecursiveSideBarItem from './RecursiveSideBarItem.vue'

const route = useRoute()
const router = useRouter()

const drawer = ref(false)
const activeMenu = computed(() => route.name as string)
const props = defineProps<{ menuItems: NavNode[] }>()
function findNode(nodes: NavNode[], index: string): NavNode | undefined {
  for (const node of nodes) {
    if (node.index === index) return node
    if (node.children) {
      const found = findNode(node.children, index)
      if (found) return found
    }
  }
  return undefined
}

function handleMenuSelect(index: string) {
  const node = findNode(props.menuItems, index)
  router.push({ name: index, params: node?.params, query: node?.query })
}
</script>

<template>
  <aside>
    <el-drawer v-model="drawer" title="Menu" direction="ltr">
      <el-menu :default-active="activeMenu" @select="handleMenuSelect">
        <recursive-side-bar-item v-for="item in menuItems" :key="item.index" :item="item" />
      </el-menu>
    </el-drawer>
    <!-- Toggle collapse -->
    <el-button type="primary" :icon="Menu" circle @click="drawer = !drawer" />
  </aside>
</template>

<style scoped lang="scss">
:deep(.el-sub-menu__title),
:deep(.el-sub-menu),
:deep(.el-menu-item) {
  border-radius: var(--radius-full);
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-drawer__title) {
  font-weight: var(--fw-bold);
}
</style>
