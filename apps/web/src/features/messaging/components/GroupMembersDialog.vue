<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useMessagingStore } from '../stores/messagingStore'
import { useNotify } from '@/composables/useNotify'
import type { ConversationContact, UserId } from '@armali/schemas'
import type { ConversationMember } from '@armali/schemas'

const authStore = useAuthStore()
const messagingStore = useMessagingStore()
const notify = useNotify()

const visible = ref(false)
const newName = ref('')
const selectedNewMemberIds = ref<UserId[]>([])
const loading = ref(false)

const conversation = computed(() => messagingStore.activeConversation)

const selfMember = computed(() =>
  conversation.value?.conversationMembers?.find(
    (m: ConversationMember) => m.userId === authStore.user?.id,
  ),
)
const isAdmin = computed(() => selfMember.value?.role === 'ADMIN')
 
const eligibleContacts = computed(() => {
  if (!conversation.value) return []
  const pool =
    conversation.value.scope === 'DIRECTOR_NETWORK'
      ? (messagingStore.contacts?.directors ?? [])
      : (messagingStore.contacts?.clinic ?? [])
  const memberIds = new Set(
    conversation.value.conversationMembers?.map((m: ConversationMember) => m.userId) ?? [],
  )
  return pool.filter((c: ConversationContact) => !memberIds.has(c.id))
})

async function open() {
  visible.value = true
  newName.value = conversation.value?.name ?? ''
  selectedNewMemberIds.value = []
  if (!messagingStore.contacts) {
    await messagingStore.fetchContacts()
  }
}

watch(
  () => conversation.value?.id,
  () => {
    newName.value = conversation.value?.name ?? ''
  },
)

async function submitRename() {
  if (!conversation.value || !newName.value.trim()) return
  loading.value = true
  try {
    await messagingStore.rename(conversation.value.id, newName.value.trim())
    notify.success('Groupe renommé')
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur')
  } finally {
    loading.value = false
  }
}

async function submitAddMembers() {
  if (!conversation.value || selectedNewMemberIds.value.length === 0) return
  loading.value = true
  try {
    await messagingStore.addMembers(conversation.value.id, selectedNewMemberIds.value)
    selectedNewMemberIds.value = []
    notify.success('Membre(s) ajouté(s)')
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur')
  } finally {
    loading.value = false
  }
}

async function handleRemove(userId: UserId) {
  if (!conversation.value) return
  try {
    await messagingStore.removeMember(conversation.value.id, userId)
    notify.success('Membre retiré')
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur')
  }
}

async function handleLeave() {
  if (!conversation.value || !authStore.user) return
  try {
    await messagingStore.removeMember(conversation.value.id, authStore.user.id as UserId)
    visible.value = false
    notify.success('Vous avez quitté le groupe')
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur')
  }
}

async function handleToggleAdmin(userId: UserId, currentRole: 'ADMIN' | 'MEMBER') {
  if (!conversation.value) return
  try {
    await messagingStore.updateMemberRole(
      conversation.value.id,
      userId,
      currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN',
    )
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Erreur')
  }
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="visible" title="Gérer le groupe" width="480px">
    <template v-if="conversation">
      <section v-if="isAdmin" class="section">
        <h4>Nom du groupe</h4>
        <div class="inline-form">
          <el-input v-model="newName" maxlength="255" />
          <el-button type="primary" :loading="loading" @click="submitRename">Renommer</el-button>
        </div>
      </section>

      <section class="section">
        <h4>Membres ({{ conversation.conversationMembers?.length ?? 0 }})</h4>
        <ul class="member-list">
          <li v-for="member in conversation.conversationMembers" :key="member.id">
            <span>
              {{ member.user?.firstname }} {{ member.user?.lastname }}
              <el-tag v-if="member.role === 'ADMIN'" size="small" type="warning">Admin</el-tag>
            </span>
            <div
              class="member-list__actions"
              v-if="isAdmin && member.userId !== authStore.user?.id"
            >
              <el-button size="small" text @click="handleToggleAdmin(member.userId, member.role)">
                {{ member.role === 'ADMIN' ? 'Rétrograder' : 'Promouvoir admin' }}
              </el-button>
              <el-button size="small" text type="danger" @click="handleRemove(member.userId)">
                Retirer
              </el-button>
            </div>
          </li>
        </ul>
        <el-button size="small" @click="handleLeave">Quitter le groupe</el-button>
      </section>

      <section v-if="isAdmin && eligibleContacts.length > 0" class="section">
        <h4>Ajouter des membres</h4>
        <el-checkbox-group v-model="selectedNewMemberIds">
          <el-checkbox
            v-for="contact in eligibleContacts"
            :key="contact.id"
            :value="contact.id"
            class="member-checkbox"
          >
            {{ contact.firstname }} {{ contact.lastname }}
          </el-checkbox>
        </el-checkbox-group>
        <div>
          <el-button
            type="primary"
            :disabled="selectedNewMemberIds.length === 0"
            :loading="loading"
            @click="submitAddMembers"
          >
            Ajouter
          </el-button>
        </div>
      </section>
    </template>

    <template #footer>
      <el-button @click="visible = false">Fermer</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.section {
  margin-bottom: var(--spacing-lg);
}
.section h4 {
  margin: 0 0 var(--spacing-sm);
}
.inline-form {
  display: flex;
  gap: var(--spacing-sm);
}
.member-list {
  list-style: none;
  margin: 0 0 var(--spacing-md);
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.member-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.member-list__actions {
  display: flex;
  gap: var(--spacing-xs);
}
.member-checkbox {
  display: block;
}
</style>
