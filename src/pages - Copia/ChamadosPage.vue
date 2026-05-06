<template>
  <div class="d-flex flex-column align-items-center bg-light min-vh-100 py-4">
    <div class="w-100" style="max-width: 480px">
      <!-- Barra superior -->
      <div class="d-flex justify-content-between mb-3">
        <button class="btn btn-danger btn-sm text-white px-4 py-1 fs-6" @click="logout">
          Sair
        </button>
      </div>

      <!-- Logo centralizado -->
      <div class="text-center mb-3">
        <img
          :src="logoPath"
          alt="Logo Nova Onlyne"
          class="img-fluid"
          style="max-width: 350px; max-height: 200px; object-fit: contain;"
        />
      </div>

      <!-- Cabeçalhos -->
      <h2 class="h5 text-center mb-1">Bem-vindo , {{ nomeUsuario }}</h2>
      <h3 class="h6 text-muted text-center mb-3">Chamados em Aberto</h3>

      <!-- Carregando -->
      <div v-if="loading" class="text-center text-muted">Carregando…</div>

      <!-- Lista -->
      <div v-else-if="chamados.length" class="list-group">
        <div
          v-for="(chamado, i) in chamados"
          :key="chamado.nordem"
          class="list-group-item list-group-item-action"
          role="button"
          @click="abrir(chamado)"
        >
          <div class="d-flex align-items-start gap-3">
            <span class="badge text-bg-info rounded-pill">{{ i + 1 }}</span>
            <div class="flex-grow-1">
              <div class="fw-semibold">Ordem: {{ chamado.nordem }}</div>
            </div>
          </div>

          <div class="mt-2">
            <div><strong>Cliente:</strong> {{ chamado.fantasia || '—' }}</div>
            <div><strong>Solicitante:</strong> {{ chamado.solicitante || '—' }}</div>
            <div><strong>Defeito:</strong> {{ chamado.defeito || '—' }}</div>
            <div><strong>Endereço:</strong> {{ chamado.endereco || '—' }}</div>
            <div><strong>Data:</strong> {{ chamado.dataentrega || '—' }}</div>
            <div><strong>Hora:</strong> {{ chamado.horaini || '—' }}</div>
          </div>

          <!-- Botão iniciar atendimento (somente no primeiro item) -->
          <div v-if="i === 0" class="d-flex justify-content-center mt-3">
            <!-- Verificando status -->
            <button
              v-if="statuses[chamado.nordem]?.loading"
              class="btn btn-sm btn-secondary px-4"
              disabled
              @click.stop
            >
              Verificando status…
            </button>

            <!-- Pode iniciar -->
            <button
              v-else-if="!statuses[chamado.nordem]?.alreadyStarted"
              class="btn btn-sm text-white px-4"
              style="background:#04A5D1;border-color:#04A5D1"
              @click.stop="confirmarInicio(chamado)"
              :disabled="isInFlight(chamado.nordem)"
            >
              <span v-if="isInFlight(chamado.nordem)">Enviando…</span>
              <span v-else>Iniciar Atendimento</span>
            </button>

            <!-- Já iniciado -->
            <button v-else class="btn btn-sm btn-secondary px-4" disabled @click.stop>
              Atendimento em andamento
            </button>
          </div>
        </div>
      </div>

      <!-- Sem registros -->
      <div v-else class="text-center text-muted">Nenhum chamado em aberto.</div>
    </div>

    <!-- Modal de confirmação -->
    <div v-if="confirmarVisible" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirmar Início</h5>
            <button type="button" class="btn-close" :disabled="confirmLoading" @click="fecharModal"></button>
          </div>
          <div class="modal-body">
            <p>
              Deseja realmente iniciar o atendimento para
              <strong>{{ chamadoSelecionado?.fantasia || 'cliente' }}</strong>?
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" :disabled="confirmLoading" @click="fecharModal">Cancelar</button>
            <button class="btn btn-primary" :disabled="confirmLoading" @click="confirmarInicioReal">
              <span v-if="confirmLoading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              <span v-if="confirmLoading">Confirmando…</span>
              <span v-else>Confirmar</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast simples -->
    <div
      v-if="toastVisible"
      role="toast"
      class="position-fixed bottom-0 start-50 translate-middle-x mb-3 px-3 py-2 bg-dark text-white rounded"
      style="z-index: 1080;"
    >
      {{ toastMsg }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

/* ==================== Config / Helpers ==================== */
const logoPath = new URL('@/assets/logocinza.png', import.meta.url).href
const API_URL  = 'https://conexao.novaonlyne.com.br:31405/api/'

const router        = useRouter()
const idFuncionario = ref(parseInt(localStorage.getItem('idFuncionario')))
const nomeUsuario   = ref(localStorage.getItem('nomeUsuario') || '')

const chamados      = ref([])
const loading       = ref(false)

/* Toast */
const toastVisible  = ref(false)
const toastMsg      = ref('')
let toastTimer      = null
function showToast(msg, ms = 2500) {
  toastMsg.value = msg
  toastVisible.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastVisible.value = false }, ms)
}

