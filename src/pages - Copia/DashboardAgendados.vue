<template>
  <div class="container py-4">
    <h2 class="h5 fw-bold mb-3">Dashboard — Agendados por Técnico</h2>

    <!-- Filtros -->
    <div class="d-flex align-items-center gap-2 flex-wrap mb-3">
      <input v-model="selectedDate" type="date" class="form-control" style="width: 180px" />
      <button class="btn btn-outline-secondary" @click="setToday">Hoje</button>
      <button class="btn btn-primary" :disabled="loading" @click="buscar">
        <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
        Buscar
      </button>
    </div>

    <!-- Resumo -->
    <div class="d-flex align-items-center gap-2 mb-3">
      <span class="badge text-bg-primary">Grupos: {{ tecnicos.length }}</span>
      <span class="badge text-bg-info">OS totais: {{ totalChamados }}</span>
    </div>

    <!-- Sem dados -->
    <div v-if="!loading && tecnicos.length === 0" class="alert alert-secondary">
      Nenhum chamado encontrado para {{ fmtDateBR(selectedDate) }}.
    </div>

    <!-- Cards -->
    <div class="row g-3">
      <div
        v-for="tec in tecnicos"
        :key="tec.tipo + '-' + (tec.idtecnico ?? tec.idvendedor ?? 'sem')"
        class="col-12 col-lg-6"
      >
        <div class="card shadow-sm">
          <div class="card-body">
            <!-- Cabeçalho -->
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div class="d-flex flex-column">
                <span class="tec-name" :style="nameStyle(tec)">
                  {{ tec.nome_tecnico }}
                </span>
                <small class="text-muted">
                  <template v-if="tec.tipo === 'tecnico'">
                    Técnico • ID: {{ tec.idtecnico ?? '—' }}
                  </template>
                  <template v-else-if="tec.tipo === 'vendedor'">
                    Vendedor • ID: {{ tec.idvendedor ?? '—' }}
                  </template>
                  <template v-else>
                    Sem responsável
                  </template>
                </small>
              </div>
              <span class="badge rounded-pill text-bg-info">{{ tec.qtd }}</span>
            </div>

            <!-- Buckets -->
            <div v-for="bucket in tec.por_situacao" :key="bucket.situacao" class="mb-2">
              <div class="d-flex align-items-center gap-2 mb-2">
                <span class="badge" :style="statusStyle(bucket.situacao)">
                  {{ bucket.situacao }}
                </span>
                <small class="text-muted">({{ bucket.chamados.length }})</small>
              </div>

              <ul class="list-group list-group-flush os-list">
                <li
                  v-for="ch in bucket.chamados"
                  :key="ch.nordem"
                  class="list-group-item d-flex justify-content-between align-items-start"
                >
                  <div class="me-3">
                    <div class="fw-semibold">#{{ ch.nordem }} — {{ ch.fantasia }}</div>
                    <div class="small text-muted">
                      {{ fmtDateBR(ch.dataentrega) }} • {{ fmtHora(ch.horaini) }} •
                      {{ ch.endereco }}
                    </div>
                  </div>

                  <!-- Reatribuir (apenas 29/30) -->
                  <button
                    v-if="canManage"
                    class="btn btn-sm btn-outline-primary"
                    @click="abrirReatribuicao(ch)"
                    :disabled="saving"
                    title="Reatribuir técnico / vendedor"
                  >
                    <i class="bi bi-pencil-square"></i>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div> <!-- col -->
    </div> <!-- row -->

    <!-- Modal Reatribuir -->
    <div v-if="modalVisible" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Reatribuir OS #{{ editChamado?.nordem }}</h5>
            <button type="button" class="btn-close" :disabled="saving" @click="fecharModal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Técnico</label>
              <select v-model="editTecId" class="form-select">
                <option :value="null">— Sem técnico —</option>
                <option v-for="f in funcionarios" :key="f.id" :value="f.id">
                  {{ f.nome }}
                </option>
              </select>
            </div>
            <div class="mb-2">
              <label class="form-label">Vendedor</label>
              <select v-model="editVendId" class="form-select">
                <option :value="null">— Sem vendedor —</option>
                <option v-for="f in funcionarios" :key="'v'+f.id" :value="f.id">
                  {{ f.nome }}
                </option>
              </select>
            </div>
            <div class="form-text">Dica: deixe em branco (— Sem —) para remover a atribuição.</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" :disabled="saving" @click="fecharModal">Cancelar</button>
            <button class="btn btn-primary" :disabled="saving" @click="salvarReatribuicao">
              <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
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
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const API_URL = 'https://conexao.novaonlyne.com.br:31405/api/'   // domínio externo

