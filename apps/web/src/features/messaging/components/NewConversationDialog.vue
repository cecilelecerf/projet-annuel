<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, ArrowLeft } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/authStore'
import { useMessagingStore } from '../stores/messagingStore'
import { useNotify } from '@/composables/useNotify'
import type {
  ConversationContact,
  ConversationScope,
  CreateConversation,
  UserId,
  UserRole,
} from '@armali/schemas'

const authStore = useAuthStore()
const messagingStore = useMessagingStore()
const notify = useNotify()

const visible = ref(false)
const activeTab = ref<'direct' | 'group'>('direct')
const loading = ref(false)

const isDirector = computed(() => authStore.user?.role === 'DIRECTOR')
const isVeterinarian = computed(() => authStore.user?.role === 'VETERINARIAN')

// ── Libellés rôle ─────────────────────────────────────────────────────────

const ROLE_LABELS: Partial<Record<UserRole, string>> = {
  SECRETARY: 'Secrétaire',
  REFERENT: 'Référent',
  DIRECTOR: 'Directeur',
  VETERINARIAN: 'Vétérinaire',
}

function contactSubtitle(contact: ConversationContact): string {
  const role = ROLE_LABELS[contact.role] ?? contact.role
  const clinics = contact.clinics?.map((c) => c.name).join(', ')
  return clinics ? `${role} · ${clinics}` : role
}

// ── Regroupement par clinique — un vétérinaire apparaît dans CHACUNE de ses
// cliniques (pas juste la première), puisqu'il en fait vraiment partie ────

interface ClinicGroup {
  clinicId: string
  clinicName: string
  contacts: ConversationContact[]
}

function groupByClinic(contacts: ConversationContact[]): ClinicGroup[] {
  const map = new Map<string, ClinicGroup>()
  for (const contact of contacts) {
    for (const clinic of contact.clinics ?? []) {
      if (!map.has(clinic.id)) {
        map.set(clinic.id, { clinicId: clinic.id, clinicName: clinic.name, contacts: [] })
      }
      map.get(clinic.id)!.contacts.push(contact)
    }
  }
  return [...map.values()]
}

const clinicGroups = computed(() => groupByClinic(messagingStore.contacts?.clinic ?? []))

// ── Entrée "réseau" : vétérinaires (multi-cliniques) pour un vétérinaire,
// directeurs pour un directeur — jamais les deux à la fois pour un même rôle
interface NetworkEntry {
  label: string
  pool: ConversationContact[]
  scope: Extract<ConversationScope, 'VETERINARIAN_NETWORK' | 'DIRECTOR_NETWORK'>
}

const allVeterinarians = computed(() =>
  (messagingStore.contacts?.clinic ?? []).filter((c) => c.role === 'VETERINARIAN'),
)
const directorsPool = computed(() => messagingStore.contacts?.directors ?? [])

const networkEntry = computed<NetworkEntry | null>(() => {
  if (isVeterinarian.value && allVeterinarians.value.length > 0) {
    return { label: 'Vétérinaires', pool: allVeterinarians.value, scope: 'VETERINARIAN_NETWORK' }
  }
  if (isDirector.value && directorsPool.value.length > 0) {
    return { label: 'Directeurs', pool: directorsPool.value, scope: 'DIRECTOR_NETWORK' }
  }
  return null
})

// Une seule clinique et aucun réseau (secrétaire, référent) → pas d'écran de
// liste intermédiaire, on va directement au détail
const hasSingleEntry = computed(
  () => clinicGroups.value.length === 1 && !networkEntry.value,
)

// ── Navigation par clic (commune aux deux onglets) ──────────────────────────

type View = 'list' | 'clinic' | 'network'

const directView = ref<View>('list')
const selectedDirectClinic = ref<ClinicGroup | null>(null)

const groupView = ref<View>('list')
const selectedGroupClinic = ref<ClinicGroup | null>(null)
const groupName = ref('')
const selectedMemberIds = ref<UserId[]>([])

function resetDirectNav() {
  directView.value = hasSingleEntry.value ? 'clinic' : 'list'
  selectedDirectClinic.value = hasSingleEntry.value ? clinicGroups.value[0] : null
}

