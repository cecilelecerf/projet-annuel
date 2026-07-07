<script setup lang="ts">
import { useReferentForm } from '../../composables/useReferentForm'

const { form, loading, submit } = useReferentForm()
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

    <el-button type="primary" size="large" native-type="submit" :loading="loading">
      Créer le compte référent
    </el-button>
  </el-form>
</template>
