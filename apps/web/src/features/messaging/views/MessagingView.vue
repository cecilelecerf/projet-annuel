<script setup lang="ts">
import { ref } from 'vue'
import ConversationList from '../components/ConversationList.vue'
import ConversationView from '../components/ConversationView.vue'
import NewConversationDialog from '../components/NewConversationDialog.vue'

const newDialog = ref<InstanceType<typeof NewConversationDialog> | null>(null)

// La connexion WebSocket et le chargement des conversations sont gérés
// globalement dans App.vue dès l'authentification, pour permettre les
// notifications même en dehors de cette page.
</script>

<template>
  <div class="messaging-view">
    <ConversationList @new="newDialog?.open()" />
    <ConversationView />
    <NewConversationDialog ref="newDialog" />
  </div>
</template>

<style scoped lang="scss">
.messaging-view {
  display: grid;
  grid-template-columns: 320px 1fr;
  height: calc(100vh - 160px);
  min-height: 480px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-md);
  overflow: hidden;
}

@media (max-width: 768px) {
  .messaging-view {
    grid-template-columns: 1fr;
  }
}
</style>
