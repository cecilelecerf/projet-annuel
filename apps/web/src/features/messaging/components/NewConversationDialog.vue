<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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

// ── Regroupement par clinique + vétérinaires à part ──────────────────────────

interface ClinicGroup {
  clinicId: string
  clinicName: string
  contacts: ConversationContact[]
}

function groupByClinic(contacts: ConversationContact[]): {
  clinicGroups: ClinicGroup[]
  veterinarians: ConversationContact[]
} {
  const veterinarians = contacts.filter((c) => c.role === 'VETERINARIAN')
  const staff = contacts.filter((c) => c.role !== 'VETERINARIAN')

  const map = new Map<string, ClinicGroup>()
  for (const contact of staff) {
    const clinic = contact.clinics?.[0]
    if (!clinic) continue
    if (!map.has(clinic.id)) {
      map.set(clinic.id, { clinicId: clinic.id, clinicName: clinic.name, contacts: [] })
    }
    map.get(clinic.id)!.contacts.push(contact)
  }

  return { clinicGroups: [...map.values()], veterinarians }
}

const directGrouped = computed(() => groupByClinic(messagingStore.contacts?.clinic ?? []))
const groupGrouped = computed(() => groupByClinic(messagingStore.contacts?.clinic ?? []))
const directorsPool = computed(() => messagingStore.contacts?.directors ?? [])

// Navigation par clic (remplace l'accordéon) : liste des cliniques → détail
type DirectView = 'list' | 'clinic' | 'veterinarians'
const directView = ref<DirectView>('list')
const selectedDirectClinic = ref<ClinicGroup | null>(null)

function openDirectClinic(group: ClinicGroup) {
  selectedDirectClinic.value = group
  directView.value = 'clinic'
}

function openDirectVeterinarians() {
  directView.value = 'veterinarians'
}

function backToDirectList() {
  directView.value = 'list'
  selectedDirectClinic.value = null
}

// ── Onglet "Discussion privée" ───────────────────────────────────────────────

const hasAnyDirectContact = computed(
  () =>
    directGrouped.value.clinicGroups.length > 0 ||
    directGrouped.value.veterinarians.length > 0 ||
    directorsPool.value.length > 0,
)

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

// ── Onglet "Nouveau groupe" ───────────────────────────────────────────────────

const groupScope = ref<ConversationScope>('CLINIC')
const groupName = ref('')
const selectedMemberIds = ref<UserId[]>([])

// Navigation par clic : liste des cliniques → détail d'une clinique choisie
// (ou des vétérinaires, tous établissements confondus)
type GroupView = 'list' | 'clinic' | 'veterinarians'
const groupView = ref<GroupView>('list')
const selectedClinic = ref<ClinicGroup | null>(null)

function resetGroupSelection() {
  groupView.value = 'list'
  selectedClinic.value = null
  groupName.value = ''
  selectedMemberIds.value = []
}

function openClinic(group: ClinicGroup) {
  selectedClinic.value = group
  groupView.value = 'clinic'
  groupName.value = ''
  selectedMemberIds.value = []
}

function openVeterinarians() {
  groupView.value = 'veterinarians'
  groupName.value = ''
  selectedMemberIds.value = []
}

function backToList() {
  groupView.value = 'list'
  selectedClinic.value = null
  groupName.value = ''
  selectedMemberIds.value = []
}

// Réinitialise la navigation quand on bascule "Mon équipe" / "Réseau des directeurs"
watch(groupScope, () => resetGroupSelection())

