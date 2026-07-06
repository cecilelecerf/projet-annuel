<script setup lang="ts">
import { useVeterinarianForm } from '../../composables/useVeterinarianForm'

const {
  form,
  selectedSpecialityIds,
  specialityOptions,
  specialitySearchLoading,
  loading,
  searchSpecialities,
  submit,
} = useVeterinarianForm()
</script>

<template>
  <el-form label-position="top" @submit.prevent="submit">
    <div class="section">
      <h2>Informations de connexion</h2>
      <div class="grid grid--4">
        <el-form-item label="Prénom">
          <el-input v-model="form.firstname" />
        </el-form-item>
        <el-form-item label="Nom">
          <el-input v-model="form.lastname" />
        </el-form-item>
        <el-form-item label="Email">
          <el-input v-model="form.email" type="email" placeholder="email@exemple.com" />
        </el-form-item>
        <el-form-item label="Mot de passe provisoire">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
      </div>
    </div>

    <div class="section">
      <h2>Informations professionnelles</h2>
      <div class="grid grid--3">
        <el-form-item label="Numéro de licence">
          <el-input v-model="form.licenseNumber" placeholder="Numéro RPPS / licence" />
        </el-form-item>
        <el-form-item label="Spécialités" class="grid-span-2">
          <el-select
            v-model="selectedSpecialityIds"
            multiple
            filterable
            remote
            :remote-method="searchSpecialities"
            :loading="specialitySearchLoading"
            placeholder="Rechercher des spécialités..."
            style="width: 100%"
          >
            <el-option
              v-for="spec in specialityOptions"
              :key="spec.id"
              :label="spec.name"
              :value="spec.id"
            />
          </el-select>
        </el-form-item>
      </div>
      <el-form-item label="Biographie (optionnel)">
        <el-input
          v-model="form.bio"
          type="textarea"
          :rows="2"
          placeholder="Expériences, approche..."
        />
      </el-form-item>
    </div>

    <div class="section">
      <h2>Identité professionnelle <span class="optional-tag">optionnel</span></h2>
      <div class="grid grid--4">
        <el-form-item label="Ville de naissance">
          <el-input v-model="form.birthCity" />
        </el-form-item>
        <el-form-item label="Département de naissance">
          <el-input v-model="form.birthDepartment" />
        </el-form-item>
        <el-form-item label="Pays de naissance">
          <el-input v-model="form.birthCountry" />
        </el-form-item>
        <el-form-item label="Nationalité">
          <el-input v-model="form.nationality" />
        </el-form-item>
        <el-form-item label="Numéro INSEE">
          <el-input v-model="form.inseNumber" />
        </el-form-item>
        <el-form-item label="Diplôme">
          <el-input v-model="form.diploma" />
        </el-form-item>
        <el-form-item label="Date d'obtention">
          <el-date-picker v-model="form.diplomaObtainedAt" type="date" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Numéro RPPS">
          <el-input v-model="form.rppsNumber" />
        </el-form-item>
        <el-form-item label="Date d'inscription à l'Ordre">
          <el-date-picker v-model="form.orderRegisteredAt" type="date" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Téléphone professionnel">
          <el-input v-model="form.proPhone" />
        </el-form-item>
        <el-form-item label="Autorisation d'exercice">
          <el-switch v-model="form.practiceAuthorization" />
        </el-form-item>
      </div>
    </div>

    <div class="section">
      <h2>Coordonnées bancaires <span class="optional-tag">optionnel</span></h2>
      <div class="grid grid--4">
        <el-form-item label="IBAN">
          <el-input v-model="form.iban" />
        </el-form-item>
        <el-form-item label="BIC">
          <el-input v-model="form.bic" />
        </el-form-item>
        <el-form-item label="Domiciliation">
          <el-input v-model="form.domiciliation" />
        </el-form-item>
        <el-form-item label="Bénéficiaire">
          <el-input v-model="form.beneficiary" />
        </el-form-item>
      </div>
    </div>

    <el-button type="primary" size="large" native-type="submit" :loading="loading">
      Créer le compte vétérinaire
    </el-button>
  </el-form>
</template>
