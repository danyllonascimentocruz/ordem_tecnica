<!-- src/layouts/LayoutDefault.vue -->
<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center p-4">
    <div class="w-full max-w-lg bg-white/90 backdrop-blur p-6 rounded-xl shadow-xl border border-gray-300">
      <slot />
    </div>
  </div>
</template>
