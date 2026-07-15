<script setup lang="ts">
import LegalLayout from '@/components/landingPage/LegalLayout.vue'
</script>

<template>
  <LegalLayout title="Conditions Générales de Vente">
    <p>Dernière mise à jour : 15 juillet 2026</p>

    <h2>1. Champ d'application</h2>
    <p>
      Les présentes Conditions Générales de Vente (CGV) s'appliquent à toute commande de produits
      (alimentation, soins, accessoires) passée par un client depuis la boutique en ligne d'une
      clinique partenaire sur la plateforme Armali. Elles complètent les
      <router-link to="/cgu">Conditions Générales d'Utilisation</router-link>.
    </p>

    <h2>2. Produits et prix</h2>
    <p>
      Les produits proposés à la vente sont ceux référencés par chaque clinique partenaire au
      moment de la commande, dans la limite des stocks disponibles. Les prix sont indiqués en
      euros, toutes taxes comprises. Chaque clinique reste seule responsable de l'exactitude des
      prix et descriptifs de ses produits.
    </p>

    <h2>3. Commande</h2>
    <p>
      La commande est validée après sélection des produits, confirmation du panier et paiement en
      ligne. Un email de confirmation reprenant le détail de la commande et un code de retrait est
      envoyé au client après validation du paiement.
    </p>

    <h2>4. Paiement</h2>
    <p>
      Le paiement s'effectue en ligne, au moment de la commande, via un prestataire de paiement
      sécurisé tiers. Armali ne conserve aucune donnée bancaire : celles-ci sont traitées
      directement par le prestataire de paiement.
    </p>

    <h2>5. Retrait des produits</h2>
    <p>
      Les commandes ne font pas l'objet d'une livraison à domicile : elles sont à retirer
      directement auprès de la clinique concernée, sur présentation du code de retrait transmis
      par email. Le client est informé par email lorsque sa commande est prête à être récupérée.
    </p>

    <h2>6. Droit de rétractation</h2>
    <p>
      Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne
      s'applique pas aux biens susceptibles de se détériorer ou de se périmer rapidement (ex :
      alimentation, produits de soin ouverts). Pour tout autre produit, le client dispose d'un
      délai de 14 jours à compter du retrait pour exercer son droit de rétractation, sous réserve
      que le produit soit retourné dans son état d'origine.
    </p>

    <h2>7. Garanties</h2>
    <p>
      Les produits vendus bénéficient de la garantie légale de conformité et de la garantie contre
      les vices cachés, conformément aux articles 1641 et suivants du Code civil et L217-3 et
      suivants du Code de la consommation.
    </p>

    <h2>8. Responsabilité</h2>
    <p>
      Armali met à disposition la plateforme technique permettant la commande et le paiement en
      ligne. La responsabilité relative à la nature, la qualité et la conformité des produits
      vendus incombe à la clinique partenaire qui les propose à la vente.
    </p>

    <h2>9. Réclamations et litiges</h2>
    <p>
      Toute réclamation relative à une commande peut être adressée via notre
      <router-link to="/contact">page de contact</router-link>. Les présentes CGV sont soumises au
      droit français ; tout litige relève de la compétence des tribunaux français.
    </p>
  </LegalLayout>
</template>