async function submitGroup() {
  if (!groupName.value.trim() || selectedMemberIds.value.length < 2) return

  let payload: CreateConversation
  if (groupView.value === 'veterinarians') {
    payload = {
      type: 'GROUP',
      scope: 'VETERINARIAN_NETWORK',
      name: groupName.value.trim(),
      memberIds: selectedMemberIds.value,
    }
  } else if (groupScope.value === 'DIRECTOR_NETWORK') {
    payload = {
      type: 'GROUP',
      scope: 'DIRECTOR_NETWORK',
      name: groupName.value.trim(),
      memberIds: selectedMemberIds.value,
    }
  } else {
    if (!selectedClinic.value) return
    payload = {
      type: 'GROUP',
      scope: 'CLINIC',
      clinicId: selectedClinic.value.clinicId,
      name: groupName.value.trim(),
      memberIds: selectedMemberIds.value,
    }
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
  groupScope.value = 'CLINIC'
  resetGroupSelection()
  directView.value = 'list'
  selectedDirectClinic.value = null
  await messagingStore.fetchContacts()
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
          <!-- Vue liste : cliniques + vétérinaires -->
          <div v-if="directView === 'list'" class="contact-section">
            <div class="nav-list">
              <button
                v-for="group in directGrouped.clinicGroups"
                :key="group.clinicId"
                class="nav-row"
                @click="openDirectClinic(group)"
              >
                <span>{{ group.clinicName }}</span>
                <el-icon><ArrowRight /></el-icon>
              </button>
              <button
                v-if="directGrouped.veterinarians.length"
                class="nav-row"
                @click="openDirectVeterinarians"
              >
                <span>Vétérinaires</span>
                <el-icon><ArrowRight /></el-icon>
              </button>
            </div>

            <template v-if="directorsPool.length">
              <h4>Autres directeurs</h4>
              <button
                v-for="contact in directorsPool"
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
            </template>
          </div>

          <!-- Vue détail d'une clinique -->
          <div v-else-if="directView === 'clinic' && selectedDirectClinic">
            <button class="back-row" @click="backToDirectList">
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

          <!-- Vue vétérinaires (multi-cliniques) -->
          <div v-else-if="directView === 'veterinarians'">
            <button class="back-row" @click="backToDirectList">
              <el-icon><ArrowLeft /></el-icon>
              <span>Vétérinaires</span>
            </button>
            <button
              v-for="contact in directGrouped.veterinarians"
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
        <el-radio-group v-if="isDirector" v-model="groupScope" class="scope-picker">
          <el-radio-button value="CLINIC">Mon équipe clinique</el-radio-button>
          <el-radio-button value="DIRECTOR_NETWORK">Réseau des directeurs</el-radio-button>
        </el-radio-group>

        <!-- ── Scope DIRECTOR_NETWORK : liste plate, inchangé ─────────────── -->
        <template v-if="groupScope === 'DIRECTOR_NETWORK'">
          <el-input v-model="groupName" placeholder="Nom du groupe" style="margin: 12px 0" />
          <p v-if="directorsPool.length === 0" class="empty">Aucun contact disponible pour ce groupe.</p>
          <el-checkbox-group v-else v-model="selectedMemberIds" class="member-list">
            <el-checkbox
              v-for="contact in directorsPool"
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
        </template>

        <!-- ── Scope CLINIC : navigation par clic ─────────────────────────── -->
        <template v-else>
          <div v-if="groupView === 'list'" class="nav-list">
            <p
              v-if="groupGrouped.clinicGroups.length === 0 && !isVeterinarian"
              class="empty"
            >
              Aucune clinique disponible.
            </p>
            <button
              v-for="group in groupGrouped.clinicGroups"
              :key="group.clinicId"
              class="nav-row"
              @click="openClinic(group)"
            >
              <span>{{ group.clinicName }}</span>
              <el-icon><ArrowRight /></el-icon>
            </button>
            <button
              v-if="isVeterinarian && groupGrouped.veterinarians.length"
              class="nav-row"
              @click="openVeterinarians"
            >
              <span>Vétérinaires</span>
              <el-icon><ArrowRight /></el-icon>
            </button>
          </div>

          <div v-else-if="groupView === 'clinic' && selectedClinic">
            <button class="back-row" @click="backToList">
              <el-icon><ArrowLeft /></el-icon>
              <span>{{ selectedClinic.clinicName }}</span>
            </button>
            <el-input v-model="groupName" placeholder="Nom du groupe" style="margin: 12px 0" />
            <el-checkbox-group v-model="selectedMemberIds" class="member-list">
              <el-checkbox
                v-for="contact in selectedClinic.contacts"
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

          <div v-else-if="groupView === 'veterinarians'">
            <button class="back-row" @click="backToList">
              <el-icon><ArrowLeft /></el-icon>
              <span>Vétérinaires</span>
            </button>
            <el-input v-model="groupName" placeholder="Nom du groupe" style="margin: 12px 0" />
            <el-checkbox-group v-model="selectedMemberIds" class="member-list">
              <el-checkbox
                v-for="contact in groupGrouped.veterinarians"
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
.scope-picker {
  margin-bottom: var(--spacing-md);
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