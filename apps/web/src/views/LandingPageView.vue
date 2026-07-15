<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'
import { roleHomeMap } from '@/router/index'
import HeroComponent from '@/components/landingPage/HeroComponent.vue'
import SiteFooter from '@/components/landingPage/SiteFooter.vue'

const authStore = useAuthStore()
const router = useRouter()

function goToMySpace() {
  const role = authStore.user?.role
  if (role) router.push(roleHomeMap[role])
  else router.push('/login')
}

const species = [
  { emoji: '🐕', label: 'Chiens' },
  { emoji: '🐈', label: 'Chats' },
  { emoji: '🐇', label: 'Lapins' },
  { emoji: '🦜', label: 'Oiseaux' },
  { emoji: '🐠', label: 'Poissons' },
  { emoji: '🐾', label: 'Autres' },
]

const steps = [
  {
    number: '01',
    title: 'Choisissez votre clinique',
    desc: 'Trouvez une clinique vétérinaire partenaire près de chez vous, avec ses spécialités et disponibilités en temps réel.',
  },
  {
    number: '02',
    title: 'Réservez en ligne',
    desc: 'Sélectionnez un créneau disponible et confirmez votre rendez-vous en moins de deux minutes.',
  },
  {
    number: '03',
    title: 'Suivez votre animal',
    desc: 'Accédez à son carnet de santé, ses ordonnances et comptes-rendus de consultation depuis votre espace.',
  },
]

const testimonials = [
  {
    quote:
      "J'ai trouvé un vétérinaire disponible le lendemain pour mon chat. Le suivi en ligne est top.",
    author: 'Sophie M.',
    animal: 'Chatte Persan',
    avatar: '🐈',
  },
  {
    quote: "Plus besoin d'appeler pour annuler ou modifier un RDV. Tout se fait en quelques clics.",
    author: 'Thomas R.',
    animal: 'Labrador 3 ans',
    avatar: '🐕',
  },
  {
    quote: 'Les ordonnances et vaccins de mon lapin sont accessibles à tout moment. Très pratique.',
    author: 'Camille B.',
    animal: 'Lapin Rex',
    avatar: '🐇',
  },
]
</script>

<template>
  <div class="landing">
    <!-- ── Hero ───────────────────────────────────────────────────────────────── -->
    <hero-component />

    <!-- ── Pour qui ? ─────────────────────────────────────────────────────────── -->
    <section class="section section--light">
      <div class="container">
        <div class="section-label">Pour tous vos compagnons</div>
        <h2 class="section-title">Une plateforme pensée pour chaque animal</h2>
        <div class="species-grid">
          <div v-for="s in species" :key="s.label" class="species-card">
            <span class="species-emoji">{{ s.emoji }}</span>
            <span class="species-label">{{ s.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Comment ça marche ──────────────────────────────────────────────────── -->
    <section class="section">
      <div class="container">
        <div class="section-label">Simple & rapide</div>
        <h2 class="section-title">Un rendez-vous en 3 étapes</h2>
        <div class="steps">
          <div v-for="step in steps" :key="step.number" class="step">
            <div class="step-number">{{ step.number }}</div>
            <div class="step-content">
              <h3 class="step-title">{{ step.title }}</h3>
              <p class="step-desc">{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Features ──────────────────────────────────────────────────────────── -->
    <section class="section section--primary">
      <div class="container">
        <div class="section-label section-label--light">Tout inclus</div>
        <h2 class="section-title section-title--light">Votre carnet de santé numérique</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">📋</div>
            <h3 class="feature-title">Historique complet</h3>
            <p class="feature-desc">
              Consultations, actes, vaccins — tout l'historique de votre animal en un coup d'œil.
            </p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">💊</div>
            <h3 class="feature-title">Ordonnances en ligne</h3>
            <p class="feature-desc">
              Retrouvez et partagez les ordonnances directement depuis votre espace personnel.
            </p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔔</div>
            <h3 class="feature-title">Rappels automatiques</h3>
            <p class="feature-desc">
              Ne manquez plus aucun rappel vaccinal ou suivi post-opératoire.
            </p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🏥</div>
            <h3 class="feature-title">Réseau de cliniques</h3>
            <p class="feature-desc">
              Accédez à un réseau de cliniques partenaires avec leurs spécialités et avis vérifiés.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Témoignages ────────────────────────────────────────────────────────── -->
    <section class="section section--light">
      <div class="container">
        <div class="section-label">Ils nous font confiance</div>
        <h2 class="section-title">Ce que disent nos utilisateurs</h2>
        <div class="testimonials">
          <div v-for="t in testimonials" :key="t.author" class="testimonial">
            <p class="testimonial-quote">« {{ t.quote }} »</p>
            <div class="testimonial-author">
              <span class="testimonial-avatar">{{ t.avatar }}</span>
              <div>
                <div class="testimonial-name">{{ t.author }}</div>
                <div class="testimonial-animal">{{ t.animal }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── CTA final ──────────────────────────────────────────────────────────── -->
    <section class="section section--cta">
      <div class="container container--center">
        <h2 class="cta-title">Prenez soin de vos animaux,<br />on s'occupe du reste.</h2>
        <p class="cta-sub">
          Rejoignez les propriétaires qui ont simplifié la santé de leurs compagnons.
        </p>
        <div class="cta-actions">
          <template v-if="!authStore.isAuthenticated">
            <el-button type="primary" size="large" round @click="router.push('/register')">
              Créer mon compte gratuitement
            </el-button>
            <el-button size="large" round plain @click="router.push('/login')">
              Se connecter
            </el-button>
          </template>
          <template v-else>
            <el-button type="primary" size="large" round @click="goToMySpace()">
              Accéder à mon espace →
            </el-button>
          </template>
        </div>
      </div>
    </section>

    <SiteFooter />
  </div>
</template>

<style scoped lang="scss">
.landing {
  display: flex;
  flex-direction: column;
}

// ── Sections ──────────────────────────────────────────────────────────────────
.section {
  padding: $spacing-3xl 0;

  &--light {
    background: var(--el-fill-color-extra-light);
  }

  &--primary {
    background: var(--el-color-primary);
  }

  &--cta {
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-color-primary-light-7) 100%
    );
  }
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 $spacing-2xl;

  &--center {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-lg;
  }
}

// ── Section labels & titles ───────────────────────────────────────────────────
.section-label {
  font-size: 12px;
  font-weight: var(--fw-bold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--el-color-primary);
  margin-bottom: $spacing-sm;

  &--light {
    color: rgba(255, 255, 255, 0.7);
  }
}

.section-title {
  font-family: 'Nunito', sans-serif;
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: 0 0 $spacing-2xl;
  line-height: 1.2;

  &--light {
    color: var(--el-color-white);
  }
}

// ── Species ───────────────────────────────────────────────────────────────────
.species-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: $spacing-md;
}

.species-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-lg $spacing-md;
  border-radius: var(--radius-xl);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  transition: all 0.2s;
  cursor: default;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    transform: translateY(-2px);
  }
}

