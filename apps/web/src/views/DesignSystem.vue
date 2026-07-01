<script setup lang="ts">
import { Check, Delete, Edit, Message, Plus, Search, Star } from '@element-plus/icons-vue'

// Couleurs Element Plus natives (surchargées) + custom
const colors = [
  {
    name: 'primary',
    label: 'Primary',
    custom: false,
    base: '#3c78ad',
    dark2: '#30608a',
    light3: '#76a0c5',
    light5: '#9dbbd6',
    light7: '#c4d6e6',
    light8: '#d8e4ee',
    light9: '#ebf1f6',
    usage: 'Actions principales, liens, focus',
    varPrefix: '--el-color-primary',
  },
  {
    name: 'success',
    label: 'Success',
    custom: false,
    base: '#4d884e',
    dark2: '#3d6c3e',
    light3: '#82ab83',
    light5: '#a6c3a6',
    light7: '#c9dbc9',
    light8: '#dbe7db',
    light9: '#edf3ed',
    usage: 'Confirmations, statuts positifs',
    varPrefix: '--el-color-success',
  },
  {
    name: 'danger',
    label: 'Danger',
    custom: false,
    base: '#ac5050',
    dark2: '#894040',
    light3: '#c48484',
    light5: '#d5a7a7',
    light7: '#e6caca',
    light8: '#eedcdc',
    light9: '#f6eded',
    usage: 'Erreurs, suppressions, alertes critiques',
    varPrefix: '--el-color-danger',
  },
  {
    name: 'warning',
    label: 'Warning',
    custom: false,
    base: '#e6a23c',
    dark2: '#b88130',
    light3: '#edbd76',
    light5: '#f2d09d',
    light7: '#f7e3c4',
    light8: '#faecd8',
    light9: '#fcf5eb',
    usage: 'Alertes non bloquantes, en attente',
    varPrefix: '--el-color-warning',
  },
  {
    name: 'purple',
    label: 'Purple',
    custom: true,
    base: '#9f6de0',
    dark2: '#7f57b3',
    light3: '#bb98e9',
    light5: '#cfb6ef',
    light7: '#e2d3f5',
    light8: '#ebe1f8',
    light9: '#f5f0fb',
    usage: 'Réunions internes, rôle référant',
    varPrefix: '--el-color-purple',
  },
  {
    name: 'pink',
    label: 'Pink',
    custom: true,
    base: '#e06d84',
    dark2: '#b35769',
    light3: '#e998a8',
    light5: '#efb6c1',
    light7: '#f5d3da',
    light8: '#f8e1e6',
    light9: '#fbf0f2',
    usage: 'Rôle client, tags secondaires',
    varPrefix: '--el-color-pink',
  },
  {
    name: 'teal',
    label: 'Teal',
    custom: true,
    base: '#4d884e',
    dark2: '#3d6c3e',
    light3: '#82ab83',
    light5: '#a6c3a6',
    light7: '#c9dbc9',
    light8: '#dbe7db',
    light9: '#edf3ed',
    usage: 'RDV animaux, disponibilités',
    varPrefix: '--el-color-teal',
  },
  {
    name: 'yellow',
    label: 'Yellow',
    custom: true,
    base: '#e6a23c',
    dark2: '#b88130',
    light3: '#edbd76',
    light5: '#f2d09d',
    light7: '#f7e3c4',
    light8: '#faecd8',
    light9: '#fcf5eb',
    usage: 'Mise en avant, badges spéciaux',
    varPrefix: '--el-color-yellow',
  },
]

const typography = [
  {
    sample: 'Titre de page',
    font: 'Nunito',
    size: '28px',
    weight: '700',
    usage: 'page-title — une seule fois par vue',
  },
  {
    sample: 'Titre de section',
    font: 'Nunito',
    size: '20px',
    weight: '700',
    usage: 'section heading',
  },
  {
    sample: 'ÉTIQUETTE DE SECTION',
    font: 'DM Sans',
    size: '11px',
    weight: '600',
    uppercase: true,
    usage: 'section-label — toujours uppercase + letter-spacing',
  },
  {
    sample: 'Texte principal',
    font: 'DM Sans',
    size: '15px',
    weight: '400',
    usage: 'corps de texte standard',
  },
  {
    sample: 'Texte secondaire · métadonnées',
    font: 'DM Sans',
    size: '13px',
    weight: '400',
    muted: true,
    usage: 'descriptions, horaires, noms de clinique',
  },
  {
    sample: 'Caption · 11px',
    font: 'DM Sans',
    size: '11px',
    weight: '400',
    muted: true,
    usage: 'légendes, tooltips',
  },
  {
    sample: 'Armali',
    font: 'Blue Winter',
    size: '22px',
    weight: '700',
    brand: true,
    usage: 'branding uniquement — jamais dans le contenu',
  },
]

const spacing = [
  { token: '--spacing-xs', value: '4px', px: 4 },
  { token: '--spacing-sm', value: '8px', px: 8 },
  { token: '--spacing-md', value: '16px', px: 16 },
  { token: '--spacing-lg', value: '24px', px: 24 },
  { token: '--spacing-xl', value: '32px', px: 32 },
  { token: '--spacing-2xl', value: '48px', px: 48 },
  { token: '--spacing-3xl', value: '64px', px: 64 },
]

