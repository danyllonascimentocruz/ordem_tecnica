<template>
  <div class="d-flex flex-column align-items-center bg-light min-vh-100 py-4">
    <div class="w-100" style="max-width: 560px">
      <!-- Botão Voltar -->
      <button
        class="btn btn-outline-secondary btn-sm mb-3"
        @click="router.back()"
      >
        ← Voltar
      </button>

      <h2 class="h5 text-center mb-3">Ordem {{ ordem.nordem }}</h2>

      <!-- Carregando -->
      <div v-if="loading" class="text-center text-muted">Carregando…</div>

      <!-- Erro -->
      <div v-else-if="erro" class="alert alert-danger">{{ erro }}</div>

      <!-- Conteúdo -->
      <div v-else class="card shadow-sm border-0">
        <div class="card-body">
          <div class="mb-2"><strong>ID da Ordem:</strong> {{ ordem.idordem }}</div>
          <div class="mb-2"><strong>Cliente:</strong> {{ ordem.fantasia }}</div>
          <div class="mb-2"><strong>Solicitante:</strong> {{ ordem.solicitante }}</div>
          <div class="mb-2"><strong>Defeito:</strong> {{ ordem.defeito }}</div>
          <div class="mb-2"><strong>Endereço:</strong> {{ ordem.endereco }}</div>
          <div class="mb-3">
  <label class="form-label mb-1"><small>Data do Atendimento</small></label>
  <input
    v-model="ordem.data"
    type="date"
    class="form-control form-control-sm"
  />
