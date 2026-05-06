<template>
  <div class="d-flex flex-column align-items-center">
    <img :src="logoPrincipal" alt="Logo principal" class="mb-3" style="max-width: 150px;" />
    <img :src="logoSecundaria" alt="Logo secundária" style="max-width: 120px;" />
  </div>
</template>

<script>
export default {
  name: 'Logo',
  data() {
    return {
      logoPrincipal: new URL('@/assets/logo.png', import.meta.url).href,
      logoSecundaria: new URL('@/assets/logocinza.png', import.meta.url).href
    }
  }
}
</script>

<style scoped>
/* Estilos adicionais se quiser */
</style>