function resetGroupNav() {
  groupView.value = hasSingleEntry.value ? 'clinic' : 'list'
  selectedGroupClinic.value = hasSingleEntry.value ? clinicGroups.value[0] : null
  groupName.value = ''
  selectedMemberIds.value = []
}

const hasAnyDirectContact = computed(
  () => clinicGroups.value.length > 0 || !!networkEntry.value,
)

// ── Discussion privée ────────────────────────────────────────────────────

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

// ── Nouveau groupe ────────────────────────────────────────────────────────

async function submitGroup() {
  if (!groupName.value.trim() || selectedMemberIds.value.length < 2) return

  let payload: CreateConversation
  if (groupView.value === 'network' && networkEntry.value) {
    payload = {
      type: 'GROUP',
      scope: networkEntry.value.scope,
      name: groupName.value.trim(),
      memberIds: selectedMemberIds.value,
    }
  } else if (groupView.value === 'clinic' && selectedGroupClinic.value) {
    payload = {
      type: 'GROUP',
      scope: 'CLINIC',
      clinicId: selectedGroupClinic.value.clinicId,
      name: groupName.value.trim(),
      memberIds: selectedMemberIds.value,
    }
  } else {
    return
  }

  loading.value = true
  try {
    await messagingStore.createConversation(payload)
    visible.value = false
  } catch (err: unknown) {
    notify.error(err instanceof Error ? err.message : 'Impossible de créer le groupe')
  } finally {
    loading.value = false
  }
}