const radii = [
  { token: '--radius-sm', value: '4px', px: 4, usage: 'tags, badges' },
  { token: '--radius-md', value: '8px', px: 8, usage: 'inputs, boutons' },
  { token: '--radius-lg', value: '12px', px: 12, usage: 'cards' },
  { token: '--radius-xl', value: '16px', px: 16, usage: 'modals, drawers' },
  { token: '--radius-2xl', value: '24px', px: 24, usage: 'panels larges' },
  { token: '--radius-full', value: '9999px', px: 9999, usage: 'pills, avatars' },
]

const weights = [
  { token: '--fw-regular', value: '400' },
  { token: '--fw-medium', value: '500' },
  { token: '--fw-semibold', value: '600' },
  { token: '--fw-bold', value: '700' },
]
</script>

<!-- Note : WarningFilled et Close sont enregistrés globalement via ElementPlusIconsVue dans main.ts -->
<!-- Icônes utilisées dans les exemples boutons : Search, Edit, Check, Star, Delete, Message, Plus -->

<template>
  <div class="ds-page">
    <!-- Hero -->
    <header class="ds-hero">
      <div class="ds-hero-left">
        <span class="ds-brand">Armali</span>
        <h1 class="ds-hero-title">Design System</h1>
        <p class="ds-hero-sub">
          Référence visuelle partagée pour le projet M2 ESGI.<br />Stack : Vue 3 · Element Plus ·
          SCSS · Pinia.
        </p>
      </div>
      <div class="ds-hero-palette">
        <div
          v-for="c in colors"
          :key="c.name"
          class="ds-hero-dot"
          :style="{ background: c.base }"
          :title="c.label"
        />
      </div>
    </header>

    <!-- Couleurs -->
    <section class="ds-section">
      <div class="ds-section-label">
        Couleurs
        <span class="ds-section-legend">
          <span class="ds-legend-dot ds-legend-dot--native" />Natives Element Plus
          <span class="ds-legend-dot ds-legend-dot--custom" />Custom (custom-colors.scss)
        </span>
      </div>
      <div class="ds-color-grid">
        <div
          v-for="c in colors"
          :key="c.name"
          class="ds-color-card"
          :class="{ 'ds-color-card--custom': c.custom }"
        >
          <div class="ds-color-header">
            <div class="ds-color-name-row">
              <span class="ds-color-name">{{ c.label }}</span>
              <span v-if="c.custom" class="ds-custom-badge">custom</span>
            </div>
            <span class="ds-color-usage">{{ c.usage }}</span>
          </div>

          <!-- Dégradés complets -->
          <div class="ds-gradient-row">
            <div
              v-for="(stop, idx) in [
                { label: 'dark-2', color: c.dark2 },
                { label: 'base', color: c.base },
                { label: 'light-3', color: c.light3 },
                { label: 'light-5', color: c.light5 },
                { label: 'light-7', color: c.light7 },
                { label: 'light-8', color: c.light8 },
                { label: 'light-9', color: c.light9 },
              ]"
              :key="stop.label"
              class="ds-gradient-stop"
            >
              <div
                class="ds-gradient-swatch"
                :style="{ background: stop.color }"
                :title="stop.color"
              />
              <span class="ds-gradient-label">{{ stop.label }}</span>
              <span class="ds-gradient-hex">{{ stop.color }}</span>
            </div>
          </div>

          <!-- Variables CSS -->
          <div class="ds-color-vars">
            <div class="ds-color-var-row">
              <code>{{ c.varPrefix }}</code>
              <span class="ds-color-var-swatch" :style="{ background: c.base }" />
            </div>
            <div class="ds-color-var-row">
              <code>{{ c.varPrefix }}-dark-2</code>
              <span class="ds-color-var-swatch" :style="{ background: c.dark2 }" />
            </div>
            <div class="ds-color-var-row">
              <code>{{ c.varPrefix }}-light-3</code>
              <span class="ds-color-var-swatch" :style="{ background: c.light3 }" />
            </div>
            <div class="ds-color-var-row">
              <code>{{ c.varPrefix }}-light-5</code>
              <span class="ds-color-var-swatch" :style="{ background: c.light5 }" />
            </div>
            <div class="ds-color-var-row">
              <code>{{ c.varPrefix }}-light-7</code>
              <span class="ds-color-var-swatch" :style="{ background: c.light7 }" />
            </div>
            <div class="ds-color-var-row">
              <code>{{ c.varPrefix }}-light-9</code>
              <span class="ds-color-var-swatch" :style="{ background: c.light9 }" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="ds-divider" />

    <!-- Typographie -->
    <section class="ds-section">
      <div class="ds-section-label">Typographie</div>
      <div class="ds-type-list">
        <div v-for="t in typography" :key="t.sample" class="ds-type-row">
          <div
            class="ds-type-sample"
            :style="{
              fontFamily: `'${t.font}', sans-serif`,
              fontSize: t.size,
              fontWeight: t.weight,
              textTransform: t.uppercase ? 'uppercase' : 'none',
              letterSpacing: t.uppercase ? '.1em' : 'normal',
              color: t.brand
                ? 'var(--el-color-primary)'
                : t.muted
                  ? 'var(--el-text-color-secondary)'
                  : 'var(--el-text-color-primary)',
            }"
          >
            {{ t.sample }}
          </div>
          <div class="ds-type-meta">
            <code>{{ t.font }}</code>
            <span>{{ t.size }} / {{ t.weight }}</span>
            <span class="ds-type-usage">{{ t.usage }}</span>
          </div>
        </div>
      </div>
    </section>

    <div class="ds-divider" />

    <!-- Espacements -->
    <section class="ds-section">
      <div class="ds-section-label">Espacements</div>
      <div class="ds-spacing-list">
        <div v-for="s in spacing" :key="s.token" class="ds-spacing-row">
          <code class="ds-token">{{ s.token }}</code>
          <div class="ds-spacing-bar-wrap">
            <div class="ds-spacing-bar" :style="{ width: `${Math.min(s.px * 3, 280)}px` }" />
          </div>
          <span class="ds-spacing-val">{{ s.value }}</span>
        </div>
      </div>
    </section>

    <div class="ds-divider" />

    <!-- Rayons & Graisses -->
    <section class="ds-section ds-section--row">
      <div class="ds-section-col">
        <div class="ds-section-label">Rayons</div>
        <div class="ds-radii">
          <div v-for="r in radii" :key="r.token" class="ds-radius-item">
            <div
              class="ds-radius-box"
              :style="{
                borderRadius: r.px >= 9999 ? '9999px' : `${r.px}px`,
                width: r.px >= 9999 ? '48px' : '56px',
                height: r.px >= 9999 ? '24px' : '56px',
              }"
            />
            <code class="ds-token ds-token--sm">{{ r.token }}</code>
            <span class="ds-radius-usage">{{ r.usage }}</span>
          </div>
        </div>
      </div>

      <div class="ds-section-col">
        <div class="ds-section-label">Graisses</div>
        <div class="ds-weights">
          <div v-for="w in weights" :key="w.token" class="ds-weight-row">
            <span class="ds-weight-sample" :style="{ fontWeight: w.value }"
              >Texte — {{ w.value }}</span
            >
            <code class="ds-token ds-token--sm">{{ w.token }}</code>
          </div>
        </div>
      </div>
    </section>

    <div class="ds-divider" />

    <!-- Boutons -->
    <section class="ds-section">
      <div class="ds-section-label">Boutons</div>
      <div class="ds-comp-block">
        <div class="ds-comp-sub">Solid</div>
        <div class="ds-row">
          <el-button>Default</el-button>
          <el-button type="primary">Primary</el-button>
          <el-button type="success">Success</el-button>
          <el-button type="warning">Warning</el-button>
          <el-button type="danger">Danger</el-button>
          <el-button type="info">Info</el-button>
        </div>

        <div class="ds-comp-sub">Plain</div>
        <div class="ds-row">
          <el-button plain>Default</el-button>
          <el-button type="primary" plain>Primary</el-button>
          <el-button type="success" plain>Success</el-button>
          <el-button type="warning" plain>Warning</el-button>
          <el-button type="danger" plain>Danger</el-button>
          <el-button type="info" plain>Info</el-button>
        </div>

        <div class="ds-comp-sub">Dashed</div>
        <div class="ds-row">
          <el-button dashed>Default</el-button>
          <el-button type="primary" dashed>Primary</el-button>
          <el-button type="success" dashed>Success</el-button>
          <el-button type="warning" dashed>Warning</el-button>
          <el-button type="danger" dashed>Danger</el-button>
          <el-button type="info" dashed>Info</el-button>
        </div>

        <div class="ds-comp-sub">Circle (icon)</div>
        <div class="ds-row" style="align-items: center">
          <el-button :icon="Search" circle />
          <el-button type="primary" :icon="Edit" circle />
          <el-button type="success" :icon="Check" circle />
          <el-button type="warning" :icon="Star" circle />
          <el-button type="danger" :icon="Delete" circle />
          <el-button type="info" :icon="Message" circle />
        </div>

        <div class="ds-comp-sub">Avec icône</div>
        <div class="ds-row">
          <el-button type="primary" :icon="Plus">Créer</el-button>
          <el-button type="danger" plain :icon="Delete">Supprimer</el-button>
          <el-button :icon="Edit">Modifier</el-button>
          <el-button type="success" :icon="Check">Confirmer</el-button>
        </div>

        <div class="ds-comp-sub">Tailles</div>
        <div class="ds-row" style="align-items: center">
          <el-button type="primary" size="small">Petit</el-button>
          <el-button type="primary">Normal</el-button>
          <el-button type="primary" size="large">Grand</el-button>
        </div>

        <div class="ds-comp-sub">États</div>
        <div class="ds-row">
          <el-button type="primary" :loading="true">Chargement</el-button>
          <el-button type="primary" disabled>Désactivé</el-button>
          <el-button type="danger" disabled>Désactivé danger</el-button>
        </div>
      </div>
    </section>

    <div class="ds-divider" />

    <!-- Tags -->
    <section class="ds-section">
      <div class="ds-section-label">Tags & Badges</div>
      <div class="ds-comp-block">
        <div class="ds-comp-sub">Statuts de RDV</div>
        <div class="ds-row">
          <el-tag type="primary" round>À venir</el-tag>
          <el-tag type="success" round>Accepté</el-tag>
          <el-tag type="danger" round>Refusé</el-tag>
          <el-tag type="warning" round>En attente</el-tag>
          <el-tag type="info" round>Passé</el-tag>
        </div>
        <div class="ds-comp-sub">Kinds de meeting</div>
        <div class="ds-row">
          <el-tag class="el-tag--teal" round>🐾 Animal</el-tag>
          <el-tag class="el-tag--purple" round>💬 Interne</el-tag>
          <el-tag class="el-tag--pink" round>📅 Disponibilité</el-tag>
        </div>
        <div class="ds-comp-sub">Tailles</div>
        <div class="ds-row" style="align-items: center">
          <el-tag type="primary" size="small">Small</el-tag>
          <el-tag type="primary">Default</el-tag>
          <el-tag type="primary" size="large">Large</el-tag>
        </div>
      </div>
    </section>

    <div class="ds-divider" />

    <!-- Inputs -->
    <section class="ds-section">
      <div class="ds-section-label">Formulaires</div>
      <div class="ds-comp-block">
        <div class="ds-form-grid">
          <div>
            <div class="ds-form-label">Texte</div>
            <el-input placeholder="Rechercher un animal, clinique..." />
          </div>
          <div>
            <div class="ds-form-label">Avec icône</div>
            <el-input placeholder="Rechercher..." :prefix-icon="Search" />
          </div>
          <div>
            <div class="ds-form-label">Date</div>
            <el-date-picker type="date" placeholder="Sélectionner" style="width: 100%" />
          </div>
          <div>
            <div class="ds-form-label">Heure</div>
            <el-time-select
              start="06:00"
              end="22:00"
              step="00:15"
              placeholder="Heure"
              style="width: 100%"
            />
          </div>
          <div>
            <div class="ds-form-label">Sélection</div>
            <el-select placeholder="Choisir un rôle" style="width: 100%">
              <el-option label="Vétérinaire" value="VETERINARIAN" />
              <el-option label="Secrétaire" value="SECRETARY" />
              <el-option label="Client" value="CLIENT" />
            </el-select>
          </div>
          <div>
            <div class="ds-form-label">Textarea</div>
            <el-input type="textarea" :rows="2" placeholder="Décrire le motif de consultation..." />
          </div>
        </div>
        <div class="ds-comp-sub">États</div>
        <div class="ds-form-grid">
          <div>
            <div class="ds-form-label">Erreur</div>
            <el-input value="email-invalide" />
            <div class="ds-form-error">Format d'email invalide.</div>
          </div>
          <div>
            <div class="ds-form-label">Désactivé</div>
            <el-input value="Valeur fixe" disabled />
          </div>
        </div>
      </div>
    </section>

    <div class="ds-divider" />

    <!-- Alertes -->
    <section class="ds-section">
      <div class="ds-section-label">Alertes</div>
      <div class="ds-comp-block">
        <el-alert
          type="info"
          :closable="false"
          show-icon
          title="Information"
          description="Utilise ceci pour informer sans bloquer l'utilisateur."
        />
        <el-alert
          type="success"
          :closable="false"
          show-icon
          title="Rendez-vous confirmé"
          description="Le rendez-vous a bien été enregistré. Un email de confirmation a été envoyé."
        />
        <el-alert
          type="warning"
          :closable="false"
          show-icon
          title="Modification restreinte"
          description="Modification impossible à moins de 48h du rendez-vous. Contacte la clinique."
        />
        <el-alert
          type="error"
          :closable="false"
          show-icon
          title="Erreur"
          description="Une erreur est survenue. Réessaie ou contacte le support."
        />
      </div>
    </section>

    <div class="ds-divider" />

    <!-- Avatars -->
    <section class="ds-section">
      <div class="ds-section-label">Avatars</div>
      <div class="ds-comp-block">
        <div class="ds-row" style="align-items: center">
          <el-avatar
            :size="24"
            style="
              background: var(--el-color-primary-light-7);
              color: var(--el-color-primary);
              font-size: 10px;
              font-weight: 700;
            "
            >PL</el-avatar
          >
          <el-avatar
            :size="32"
            style="
              background: var(--el-color-primary-light-7);
              color: var(--el-color-primary);
              font-size: 12px;
              font-weight: 700;
            "
            >PL</el-avatar
          >
          <el-avatar
            :size="40"
            style="
              background: var(--el-color-primary-light-7);
              color: var(--el-color-primary);
              font-weight: 700;
            "
            >PL</el-avatar
          >
          <el-avatar
            :size="48"
            style="
              background: var(--el-color-primary-light-7);
              color: var(--el-color-primary);
              font-size: 16px;
              font-weight: 700;
            "
            >PL</el-avatar
          >
        </div>
        <div class="ds-row" style="align-items: center">
          <el-avatar
            style="
              background: var(--el-color-primary-light-7);
              color: var(--el-color-primary);
              font-weight: 700;
            "
            >PL</el-avatar
          >
          <el-avatar
            style="
              background: var(--el-color-purple-light-7, #eeedfe);
              color: var(--el-color-purple, #9f6de0);
              font-weight: 700;
            "
            >CM</el-avatar
          >
          <el-avatar
            style="
              background: var(--el-color-success-light-7);
              color: var(--el-color-success);
              font-weight: 700;
            "
            >LG</el-avatar
          >
          <el-avatar
            style="
              background: var(--el-color-danger-light-7);
              color: var(--el-color-danger);
              font-weight: 700;
            "
            >AD</el-avatar
          >
          <el-avatar
            style="
              background: var(--el-color-warning-light-7);
              color: var(--el-color-warning);
              font-weight: 700;
            "
            >SB</el-avatar
          >
        </div>
        <div class="ds-comp-sub">Empilés (participants)</div>
        <div class="ds-stacked-avatars">
          <el-avatar
            v-for="(init, i) in ['PL', 'CM', 'LG', 'AD', '+3']"
            :key="i"
            :size="32"
            :style="{
              background:
                i === 4
                  ? 'var(--el-fill-color)'
                  : `var(--el-color-${['primary', 'purple', 'success', 'danger'][i] || 'primary'}-light-7)`,
              color:
                i === 4
                  ? 'var(--el-text-color-secondary)'
                  : `var(--el-color-${['primary', 'purple', 'success', 'danger'][i] || 'primary'})`,
              fontWeight: '700',
              fontSize: '11px',
              marginLeft: i > 0 ? '-8px' : '0',
              border: '2px solid var(--el-bg-color)',
              zIndex: 5 - i,
            }"
            >{{ init }}</el-avatar
          >
        </div>
      </div>
    </section>

    <div class="ds-divider" />

    <!-- Cards de RDV -->
    <section class="ds-section">
      <div class="ds-section-label">Cards — Rendez-vous</div>
      <div class="ds-comp-block">
        <!-- Animal UPCOMING -->
        <div class="ds-meeting-card">
          <div class="ds-date-block ds-date-block--primary">
            <span class="ds-date-day">10</span>
            <span class="ds-date-month">juil</span>
          </div>
          <div class="ds-card-body">
            <div class="ds-card-top">
              <span class="ds-animal-name">Rex</span>
              <span class="ds-animal-race">Chien · Labrador</span>
            </div>
            <div class="ds-card-meta">
              <span class="ds-meta-item"
                ><el-icon><Clock /></el-icon>9h00 — 9h30</span
              >
              <span class="ds-meta-item"
                ><el-icon><User /></el-icon>Dr Leroy</span
              >
              <span class="ds-meta-item"
                ><el-icon><Location /></el-icon>Clinique du Parc</span
              >
            </div>
            <div class="ds-card-tags">
              <el-tag type="primary" size="small" round>Cardiologie</el-tag>
            </div>
          </div>
          <div class="ds-card-right">
            <el-tag type="success" size="small" round>À venir</el-tag>
          </div>
        </div>

        <!-- Animal PAST -->
        <div class="ds-meeting-card ds-meeting-card--past">
          <div class="ds-date-block ds-date-block--past">
            <span class="ds-date-day">20</span>
            <span class="ds-date-month">juin</span>
          </div>
          <div class="ds-card-body">
            <div class="ds-card-top">
              <span class="ds-animal-name">Luna</span>
              <span class="ds-animal-race">Chat · Persan</span>
            </div>
            <div class="ds-card-meta">
              <span class="ds-meta-item"
                ><el-icon><Clock /></el-icon>14h00 — 14h20</span
              >
              <span class="ds-meta-item"
                ><el-icon><User /></el-icon>Dr Moreau</span
              >
            </div>
            <div class="ds-card-tags">
              <el-tag type="info" size="small" round>Dermatologie</el-tag>
            </div>
          </div>
          <div class="ds-card-right">
            <el-tag type="info" size="small" round>Passé</el-tag>
          </div>
        </div>

        <!-- Internal -->
        <div class="ds-meeting-card">
          <div class="ds-date-block ds-date-block--purple">
            <span class="ds-date-day" style="color: var(--el-color-purple, #9f6de0)">7</span>
            <span class="ds-date-month" style="color: var(--el-color-purple, #9f6de0)">juil</span>
          </div>
          <div class="ds-card-body">
            <div class="ds-card-top">
              <span class="ds-animal-name">Réunion hebdomadaire équipe</span>
            </div>
            <div class="ds-card-meta">
              <span class="ds-meta-item"
                ><el-icon><Clock /></el-icon>10h00 — 11h00</span
              >
              <span class="ds-meta-item"
                ><el-icon><User /></el-icon>3 participants</span
              >
            </div>
            <div class="ds-card-tags">
              <div class="ds-stacked-avatars">
                <el-avatar
                  v-for="(init, i) in ['PL', 'CM', 'LP']"
                  :key="i"
                  :size="22"
                  :style="{
                    background: `var(--el-color-${['primary', 'purple', 'success'][i]}-light-7)`,
                    color: `var(--el-color-${['primary', 'purple', 'success'][i]})`,
                    fontWeight: '700',
                    fontSize: '9px',
                    marginLeft: i > 0 ? '-6px' : '0',
                    border: '1.5px solid var(--el-bg-color)',
                  }"
                  >{{ init }}</el-avatar
                >
              </div>
            </div>
          </div>
          <div class="ds-card-right">
            <el-tag type="success" size="small" round>Accepté</el-tag>
          </div>
        </div>
      </div>
    </section>

    <div class="ds-divider" />

    <!-- ConfirmDeleteDialog -->
    <section class="ds-section">
      <div class="ds-section-label">ConfirmDeleteDialog</div>
      <div class="ds-comp-block">
        <div class="ds-comp-sub">Aperçu statique — usage</div>
        <div class="ds-code-note">
          <code>&lt;ConfirmDeleteDialog v-model="show" @confirm="onDelete" /&gt;</code>
        </div>
        <div class="ds-comp-sub">Rendu</div>
        <div class="ds-dialog-preview">
          <div class="ds-dialog-mock">
            <div class="ds-dialog-body">
              <div class="ds-dialog-icon-wrap">
                <el-icon class="ds-dialog-icon"><WarningFilled /></el-icon>
              </div>
              <h3 class="ds-dialog-title">Confirmer la suppression</h3>
              <p class="ds-dialog-message">
                Cette action est irréversible. Le rendez-vous sera définitivement supprimé.
              </p>
            </div>
            <div class="ds-dialog-footer">
              <el-button>Annuler</el-button>
              <el-button type="danger">Supprimer</el-button>
            </div>
          </div>
        </div>
        <div class="ds-comp-sub">Props disponibles</div>
        <div class="ds-props-table">
          <div class="ds-props-row ds-props-row--header">
            <span>Prop</span><span>Type</span><span>Défaut</span><span>Description</span>
          </div>
          <div class="ds-props-row">
            <code>v-model</code><span>boolean</span><span>—</span><span>Contrôle l'ouverture</span>
          </div>
          <div class="ds-props-row">
            <code>title</code><span>string</span><span>'Confirmer la suppression'</span
            ><span>Titre de la modale</span>
          </div>
          <div class="ds-props-row">
            <code>message</code><span>string</span><span>'Cette action est irréversible.'</span
            ><span>Corps (overridable via slot)</span>
          </div>
          <div class="ds-props-row">
            <code>confirmText</code><span>string</span><span>'Supprimer'</span
            ><span>Label du bouton de confirmation</span>
          </div>
          <div class="ds-props-row">
            <code>cancelText</code><span>string</span><span>'Annuler'</span
            ><span>Label du bouton d'annulation</span>
          </div>
          <div class="ds-props-row">
            <code>loading</code><span>boolean</span><span>false</span
            ><span>État de chargement du bouton confirm</span>
          </div>
        </div>
        <div class="ds-comp-sub">Usage avec slot personnalisé</div>
        <div class="ds-code-block">
          <pre>{{ `<ConfirmDeleteDialog v-model="show" :loading="deleting" @confirm="onDelete">
  Le rendez-vous <strong>Cardiologie – Rex</strong> du 10 juillet sera
  définitivement supprimé.
</ConfirmDeleteDialog>` }}</pre>
        </div>
      </div>
    </section>

    <div class="ds-divider" />

    <!-- FormError -->
    <section class="ds-section">
      <div class="ds-section-label">FormError — Notification d'erreur globale</div>
      <div class="ds-comp-block">
        <div class="ds-comp-sub">Aperçu statique</div>
        <div class="ds-form-error-preview">
          <div class="ds-form-error-mock">
            <el-icon><WarningFilled /></el-icon>
            <span>Email ou mot de passe incorrect.</span>
            <el-icon class="ds-form-error-close"><Close /></el-icon>
          </div>
        </div>
        <div class="ds-comp-sub">Usage dans les vues</div>
        <div class="ds-code-block">
          <pre>{{ `// Dans le composant
import { useFormErrorStore } from '@/stores/formErrorStore'
const formError = useFormErrorStore()

try {
  await authService.login(data)
} catch (err) {
  formError.handle(err) // affiche automatiquement la notification
}

// Dans le template global (App.vue ou layout)
<FormError />` }}</pre>
        </div>
        <div class="ds-comp-sub">Store — méthodes disponibles</div>
        <div class="ds-props-table">
          <div class="ds-props-row ds-props-row--header">
            <span>Méthode / Propriété</span><span>Type</span><span>Description</span>
          </div>
          <div class="ds-props-row">
            <code>error</code><span>string | null</span><span>Message d'erreur courant</span>
          </div>
          <div class="ds-props-row">
            <code>fieldErrors</code><span>Record&lt;string, string[]&gt;</span
            ><span>Erreurs Zod par champ</span>
          </div>
          <div class="ds-props-row">
            <code>handle(err)</code><span>(err: unknown) → void</span
            ><span>Parse l'erreur et remplit le store</span>
          </div>
          <div class="ds-props-row">
            <code>clear()</code><span>() → void</span><span>Efface toutes les erreurs</span>
          </div>
        </div>
        <div class="ds-comp-sub">Binding champ par champ (erreurs Zod)</div>
        <div class="ds-code-block">
          <pre>{{ `<el-form-item label="Email" :error="formError.fieldErrors['email']?.[0]">
  <el-input v-model="email" />
</el-form-item>` }}</pre>
        </div>
      </div>
    </section>

    <div class="ds-divider" />

    <!-- Empty state -->
    <section class="ds-section">
      <div class="ds-section-label">État vide</div>
      <div class="ds-empty-state">
        <el-icon class="ds-empty-icon"><Calendar /></el-icon>
        <p class="ds-empty-title">Aucun rendez-vous trouvé</p>
        <p class="ds-empty-desc">Modifie tes filtres ou prends un nouveau rendez-vous.</p>
        <el-button type="primary">Prendre rendez-vous</el-button>
      </div>
    </section>

    <div class="ds-divider" />

    <!-- Tokens CSS -->
    <section class="ds-section">
      <div class="ds-section-label">Tokens CSS — variables à utiliser</div>
      <div class="ds-tokens-grid">
        <div class="ds-token-group">
          <div class="ds-token-group-title">Espacements</div>
          <div v-for="s in spacing" :key="s.token" class="ds-token-line">
            <code>{{ s.token }}</code
            ><span>{{ s.value }}</span>
          </div>
        </div>
        <div class="ds-token-group">
          <div class="ds-token-group-title">Rayons</div>
          <div v-for="r in radii" :key="r.token" class="ds-token-line">
            <code>{{ r.token }}</code
            ><span>{{ r.value }}</span>
          </div>
        </div>
        <div class="ds-token-group">
          <div class="ds-token-group-title">Graisses</div>
          <div v-for="w in weights" :key="w.token" class="ds-token-line">
            <code>{{ w.token }}</code
            ><span>{{ w.value }}</span>
          </div>
        </div>
        <div class="ds-token-group">
          <div class="ds-token-group-title">Couleurs custom</div>
          <div
            v-for="c in colors.filter((x) => ['purple', 'pink', 'teal', 'yellow'].includes(x.name))"
            :key="c.name"
            class="ds-token-line"
          >
            <code>--el-color-{{ c.name }}</code>
            <span class="ds-token-dot" :style="{ background: c.base }"></span>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer note -->
    <div class="ds-footer">
      <p>
        Toujours utiliser les variables CSS plutôt que des valeurs en dur. Importer les fonts depuis
        <code>styles/fonts.scss</code>. Couleurs custom définies dans
        <code>styles/element/custom-colors.scss</code>.
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.ds-page {
  max-width: 960px;
  margin: 0 auto;
  padding: var(--spacing-2xl) var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2xl);
}

