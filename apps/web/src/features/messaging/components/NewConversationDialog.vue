<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useMessagingStore } from '../stores/messagingStore'
import { useNotify } from '@/composables/useNotify'
import type { ConversationScope, UserId } from '@armali/schemas'

const authStore = useAuthStore()
const messagingStore = useMessagingStore()
const notify = useNotify()

const visible = ref(false)
const activeTab = ref<'direct' | 'group'>('direct')
const loading = ref(false)

const groupScope = ref<ConversationScope>('CLINIC')
const groupName = ref('')
const selectedMemberIds = ref<UserId[]>([])

const isDirector = computed(() => authStore.user?.role === 'DIRECTOR')

const groupPool = computed(() =>
  groupScope.value === 'DIRECTOR_NETWORK'
    ? (messagingStore.contacts?.directors ?? [])
    : (messagingStore.contacts?.clinic ?? []),
)

async function open() {
  visible.value = true
  activeTab.value = 'direct'
  groupScope.value = 'CLINIC'
  groupName.value = ''
  selectedMemberIds.value = []
  await messagingStore.fetchContacts()
}

async function startDirect(userId: UserId) {
  loading.value = true
  try {
    await messagingStore.createConversation({ type: 'DIRECT', userId })
    visible.value = false
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de démarrer la discussion')
  } finally {
    loading.value = false
  }
}

async function submitGroup() {
  if (!groupName.value.trim() || selectedMemberIds.value.length < 2) return
  loading.value = true
  try {
    await messagingStore.createConversation({
      type: 'GROUP',
      scope: groupScope.value,
      name: groupName.value.trim(),
      memberIds: selectedMemberIds.value,
    })
    visible.value = false
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de créer le groupe')
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="visible" title="Nouvelle discussion" width="480px">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="Discussion privée" name="direct">
        <p
          v-if="
            (messagingStore.contacts?.clinic.length ?? 0) === 0 &&
            (messagingStore.contacts?.directors?.length ?? 0) === 0
          "
          class="empty"
        >
          Aucun contact disponible.
        </p>
        <div v-else class="contact-section">
          <h4 v-if="messagingStore.contacts?.clinic.length">Personnel de la clinique</h4>
          <button
            v-for="contact in messagingStore.contacts?.clinic ?? []"
            :key="contact.id"
            class="contact-row"
            :disabled="loading"
            @click="startDirect(contact.id)"
          >
            <el-avatar :size="32">{{ contact.firstname[0] }}{{ contact.lastname[0] }}</el-avatar>
            <span>{{ contact.firstname }} {{ contact.lastname }}</span>
          </button>

          <template v-if="messagingStore.contacts?.directors?.length">
            <h4>Autres directeurs</h4>
            <button
              v-for="contact in messagingStore.contacts?.directors ?? []"
              :key="contact.id"
              class="contact-row"
              :disabled="loading"
              @click="startDirect(contact.id)"
            >
              <el-avatar :size="32">{{ contact.firstname[0] }}{{ contact.lastname[0] }}</el-avatar>
              <span>{{ contact.firstname }} {{ contact.lastname }}</span>
            </button>
          </template>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Nouveau groupe" name="group">
        <el-radio-group v-if="isDirector" v-model="groupScope" class="scope-picker">
          <el-radio-button value="CLINIC">Mon équipe clinique</el-radio-button>
          <el-radio-button value="DIRECTOR_NETWORK">Réseau des directeurs</el-radio-button>
        </el-radio-group>

        <el-input v-model="groupName" placeholder="Nom du groupe" style="margin: 12px 0" />

        <p v-if="groupPool.length === 0" class="empty">Aucun contact disponible pour ce groupe.</p>
        <el-checkbox-group v-else v-model="selectedMemberIds">
          <el-checkbox
            v-for="contact in groupPool"
            :key="contact.id"
            :value="contact.id"
            class="member-checkbox"
          >
            {{ contact.firstname }} {{ contact.lastname }}
          </el-checkbox>
        </el-checkbox-group>

        <div class="group-footer">
          <el-button
            type="primary"
            :loading="loading"
            :disabled="!groupName.trim() || selectedMemberIds.length < 2"
            @click="submitGroup"
          >
            Créer le groupe
          </el-button>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<style scoped lang="scss">
.empty {
  color: var(--el-text-color-secondary);
  text-align: center;
  padding: var(--spacing-md) 0;
}
.contact-section h4 {
  margin: var(--spacing-md) 0 var(--spacing-xs);
  font-size: var(--fs-base);
  color: var(--el-text-color-secondary);
}
.contact-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: var(--spacing-sm);
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: var(--radius-sm);
  text-align: left;
}
.contact-row:hover {
  background: var(--el-fill-color-light);
}
.scope-picker {
  margin-bottom: var(--spacing-sm);
}
.member-checkbox {
  display: block;
  margin: var(--spacing-xs) 0;
}
.group-footer {
  margin-top: var(--spacing-md);
  text-align: right;
}
</style>
