<script setup lang="ts">
import { useSecretaryForm } from '../../composables/useSecretaryForm'

const { form, loading, submit } = useSecretaryForm()
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
          <el-input v-model="form.email" type="email" />
        </el-form-item>
        <el-form-item label="Mot de passe provisoire">
          <el-input v-model="form.password" type="password" show-password />
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
      Créer le compte secrétaire
    </el-button>
  </el-form>
</template>