// ── Hero ──────────────────────────────────────────────────────────────────────
.ds-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-xl);
  padding-bottom: var(--spacing-xl);
}

.ds-brand {
  font-family: 'Blue Winter', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--el-color-primary);
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: var(--spacing-sm);
}

.ds-hero-title {
  font-family: 'Nunito', sans-serif;
  font-size: 36px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-sm);
}

.ds-hero-sub {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  line-height: 1.7;
}

.ds-hero-palette {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  max-width: 160px;
  align-content: flex-start;
}

.ds-hero-dot {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
}

// ── Sections ──────────────────────────────────────────────────────────────────
.ds-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);

  &--row {
    flex-direction: row;
    gap: var(--spacing-2xl);
    align-items: flex-start;
  }
}

.ds-section-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.ds-section-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--el-text-color-placeholder);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.ds-divider {
  height: 1px;
  background: var(--el-border-color-lighter);
}

// ── Colors ────────────────────────────────────────────────────────────────────
.ds-section-legend {
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
  color: var(--el-text-color-secondary);
  margin-left: var(--spacing-md);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.ds-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  display: inline-block;

  &--native {
    background: var(--el-color-primary);
  }

  &--custom {
    background: var(--el-color-purple, #9f6de0);
    border: 1.5px dashed var(--el-border-color-darker, #aaa);
  }
}

.ds-color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-md);
}