/* Status por OS */
const statuses = ref({}) // { [nordem]: { loading, alreadyStarted, lastStart? } }

/* Locks por OS (evita requests duplicados) */
const inFlightByOrder = ref(new Map())
const confirmLoading = ref(false)
function setInFlight(ordem, val) {
  const m = new Map(inFlightByOrder.value)
  if (val) m.set(ordem, true); else m.delete(ordem)
  inFlightByOrder.value = m
}
function isInFlight(ordem) {
  return inFlightByOrder.value.has(ordem)
}

/* Idempotency key */
function newIdempotencyKey() {
  return (Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)).toUpperCase()
}

/* ==================== API Calls ==================== */
async function carregarStatus(nordem) {
  statuses.value[nordem] = { loading: true, alreadyStarted: false }
  try {
    const { data } = await axios.post(`${API_URL}status_atendimento.php`, {
      idtecnico: idFuncionario.value,
      nordem
    }, { headers: { 'X-Idempotency-Key': newIdempotencyKey() } })

    if (data?.success) {
      statuses.value[nordem] = {
        loading: false,
        alreadyStarted: !!data.alreadyStarted,
        lastStart: data.lastStart || null
      }
    } else {
      statuses.value[nordem] = { loading: false, alreadyStarted: false }
    }
  } catch {
    statuses.value[nordem] = { loading: false, alreadyStarted: false }
  }
}

const buscar = async () => {
  loading.value = true
  try {
    const { data } = await axios.get(`${API_URL}chamados.php`, {
      params: { idfuncionario: idFuncionario.value }
    })

    // Normalização
    chamados.value = (Array.isArray(data) ? data : Object.values(data)).map(r => ({
      nordem      : r.nordem      || r.NORDEM,
      fantasia    : r.fantasia    || r.nomecliente || r.owcliente,
      solicitante : r.solicitante || r.solicitante || '—',
      defeito     : r.defeito     || r.descricao   || '—',
      endereco    : [r.endereco, r.numero, r.complemento, r.cidade].filter(Boolean).join(', ') || '—',
      dataentrega : r.dataentrega || '—',
      horaini     : r.horaini     || '—'
    }))

    await Promise.all(chamados.value.map(ch => carregarStatus(ch.nordem)))
  } catch {
    alert('Erro ao buscar chamados')
  } finally {
    loading.value = false
  }
}

/* Navegar */
const abrir = chamado => {
  const currentRoute = router.currentRoute.value
  if (currentRoute.name === 'ordem' && currentRoute.params.id === String(chamado.nordem)) return
  router.push({ name: 'ordem', params: { id: String(chamado.nordem) } })
}

/* Modal */
const confirmarVisible = ref(false)
const chamadoSelecionado = ref(null)

function confirmarInicio(chamado) {
  if (isInFlight(chamado.nordem)) return
  chamadoSelecionado.value = chamado
  confirmarVisible.value = true
}

function fecharModal() {
  if (confirmLoading.value) return
  confirmarVisible.value = false
  chamadoSelecionado.value = null
}

async function confirmarInicioReal() {
  if (!chamadoSelecionado.value) return
  await iniciarAtendimento(chamadoSelecionado.value)
}

/* Iniciar atendimento (com lock + idempotência) */
async function iniciarAtendimento(chamado) {
  const ordem = chamado.nordem
  if (isInFlight(ordem)) return

  try {
    confirmLoading.value = true
    setInFlight(ordem, true)

    const now  = new Date()
    const data = now.toISOString().split('T')[0]            // AAAA-MM-DD
    const hora = now.toTimeString().slice(0, 8)             // HH:MM:SS (com segundos)

    const { data: resp } = await axios.post(`${API_URL}iniciar_atendimento.php`,
      {
        idtecnico: idFuncionario.value,
        data,
        hora,
        nordem: ordem
      },
      {
        headers: { 'X-Idempotency-Key': newIdempotencyKey() }
      }
    )

    if (resp?.alreadyStarted) {
      showToast(resp.message || 'Atendimento já iniciado hoje por este técnico.')
    } else if (resp?.success || resp?.ok) {
      showToast(resp.message || `Atendimento iniciado para ${chamado.fantasia || 'cliente'}`)
      // Marca visual (opcional; fonte da verdade é o back)
      statuses.value[ordem] = { ...(statuses.value[ordem] || {}), alreadyStarted: true, loading: false }
    } else {
      alert(resp?.message || 'Falha ao iniciar atendimento')
    }

    confirmarVisible.value = false
    chamadoSelecionado.value = null

    // Recarrega status da OS
    await carregarStatus(ordem)
  } catch (e) {
    alert('Falha ao iniciar atendimento')
  } finally {
    confirmLoading.value = false
    setInFlight(ordem, false)
  }
}

/* Logout */
function logout () {
  if (!confirm('Deseja realmente sair?')) return
  router.replace('/login')
}

onMounted(buscar)
</script>

<style scoped>
/* Toast com auto-hide */
[role="toast"] { animation: fadeout 2.5s forwards; }
@keyframes fadeout { 0%{opacity:1} 85%{opacity:1} 100%{opacity:0} }
</style>