const selectedDate = ref(new Date().toISOString().slice(0, 10))
const tecnicos      = ref([])
const loading       = ref(false)

/* ACL (só 29/30 podem reatribuir) */
const canManage = computed(() => {
  const id = Number(localStorage.getItem('idFuncionario') || '0')
  return id === 29 || id === 30
})

/* ===== Cores por responsável (sem colisão visível) ===== */
const RESERVED_SEM = '#dc3545' // sem responsável
// Paleta grande, exclui o vermelho reservado:
const PALETTE = [
  '#0d6efd', '#2f9e44', '#ae3ec9', '#f08c00', '#12b886', '#228be6', '#be4bdb', '#e67700',
  '#0ca678', '#3b5bdb', '#d6336c', '#20c997', '#7048e8', '#37b24d', '#f59f00', '#15aabf',
  '#845ef7', '#51cf66', '#4dabf7', '#e8590c', '#099268', '#1c7ed6', '#e64980', '#66d9e8'
]
const colorMap = ref(new Map())

function hashString (s) {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}
function groupKey (tec) {
  // técnico:id  | vendedor:id  | sem:-1
  return `${tec.tipo}:${tec.idtecnico ?? tec.idvendedor ?? -1}`
}
function rebuildColorMap (groups) {
  const map = new Map()
  const used = new Set()
  // chaves estáveis
  const keys = groups.map(g => groupKey(g)).sort()

  for (const key of keys) {
    if (key.startsWith('sem')) {
      map.set(key, RESERVED_SEM)
      used.add(RESERVED_SEM)
      continue
    }
    // índice sugerido pelo hash
    let idx = hashString(key) % PALETTE.length
    // avança até achar cor livre
    for (let i = 0; i < PALETTE.length; i++) {
      const candidate = PALETTE[(idx + i) % PALETTE.length]
      if (!used.has(candidate)) {
        map.set(key, candidate)
        used.add(candidate)
        break
      }
    }
    // fallback (não deve acontecer com palette grande)
    if (!map.has(key)) map.set(key, PALETTE[0])
  }
  colorMap.value = map
}
function nameStyle (tec) {
  const key = groupKey(tec)
  const color = colorMap.value.get(key) || (tec.tipo === 'sem' ? RESERVED_SEM : '#0d6efd')
  return { color }
}

/* Helpers UI */
function setToday () {
  selectedDate.value = new Date().toISOString().slice(0, 10)
}
function fmtDateBR (yyyy_mm_dd) {
  if (!yyyy_mm_dd) return '—'
  const [y, m, d] = String(yyyy_mm_dd).split('T')[0].split('-')
  if (!y || !m || !d) return yyyy_mm_dd
  return `${d}/${m}/${y}`
}
function fmtHora (hhmmss) {
  if (!hhmmss) return '—'
  return String(hhmmss).slice(0, 5)
}

/* Totais */
const totalChamados = computed(() => {
  const s = new Set()
  tecnicos.value.forEach(t =>
    (t.por_situacao || []).forEach(b =>
      (b.chamados || []).forEach(ch => s.add(String(ch.nordem)))
    )
  )
  return s.size
})

/* Cores por status 1..9 */
const STATUS_COLORS = {
  1: { bg: '#0d6efd', text: '#fff' },
  2: { bg: '#20c997', text: '#fff' },
  3: { bg: '#ffc107', text: '#212529' },
  4: { bg: '#fd7e14', text: '#212529' },
  5: { bg: '#198754', text: '#fff' },
  6: { bg: '#6f42c1', text: '#fff' },
  7: { bg: '#dc3545', text: '#fff' },
  8: { bg: '#0dcaf0', text: '#212529' },
  9: { bg: '#343a40', text: '#fff' },
}
function statusStyle (situacao) {
  const s = String(situacao || '')
  const m = s.match(/^(\d+)/)
  const code = m ? parseInt(m[1], 10) : NaN
  const c = STATUS_COLORS[code]
  if (c) return { background: c.bg, color: c.text, border: '1px solid rgba(0,0,0,.12)' }
  return { background: '#adb5bd', color: '#212529' }
}