.ds-color-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &--custom {
    border-style: dashed;
    border-color: var(--el-border-color);
  }
}

.ds-color-header {
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-xs);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ds-color-name-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.ds-color-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.ds-custom-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  border: 1px dashed var(--el-border-color);
  letter-spacing: 0.04em;
}

.ds-color-usage {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.ds-gradient-row {
  display: flex;
  height: 80px;
}

.ds-gradient-stop {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.ds-gradient-swatch {
  flex: 1;
  width: 100%;
}

.ds-gradient-label {
  font-size: 9px;
  font-weight: 600;
  color: var(--el-text-color-placeholder);
  padding: 2px 0 1px;
  text-align: center;
  line-height: 1;
}

.ds-gradient-hex {
  font-size: 8px;
  font-family: monospace;
  color: var(--el-text-color-placeholder);
  padding-bottom: 3px;
  text-align: center;
}

.ds-color-vars {
  padding: var(--spacing-xs) var(--spacing-md) var(--spacing-sm);
  display: flex;
  flex-direction: column;
  gap: 3px;
  background: var(--el-fill-color-extra-light);
  border-top: 1px solid var(--el-border-color-lighter);
}

.ds-color-var-row {
  display: flex;
  align-items: center;
  justify-content: space-between;

  code {
    font-size: 10px;
    color: var(--el-text-color-secondary);
    font-family: monospace;
  }
}

.ds-color-var-swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

// ── Typography ────────────────────────────────────────────────────────────────
.ds-type-list {
  display: flex;
  flex-direction: column;
}

.ds-type-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--el-border-color-lighter);

  &:last-child {
    border-bottom: none;
  }
}

