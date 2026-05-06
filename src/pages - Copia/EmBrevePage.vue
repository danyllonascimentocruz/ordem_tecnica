<template>
  <div class="d-flex flex-column justify-content-center align-items-center min-vh-100 bg-light text-center p-4">
    <i class="bi bi-tools display-1 text-secondary mb-4"></i>

    <h1 class="h3 fw-bold mb-2">Página em Construção</h1>
    <p class="text-muted mb-4">
      Estamos trabalhando nesta funcionalidade.<br/>
      Volte em breve para ver as novidades!
    </p>

    <button class="btn btn-primary px-4" @click="router.back()">
      ← Voltar
    </button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>
