<template>
  <div class="d-flex flex-column align-items-center bg-light min-vh-100 py-4">
    <div class="w-100" style="max-width: 500px">
      <!-- cabeçalho -->
      <div class="text-center mb-4">
        <h1 class="h4 fw-bold mb-1">Nova Onlyne - Serviços</h1>
        <p class="text-muted mb-0">
          Bem-vindo, <span class="fw-semibold">{{ nomeUsuario }}</span>
        </p>
      </div>

      <!-- cartão com opções -->
      <div class="card shadow-sm border-0">
        <div class="card-body">
          <h2 class="h6 text-center mb-4">Escolha uma opção</h2>

          <div class="d-grid gap-3">
            <button class="btn btn-primary py-3 fw-semibold" @click="router.push('/chamados')">
              📋 Chamados
            </button>

            <!-- ORÇAMENTOS (expande 2 opções) -->
            <button
              class="btn btn-success py-3 fw-semibold d-flex justify-content-between align-items-center"
              @click="toggleOrcamentos"
            >
              <span>💰 Orçamentos</span>
              <span class="ms-2">{{ orcamentosAberto ? '▲' : '▼' }}</span>
            </button>

            <div v-if="orcamentosAberto" class="border rounded p-3 bg-white">
              <div class="d-grid gap-2">
                <button class="btn btn-outline-success py-2 fw-semibold" @click="router.push('/orcamento')">
                  ➕ Novo
                </button>
                <button class="btn btn-outline-success py-2 fw-semibold" @click="router.push('/EdicaoOrca')">
                  🕘 Histórico
                </button>
              </div>
            </div>

            <!-- Lançamentos -->
            <button class="btn btn-info py-3 fw-semibold text-white" @click="router.push('/periodos')">
              ⏱️ Lançamentos
            </button>

            <!-- Dashboard só para 29 e 30 -->
            <button
              v-if="canSeeDashboard"
              class="btn btn-outline-primary py-3 fw-semibold"
              @click="router.push('/dashboard-agendados')"
            >
              📊 Dashboard Agendados
            </button>

            <button
              v-if="canSeeDashboard"
              class="btn btn-outline-primary py-3 fw-semibold"
              @click="router.push('/calendario-agendados')"
            >
              🗓️ Calendário Agendados
            </button>
          </div>
        </div>
      </div>

      <!-- sair -->
      <div class="text-center mt-4">
        <button class="btn btn-danger btn-sm" @click="logout">
          Sair
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const nomeUsuario = ref(localStorage.getItem('nomeUsuario') || '')

// Permissão dashboard
const canSeeDashboard = computed(() => {
  const id = Number(localStorage.getItem('idFuncionario') || '0')
  return id === 29 || id === 30
})

// Expande/fecha opções de orçamento
const orcamentosAberto = ref(false)
function toggleOrcamentos () {
  orcamentosAberto.value = !orcamentosAberto.value
}

function logout () {
  if (!confirm('Deseja realmente sair?')) return
  localStorage.clear()
  router.replace('/login')
}
</script>