.ds-type-sample {
  flex: 1;
}

.ds-type-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-shrink: 0;

  code {
    font-size: 11px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
  }

  span {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.ds-type-usage {
  font-size: 11px !important;
  color: var(--el-text-color-placeholder) !important;
  max-width: 200px;
}

// ── Spacing ───────────────────────────────────────────────────────────────────
.ds-spacing-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.ds-spacing-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.ds-spacing-bar-wrap {
  flex: 1;
}

.ds-spacing-bar {
  height: 6px;
  background: var(--el-color-primary);
  border-radius: var(--radius-full);
  opacity: 0.7;
}

.ds-spacing-val {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  min-width: 32px;
  text-align: right;
}

// ── Tokens ────────────────────────────────────────────────────────────────────
.ds-token {
  font-size: 12px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-family: monospace;

  &--sm {
    font-size: 10px;
  }
}

// ── Radii ────────────────────────────────────────────────────────────────────
.ds-radii {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
}

.ds-radius-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.ds-radius-box {
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color);
}

.ds-radius-usage {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  text-align: center;
}

// ── Weights ───────────────────────────────────────────────────────────────────
.ds-weights {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.ds-weight-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.ds-weight-sample {
  font-size: 16px;
  color: var(--el-text-color-primary);
  font-family: 'DM Sans', sans-serif;
}

// ── Comp block ────────────────────────────────────────────────────────────────
.ds-comp-block {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--el-border-color-lighter);
}

