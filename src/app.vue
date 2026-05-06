<template>
  <!-- Conteúdo principal -->
  <RouterView />

  <!-- Footer: oculto em /login -->
  <BottomNav v-if="!route.path.startsWith('/login')" />
</template>

<script setup>
import { useRoute } from 'vue-router'
import BottomNav    from '@/components/BottomNav.vue'

const route = useRoute()
</script>

<!-- adiciona um padding para o conteúdo não ficar embaixo do footer -->
<style>
body {
  padding-bottom: 4rem; /* ≈ altura do BottomNav */
}
</style>
