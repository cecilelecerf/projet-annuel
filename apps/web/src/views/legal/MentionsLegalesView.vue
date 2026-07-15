<script setup lang="ts">
import LegalLayout from '@/components/landingPage/LegalLayout.vue'
</script>

<template>
  <LegalLayout title="Mentions légales">
    <h2>Éditeur du site</h2>
    <p>
      Le site et l'application Armali sont édités par <strong>Armali SAS</strong>
      <em>(raison sociale, SIRET et capital social à compléter avant mise en production)</em>.
    </p>
    <ul>
      <li>Siège social : <em>adresse à compléter</em></li>
      <li>SIRET : <em>à compléter</em></li>
      <li>Directeur de la publication : <em>à compléter</em></li>
      <li>Email de contact : <a href="mailto:contact@armali.fr">contact@armali.fr</a></li>
    </ul>

    <h2>Hébergement</h2>
    <p>
      L'application est hébergée par <em>le prestataire d'hébergement à compléter</em>, dont les
      coordonnées seront précisées ici avant la mise en production du service.
    </p>

    <h2>Propriété intellectuelle</h2>
    <p>
      L'ensemble des éléments du site et de l'application Armali (textes, graphismes, logo,
      icônes, structure, base de données) sont la propriété exclusive d'Armali ou de ses
      partenaires, sauf mention contraire. Toute reproduction, représentation, modification ou
      adaptation de tout ou partie de ces éléments, par quelque procédé que ce soit, sans
      autorisation préalable, est interdite.
    </p>

    <h2>Responsabilité</h2>
    <p>
      Armali s'efforce d'assurer au mieux de ses possibilités l'exactitude et la mise à jour des
      informations diffusées sur le site, dont elle se réserve le droit de corriger le contenu à
      tout moment sans préavis. Armali ne saurait toutefois être tenue responsable des erreurs,
      omissions, ou de l'absence de disponibilité des fonctionnalités.
    </p>

    <h2>Données personnelles</h2>
    <p>
      Le traitement des données personnelles réalisé par Armali est décrit dans notre
      <router-link to="/confidentialite">politique de confidentialité</router-link>.
    </p>

    <h2>Contact</h2>
    <p>
      Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter via
      notre <router-link to="/contact">page de contact</router-link>.
    </p>
  </LegalLayout>
</template>