</div>


          <!-- Horários -->
          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="form-label mb-1"><small>Hora Início</small></label>
              <input
                v-model="ordem.horaini"
                type="time"
                class="form-control form-control-sm"
              />
            </div>
            <div class="col-6">
              <label class="form-label mb-1"><small>Hora Fim</small></label>
              <input
                v-model="ordem.horafim"
                type="time"
                class="form-control form-control-sm"
              />
            </div>
            <div class="col-12">
              <label class="form-label mb-1"><small>Tempo Total</small></label>
              <input
                :value="ordem.horatot"
                readonly
                class="form-control form-control-sm bg-light"
              />
            </div>
          </div>

          <!-- Campo Descrição do Reparo -->
          <div class="mb-4">
            <label class="form-label">Descrição do Reparo <span class="text-danger">*</span></label>
            <textarea
              v-model="ordem.reparo"
              class="form-control"
              rows="3"
              placeholder="Descreva o reparo realizado"
              required
            ></textarea>
          </div>

          <!-- Botões -->
          <div class="d-flex justify-content-center gap-2">
            <button class="btn btn-secondary" @click="router.back()">Cancelar</button>
            <button
              class="btn text-white"
              style="background:#04A5D1;border-color:#04A5D1"
              @click="confirmarFinalizacao"
            >
              Finalizar Atendimento
            </button>
          </div>
        </div>
      </div>

      <!-- Modal de confirmação -->
      <div
        v-if="confirmarVisible"
        class="modal d-block"
        tabindex="-1"
        style="background: rgba(0,0,0,0.5)"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Confirmar Finalização</h5>
              <button type="button" class="btn-close" @click="confirmarVisible = false"></button>
            </div>
            <div class="modal-body">
              <p>Você está finalizando a OS <strong>{{ ordem.nordem }}</strong> para o cliente <strong>{{ ordem.fantasia }}</strong>.</p>
              <p>Data: <strong>{{ formatarData(ordem.data) }}</strong></p>
              <p>Horário: <strong>{{ ordem.horaini }}</strong> → <strong>{{ ordem.horafim }}</strong></p>
              <p>Tempo Total: <strong>{{ ordem.horatot || '—' }}</strong></p>
              <p>Deseja realmente finalizar esta ordem?</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="confirmarVisible = false">Cancelar</button>
              <button class="btn btn-primary" @click="finalizar">Confirmar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Toast -->
      <div
        class="toast position-fixed bottom-0 start-50 translate-middle-x mb-4"
        :class="{ show: toastVisible }"
      >
        <div class="toast-header">
          <strong class="me-auto">Nova Onlyne</strong>
          <button type="button" class="btn-close" @click="toastVisible = false"></button>
        </div>
        <div class="toast-body">{{ toastMsg }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const API_URL = 'https://conexao.novaonlyne.com.br:31405/api/'

const route  = useRoute()
const router = useRouter()

const nomeUsuario   = ref(localStorage.getItem('nomeUsuario') || '')
const idFuncionario = ref(parseInt(localStorage.getItem('idFuncionario')))

const ordem = ref({
  idordem    : '',
  nordem     : route.params.id,
  fantasia   : '—',
  solicitante: '—',
  defeito    : '—',
  endereco   : '—',
  data       : '—',
  horaini    : '',
  horafim    : new Date().toTimeString().slice(0, 5),
  horatot    : '',
  reparo     : ''
})

const loading      = ref(true)
const erro         = ref('')
const toastVisible = ref(false)
const toastMsg     = ref('')
const confirmarVisible = ref(false)

function formatarData(dataISO) {
  if (!dataISO) return '—'
  const [ano, mes, dia] = dataISO.split('-')
  return `${dia}/${mes}/${ano}`
}

function pad(n) {
  return n.toString().padStart(2, '0')
}

function diffTime(ini, fim) {
  if (!ini || !fim) return ''
  const [h1, m1] = ini.split(':').map(Number)
  const [h2, m2] = fim.split(':').map(Number)
  const t1 = h1 * 60 + m1
  const t2 = h2 * 60 + m2
  if (t2 <= t1) return ''
  const diff = t2 - t1
  return `${pad(Math.floor(diff / 60))}:${pad(diff % 60)}`
}

watch(
  () => [ordem.value.horaini, ordem.value.horafim],
  ([ini, fim]) => { ordem.value.horatot = diffTime(ini, fim) }
)

const carregar = async () => {
  loading.value = true
  try {
  const { data: resp } = await axios.get(`${API_URL}ordem_detalhe.php`, {
  params: { nordem: route.params.id }
})

    // Compatível com:
    // 1) { success, item, ... }
    // 2) { success, data, ... }
    // 3) objeto direto (legacy)
    const raw = resp?.success ? (resp.item || resp.data || resp) : resp

    if (!raw || typeof raw !== 'object') {
      throw new Error('Ordem não encontrada.')
    }

    const idordem = raw.idordem ?? raw.IDORDEM ?? ''
    const nordem  = raw.nordem  ?? raw.NORDEM  ?? route.params.id
    const nomeCli = raw.nomecliente ?? raw.NOMECLIENTE ?? raw.fantasia ?? raw.FANTASIA ?? '—'
    const solicit = raw.solicitante ?? raw.SOLICITANTE ?? '—'
    const defeito = raw.defeito ?? raw.DEFEITO ?? '—'
    const end = raw.endereco ?? raw.ENDERECO ?? ''
    const num = raw.numero ?? raw.NUMERO ?? ''
    const cid = raw.cidade ?? raw.CIDADE ?? ''
    const enderecoFmt = [end, num].filter(Boolean).join(', ') + (cid ? `, ${cid}` : '')

    ordem.value = {
      idordem    : idordem,
      nordem     : nordem,
      fantasia   : nomeCli,
      solicitante: solicit,
      defeito    : defeito,
      endereco   : enderecoFmt || '—',
      data       : new Date().toISOString().split('T')[0],
      horaini    : '',
      horafim    : new Date().toTimeString().slice(0, 5),
      horatot    : '',
      reparo     : ''
    }
  } catch (e) {
    erro.value = e.message || 'Erro ao carregar a ordem.'
  } finally {
    loading.value = false
  }
}

const confirmarFinalizacao = () => {
  if (!ordem.value.reparo.trim()) {
    return alert('Preencha o campo "Descrição do Reparo" antes de finalizar.')
  }

  if (!ordem.value.horaini || !ordem.value.horafim) {
    return alert('Preencha os horários de início e fim.')
  }

  if (ordem.value.horaini === ordem.value.horafim) {
    return alert('Hora de início e fim não podem ser iguais.')
  }

  const [h1, m1] = ordem.value.horaini.split(':').map(Number)
  const [h2, m2] = ordem.value.horafim.split(':').map(Number)

  if ((h1 * 60 + m1) > (h2 * 60 + m2)) {
    return alert('Hora de início não pode ser maior que a hora de fim.')
  }

  confirmarVisible.value = true
}

const finalizar = async () => {
  try {
    const { data } = await axios.post(`${API_URL}ordem_detalhe.php`, {
      nordem            : ordem.value.nordem,
      idordem           : ordem.value.idordem,
      reparo            : ordem.value.reparo,
      data              : ordem.value.data,
      horaini           : ordem.value.horaini,
      horafin           : ordem.value.horafim,
      ordemEmAtendimento: ordem.value.nordem,
      idtecnico         : idFuncionario.value,
      tecnico           : nomeUsuario.value
    })

    if (!data?.success) {
      throw new Error(data?.message || 'Falha ao finalizar atendimento.')
    }

    localStorage.removeItem(`atendimento_${ordem.value.nordem}`)
    toastMsg.value = 'Atendimento finalizado com sucesso!'
    toastVisible.value = true
    confirmarVisible.value = false

    setTimeout(() => router.replace('/chamados'), 2000)
  } catch {
    alert('Erro ao finalizar atendimento.')
  }
}

onMounted(carregar)
</script>