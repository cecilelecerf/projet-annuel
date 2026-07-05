<script setup lang="ts">
import { Menu } from '@element-plus/icons-vue'
import { ref, computed, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const drawer = ref(false)

type LinkItem = {
  index: string
  label: string
}
export type MenuItem = LinkItem & {
  icon: Component | string
  children?: LinkItem[]
}
defineProps<{ menuItems: MenuItem[] }>()

const activeMenu = computed(() => route.name as string)

const handleMenuSelect = (index: string) => {
  const resolved = router.resolve({ name: index })
  if (resolved.matched.length === 0) {
    console.warn(`Sidebar: aucune route nommée "${index}" — fonctionnalité pas encore disponible`)
    return
  }
  router.push({ name: index })
}
</script>

<template>
  <aside>
    <el-drawer v-model="drawer" title="Menu" direction="ltr">
      <el-menu :default-active="activeMenu" @select="handleMenuSelect">
        <template v-for="item in menuItems" :key="item.index">
          <el-sub-menu v-if="item.children" :index="item.index">
            <template #title>
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.label }}</span>
            </template>
            <el-menu-item v-for="child in item.children" :key="child.index" :index="child.index">
              <span />
              {{ child.label }}
            </el-menu-item>
          </el-sub-menu>

          <el-menu-item v-else :index="item.index">
            <el-icon><component :is="item.icon" /></el-icon>
            <template #title>{{ item.label }}</template>
          </el-menu-item>
        </template>
      </el-menu></el-drawer
    >
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
  font-family: 'Nunito';
  font-weight: var(--fw-bold);
}
</style>