/* Toast */
const toastVisible = ref(false)
const toastMsg     = ref('')
let toastTimer     = null
function showToast (msg, ms = 2500) {
  toastMsg.value = msg
  toastVisible.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastVisible.value = false), ms)
}

/* Buscar */
async function buscar () {
  loading.value = true
  try {
    const viewer = parseInt(localStorage.getItem('idFuncionario') || '0', 10)
    const { data } = await axios.get(`${API_URL}agendados_por_dia.php`, {
      params: { data: selectedDate.value, viewer }
    })
    if (data?.success) {
      tecnicos.value = Array.isArray(data.tecnicos) ? data.tecnicos : []
      rebuildColorMap(tecnicos.value) // <- monta cores sem colisão para o conjunto atual
    } else {
      tecnicos.value = []
      colorMap.value = new Map()
      if (data?.message) showToast(data.message)
    }
  } catch {
    tecnicos.value = []
    colorMap.value = new Map()
    showToast('Erro ao carregar dashboard.')
  } finally {
    loading.value = false
  }
}

/* ===== Reatribuição ===== */
const modalVisible  = ref(false)
const saving        = ref(false)
const editChamado   = ref(null)
const editTecId     = ref(null)
const editVendId    = ref(null)
const funcionarios  = ref([])

async function carregarFuncionarios () {
  if (funcionarios.value.length) return
  try {
    const viewer = parseInt(localStorage.getItem('idFuncionario') || '0', 10)
    const { data } = await axios.get(`${API_URL}get_funcionarios.php`, { params: { viewer } })
    if (data?.success) {
      const rows = Array.isArray(data.funcionarios) ? data.funcionarios : []
      funcionarios.value = rows
        .map(f => ({ id: Number(f.id ?? f.ID ?? 0), nome: String(f.nome ?? f.NOME ?? '') }))
        .filter(x => x.id && x.nome)
    } else {
      funcionarios.value = []
    }
  } catch {
    funcionarios.value = []
    showToast('Não foi possível carregar a lista de funcionários.')
  }
}

function abrirReatribuicao (ch) {
  if (!canManage.value) return
  editChamado.value = ch
  editTecId.value  = null
  editVendId.value = null
  modalVisible.value = true
  carregarFuncionarios()
}

function fecharModal () {
  if (saving.value) return
  modalVisible.value = false
  editChamado.value  = null
  editTecId.value    = null
  editVendId.value   = null
}

async function salvarReatribuicao () {
  if (!editChamado.value) return
  try {
    saving.value = true
    const viewer = parseInt(localStorage.getItem('idFuncionario') || '0', 10)
    const payload = {
      viewer,
      nordem: Number(editChamado.value.nordem),
      idtecnico: editTecId.value === null ? null : Number(editTecId.value),
      idvendedor: editVendId.value === null ? null : Number(editVendId.value),
    }
    const { data } = await axios.post(`${API_URL}atualizar_responsaveis.php`, payload, {
      headers: { 'Content-Type': 'application/json' }
    })
    if (data?.success) {
      showToast(data.message || 'Reatribuído com sucesso.')
      fecharModal()
      await buscar()
    } else {
      showToast(data?.message || 'Falha ao reatribuir.')
    }
  } catch {
    showToast('Erro ao salvar reatribuição.')
  } finally {
    saving.value = false
  }
}

onMounted(buscar)
</script>

<style scoped>
/* ===== Compacto ===== */
.card { margin-bottom: .75rem; }
.card-body { padding: .75rem 1rem; }

/* Nome do responsável, cor via style */
.tec-name {
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: 0.2px;
  margin-bottom: 0;
  font-size: 1.25rem;
}

.badge { line-height: 1; }

/* Lista de OS mais enxuta */
.os-list { margin: 0; }
.os-list .list-group-item {
  padding: .35rem 0;
  border: 0;
  border-top: 1px solid #ececec;
}
.os-list .list-group-item:first-child { border-top: 0; }

.os-list .fw-semibold { font-size: .93rem; }
.os-list .small { margin-top: .1rem; }

@media (max-width: 576px) {
  .row.g-3 { --bs-gutter-y: .75rem; }
}

/* Toast auto-hide */
[role="toast"] { animation: fadeout 2.5s forwards; }
@keyframes fadeout { 0%{opacity:1} 85%{opacity:1} 100%{opacity:0} }
</style>