.ds-comp-sub {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--el-text-color-placeholder);
  margin-top: var(--spacing-sm);

  &:first-child {
    margin-top: 0;
  }
}

.ds-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  align-items: center;
}

// ── Form ──────────────────────────────────────────────────────────────────────
.ds-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--spacing-md);
}

.ds-form-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  margin-bottom: var(--spacing-xs);
}

.ds-form-error {
  font-size: 12px;
  color: var(--el-color-danger);
  margin-top: 4px;
}

// ── Meeting Cards ─────────────────────────────────────────────────────────────
.ds-meeting-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  transition: all 0.15s;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    transform: translateY(-1px);
  }

  &--past {
    opacity: 0.7;
  }
}

.ds-date-block {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &--primary {
    background: var(--el-color-primary-light-9);
    border: 1px solid var(--el-color-primary-light-7);
  }

  &--past {
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
  }

  &--purple {
    background: var(--el-color-purple-light-9, #eeedfe);
    border: 1px solid var(--el-color-purple-light-7, #cecbf6);
  }
}

.ds-date-day {
  font-family: 'Nunito', sans-serif;
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  color: var(--el-color-primary);

  .ds-date-block--past & {
    color: var(--el-text-color-secondary);
  }
}

.ds-date-month {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--el-color-primary-light-3);

  .ds-date-block--past & {
    color: var(--el-text-color-placeholder);
  }
}

.ds-card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.ds-card-top {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
}

.ds-animal-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.ds-animal-race {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ds-card-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.ds-meta-item {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: var(--el-text-color-secondary);

  .el-icon {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}

.ds-card-tags {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: 2px;
}

.ds-card-right {
  flex-shrink: 0;
}

// ── Stacked Avatars ───────────────────────────────────────────────────────────
.ds-stacked-avatars {
  display: flex;
  align-items: center;
}

// ── Empty state ───────────────────────────────────────────────────────────────
.ds-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-3xl) var(--spacing-xl);
  text-align: center;
  border: 1px dashed var(--el-border-color);
  border-radius: var(--radius-xl);
}

.ds-empty-icon {
  font-size: 40px;
  color: var(--el-color-primary-light-5);
  margin-bottom: var(--spacing-xs);
}

.ds-empty-title {
  font-family: 'Nunito', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.ds-empty-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: var(--spacing-sm);
}

// ── Token grid ────────────────────────────────────────────────────────────────
.ds-tokens-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.ds-token-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.ds-token-group-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: var(--spacing-xs);
}