.species-emoji {
  font-size: 2.5rem;
}

.species-label {
  font-size: 13px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-secondary);
}

// ── Steps ─────────────────────────────────────────────────────────────────────
.steps {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: $spacing-xl;
  padding: $spacing-xl;
  border-radius: var(--radius-xl);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  }
}

.step-number {
  font-family: 'Nunito', sans-serif;
  font-size: 2.5rem;
  font-weight: var(--fw-bold);
  color: var(--el-color-primary-light-5);
  line-height: 1;
  flex-shrink: 0;
  width: 64px;
  text-align: center;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.step-title {
  font-family: 'Nunito', sans-serif;
  font-size: 18px;
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  margin: 0;
}

.step-desc {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
  margin: 0;
}

// ── Features ──────────────────────────────────────────────────────────────────
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: $spacing-md;
}

.feature-card {
  padding: $spacing-xl;
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
}

.feature-icon {
  font-size: 2rem;
}

.feature-title {
  font-family: 'Nunito', sans-serif;
  font-size: 16px;
  font-weight: var(--fw-bold);
  color: var(--el-color-white);
  margin: 0;
}

.feature-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.6;
  margin: 0;
}

// ── Testimonials ──────────────────────────────────────────────────────────────
.testimonials {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: $spacing-lg;
}

.testimonial {
  padding: $spacing-xl;
  border-radius: var(--radius-xl);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  }
}

.testimonial-quote {
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-primary);
  margin: 0;
  font-style: italic;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.testimonial-avatar {
  font-size: 2rem;
  width: 44px;
  height: 44px;
  background: var(--el-color-primary-light-9);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.testimonial-name {
  font-size: 14px;
  font-weight: var(--fw-semibold);
  color: var(--el-text-color-primary);
}

.testimonial-animal {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

// ── CTA ───────────────────────────────────────────────────────────────────────
.cta-title {
  font-family: 'Nunito', sans-serif;
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-weight: var(--fw-bold);
  color: var(--el-text-color-primary);
  line-height: 1.2;
  margin: 0;
}

.cta-sub {
  font-size: 15px;
  color: var(--el-text-color-secondary);
  margin: 0;
  max-width: 480px;
}

.cta-actions {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
  justify-content: center;
}

// ── Responsive ────────────────────────────────────────────────────────────────
@include below('md') {
  .container {
    padding: 0 $spacing-lg;
  }

  .step {
    flex-direction: column;
    gap: $spacing-md;
  }

  .step-number {
    width: auto;
    text-align: left;
    font-size: 2rem;
  }
}
</style>
