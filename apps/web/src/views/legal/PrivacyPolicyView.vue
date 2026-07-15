<script setup lang="ts">
import LegalLayout from '@/components/landingPage/LegalLayout.vue'
</script>

<template>
  <LegalLayout title="Politique de confidentialité">
    <p>Dernière mise à jour : 15 juillet 2026</p>

    <h2>1. Responsable du traitement</h2>
    <p>
      Armali SAS, éditeur de la plateforme (voir
      <router-link to="/mentions-legales">mentions légales</router-link>), est responsable du
      traitement des données personnelles collectées via l'application.
    </p>

    <h2>2. Données collectées</h2>
    <p>Selon votre profil et votre utilisation du service, nous collectons :</p>
    <ul>
      <li>
        <strong>Données d'identification</strong> : nom, prénom, email, mot de passe (haché) ;
      </li>
      <li>
        <strong>Données professionnelles</strong> (personnel des cliniques) : numéro RPPS,
        diplômes, informations bancaires de reversement ;
      </li>
      <li>
        <strong>Données de santé animale</strong> : carnet de santé, ordonnances, comptes-rendus de
        consultation, vaccins, antécédents médicaux de vos animaux ;
      </li>
      <li>
        <strong>Données de connexion</strong> : historique de connexion, tentatives de connexion,
        adresse utilisée pour la sécurité du compte ;
      </li>
      <li>
        <strong>Données de commande</strong> : historique d'achats effectués auprès des cliniques
        partenaires.
      </li>
    </ul>
    <p>
      Les données de santé animale ne constituent pas des données de santé au sens du RGPD
      (celui-ci s'applique aux personnes physiques), mais sont traitées avec le même niveau
      d'exigence en matière de sécurité et de confidentialité, car associées à votre profil et à
      vos animaux.
    </p>

    <h2>3. Finalités et bases légales</h2>
    <ul>
      <li>Gestion de votre compte et authentification — exécution du contrat ;</li>
      <li>Prise de rendez-vous et suivi médical de vos animaux — exécution du contrat ;</li>
      <li>Gestion des commandes et paiements — exécution du contrat ;</li>
      <li>Sécurité du compte (verrouillage après tentatives infructueuses, expiration du mot de passe) — intérêt légitime ;</li>
      <li>Envoi de communications liées au service (confirmations, alertes) — exécution du contrat ;</li>
      <li>Respect de nos obligations légales et réglementaires — obligation légale.</li>
    </ul>

    <h2>4. Destinataires des données</h2>
    <p>
      Vos données sont accessibles par le personnel habilité de la ou des cliniques avec
      lesquelles vous êtes en relation, ainsi que par nos sous-traitants techniques (hébergement,
      envoi d'emails, paiement en ligne), dans la stricte mesure nécessaire à l'exécution du
      service. Ces sous-traitants sont contractuellement tenus à des obligations de
      confidentialité et de sécurité.
    </p>

    <h2>5. Durée de conservation</h2>
    <p>
      Vos données sont conservées pendant toute la durée de votre relation avec Armali, puis
      archivées ou supprimées conformément aux durées légales de conservation applicables
      (notamment en matière comptable et de santé animale), ou jusqu'à votre demande de
      suppression de compte.
    </p>

    <h2>6. Vos droits</h2>
    <p>Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :</p>
    <ul>
      <li>droit d'accès et de rectification ;</li>
      <li>droit à l'effacement (« droit à l'oubli ») ;</li>
      <li>droit à la limitation du traitement ;</li>
      <li>droit à la portabilité de vos données ;</li>
      <li>droit d'opposition pour motif légitime.</li>
    </ul>
    <p>
      Vous pouvez exercer ces droits directement depuis votre espace personnel (modification du
      profil, suppression de compte) ou en nous contactant via notre
      <router-link to="/contact">page de contact</router-link>. Vous disposez également du droit
      d'introduire une réclamation auprès de la CNIL (www.cnil.fr).
    </p>

    <h2>7. Sécurité</h2>
    <p>
      Armali met en œuvre des mesures techniques et organisationnelles pour protéger vos données :
      mots de passe hachés, exigences de robustesse des mots de passe, verrouillage de compte
      après tentatives de connexion infructueuses, renouvellement périodique du mot de passe,
      chiffrement des échanges (HTTPS).
    </p>

    <h2>8. Cookies</h2>
    <p>
      Armali utilise uniquement des cookies techniques strictement nécessaires au fonctionnement
      du service (maintien de la session de connexion). Aucun cookie publicitaire ou de suivi
      tiers n'est utilisé.
    </p>

    <h2>9. Contact</h2>
    <p>
      Pour toute question relative à vos données personnelles, contactez-nous via notre
      <router-link to="/contact">page de contact</router-link>.
    </p>
  </LegalLayout>
</template>