.ds-token-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  padding: 3px 0;

  code {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    font-family: monospace;
  }

  span {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }
}

.ds-token-dot {
  width: 16px;
  height: 16px;
  border-radius: var(--radius-full);
  border: 1px solid rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

// ── ConfirmDeleteDialog preview ───────────────────────────────────────────────
.ds-code-note {
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);

  code {
    font-size: 13px;
    font-family: monospace;
    color: var(--el-color-primary);
  }
}

.ds-dialog-preview {
  display: flex;
  justify-content: center;
  padding: var(--spacing-lg) 0;
  background: rgba(0, 0, 0, 0.04);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--el-border-color);
}

.ds-dialog-mock {
  background: var(--el-bg-color);
  border-radius: var(--radius-xl);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.06);
  width: 360px;
  overflow: hidden;
}

.ds-dialog-body {
  padding: var(--spacing-xl) var(--spacing-xl) var(--spacing-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--spacing-sm);
}

.ds-dialog-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--el-color-danger-light-9);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-xs);
}

.ds-dialog-icon {
  font-size: 26px;
  color: var(--el-color-danger);
}

.ds-dialog-title {
  font-family: 'Nunito', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0;
}

.ds-dialog-message {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
  margin: 0;
}

.ds-dialog-footer {
  padding: var(--spacing-md) var(--spacing-xl) var(--spacing-lg);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  border-top: 1px solid var(--el-border-color-lighter);
}