async function open() {
  visible.value = true
  activeTab.value = 'direct'
  loading.value = false
  await messagingStore.fetchContacts()
  resetDirectNav()
  resetGroupNav()
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="visible" title="Nouvelle discussion" width="480px">
    <el-tabs v-model="activeTab">
      <!-- ── Discussion privée ─────────────────────────────────────────── -->
      <el-tab-pane label="Discussion privée" name="direct">
        <p v-if="!hasAnyDirectContact" class="empty">Aucun contact disponible.</p>

        <template v-else>
          <div v-if="directView === 'list'" class="nav-list">
            <button
              v-for="group in clinicGroups"
              :key="group.clinicId"
              class="nav-row"
              @click="selectedDirectClinic = group; directView = 'clinic'"
            >
              <span>{{ group.clinicName }}</span>
              <el-icon><ArrowRight /></el-icon>
            </button>
            <button v-if="networkEntry" class="nav-row" @click="directView = 'network'">
              <span>{{ networkEntry.label }}</span>
              <el-icon><ArrowRight /></el-icon>
            </button>
          </div>

          <div v-else-if="directView === 'clinic' && selectedDirectClinic">
            <button v-if="!hasSingleEntry" class="back-row" @click="directView = 'list'">
              <el-icon><ArrowLeft /></el-icon>
              <span>{{ selectedDirectClinic.clinicName }}</span>
            </button>
            <button
              v-for="contact in selectedDirectClinic.contacts"
              :key="contact.id"
              class="contact-row"
              :disabled="loading"
              @click="startDirect(contact.id)"
            >
              <el-avatar :size="32">{{ contact.firstname[0] }}{{ contact.lastname[0] }}</el-avatar>
              <div class="contact-info">
                <span class="contact-name">{{ contact.firstname }} {{ contact.lastname }}</span>
                <span class="contact-subtitle">{{ contactSubtitle(contact) }}</span>
              </div>
            </button>
          </div>

          <div v-else-if="directView === 'network' && networkEntry">
            <button class="back-row" @click="directView = 'list'">
              <el-icon><ArrowLeft /></el-icon>
              <span>{{ networkEntry.label }}</span>
            </button>
            <button
              v-for="contact in networkEntry.pool"
              :key="contact.id"
              class="contact-row"
              :disabled="loading"
              @click="startDirect(contact.id)"
            >
              <el-avatar :size="32">{{ contact.firstname[0] }}{{ contact.lastname[0] }}</el-avatar>
              <div class="contact-info">
                <span class="contact-name">{{ contact.firstname }} {{ contact.lastname }}</span>
                <span class="contact-subtitle">{{ contactSubtitle(contact) }}</span>
              </div>
            </button>
          </div>
        </template>
      </el-tab-pane>

      <!-- ── Nouveau groupe ─────────────────────────────────────────────── -->
      <el-tab-pane label="Nouveau groupe" name="group">
        <p v-if="clinicGroups.length === 0 && !networkEntry" class="empty">
          Aucun contact disponible pour créer un groupe.
        </p>

        <template v-else>
          <div v-if="groupView === 'list'" class="nav-list">
            <button
              v-for="group in clinicGroups"
              :key="group.clinicId"
              class="nav-row"
              @click="selectedGroupClinic = group; groupView = 'clinic'; groupName = ''; selectedMemberIds = []"
            >
              <span>{{ group.clinicName }}</span>
              <el-icon><ArrowRight /></el-icon>
            </button>
            <button
              v-if="networkEntry"
              class="nav-row"
              @click="groupView = 'network'; groupName = ''; selectedMemberIds = []"
            >
              <span>{{ networkEntry.label }}</span>
              <el-icon><ArrowRight /></el-icon>
            </button>
          </div>

          <div v-else-if="groupView === 'clinic' && selectedGroupClinic">
            <button v-if="!hasSingleEntry" class="back-row" @click="groupView = 'list'">
              <el-icon><ArrowLeft /></el-icon>
              <span>{{ selectedGroupClinic.clinicName }}</span>
            </button>
            <el-input v-model="groupName" placeholder="Nom du groupe" style="margin: 12px 0" />
            <el-checkbox-group v-model="selectedMemberIds" class="member-list">
              <el-checkbox
                v-for="contact in selectedGroupClinic.contacts"
                :key="contact.id"
                :value="contact.id"
                class="member-checkbox"
              >
                <div class="contact-info">
                  <span class="contact-name">{{ contact.firstname }} {{ contact.lastname }}</span>
                  <span class="contact-subtitle">{{ contactSubtitle(contact) }}</span>
                </div>
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
          </div>

          <div v-else-if="groupView === 'network' && networkEntry">
            <button class="back-row" @click="groupView = 'list'">
              <el-icon><ArrowLeft /></el-icon>
              <span>{{ networkEntry.label }}</span>
            </button>
            <el-input v-model="groupName" placeholder="Nom du groupe" style="margin: 12px 0" />
            <el-checkbox-group v-model="selectedMemberIds" class="member-list">
              <el-checkbox
                v-for="contact in networkEntry.pool"
                :key="contact.id"
                :value="contact.id"
                class="member-checkbox"
              >
                <div class="contact-info">
                  <span class="contact-name">{{ contact.firstname }} {{ contact.lastname }}</span>
                  <span class="contact-subtitle">{{ contactSubtitle(contact) }}</span>
                </div>
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
          </div>
        </template>
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
:deep(.el-tabs__item) {
  line-height: normal;
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
.contact-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}
.contact-name {
  font-size: 14px;
  color: var(--el-text-color-primary);
}
.contact-subtitle {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: normal;
  word-break: break-word;
  overflow-wrap: break-word;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
.nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  background: var(--el-fill-color-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  font-weight: var(--fw-medium);
  color: var(--el-text-color-primary);
  transition: background 0.15s;
}
.nav-row:hover {
  background: var(--el-fill-color);
}
.back-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  border: none;
  background: transparent;
  cursor: pointer;
  padding: var(--spacing-xs) 0;
  margin-bottom: var(--spacing-sm);
  font-size: 14px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}
.back-row:hover {
  color: var(--el-color-primary);
}

.member-list {
  display: flex;
  flex-direction: column;
  max-height: 320px;
  overflow-y: auto;
}
.member-checkbox {
  height: auto;
  display: flex;
  align-items: flex-start;
  width: 100%;
  margin: var(--spacing-xs) 0;

  :deep(.el-checkbox__label) {
    width: 100%;
    min-width: 0;
    white-space: normal;
    word-break: break-word;
    overflow-wrap: break-word;
  }
  :deep(.el-checkbox__input) {
    margin-top: 2px;
  }
}
.group-footer {
  margin-top: var(--spacing-md);
  text-align: right;
}
</style>