// ── FormError preview ─────────────────────────────────────────────────────────
.ds-form-error-preview {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl) 0;
  background: rgba(0, 0, 0, 0.04);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--el-border-color);
  position: relative;
}

.ds-form-error-mock {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-5);
  border-radius: var(--radius-md);
  color: var(--el-color-danger);
  font-size: 13px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  white-space: nowrap;

  .el-icon {
    font-size: 14px;
  }
}

.ds-form-error-close {
  margin-left: var(--spacing-xs);
  opacity: 0.6;
}

// ── Props table ───────────────────────────────────────────────────────────────
.ds-props-table {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-md);
  overflow: hidden;
  font-size: 12px;
}

.ds-props-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1.5fr 2fr;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-md);
  border-bottom: 1px solid var(--el-border-color-lighter);
  align-items: start;

  &:last-child {
    border-bottom: none;
  }

  &--header {
    background: var(--el-fill-color-extra-light);
    font-weight: 600;
    font-size: 11px;
    color: var(--el-text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  code {
    font-size: 11px;
    font-family: monospace;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    padding: 1px 4px;
    border-radius: 3px;
  }

  span {
    color: var(--el-text-color-secondary);
    line-height: 1.5;
  }
}

// ── Code block ────────────────────────────────────────────────────────────────
.ds-code-block {
  background: var(--el-fill-color-extra-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  overflow-x: auto;

  pre {
    font-family: monospace;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.7;
    margin: 0;
    white-space: pre-wrap;
  }
}

// ── Footer ────────────────────────────────────────────────────────────────────
.ds-footer {
  padding: var(--spacing-lg);
  background: var(--el-fill-color-extra-light);
  border-radius: var(--radius-lg);
  border: 1px solid var(--el-border-color-lighter);

  p {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    line-height: 1.6;
  }

  code {
    font-size: 12px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    padding: 1px 5px;
    border-radius: var(--radius-sm);
    font-family: monospace;
  }
}
</style>
