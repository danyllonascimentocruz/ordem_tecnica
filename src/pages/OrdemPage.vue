<template>
  <div class="bg-light-subtle min-vh-100 pb-5">
    
    <div class="header-fixed d-flex justify-content-between align-items-center px-3 px-md-5 py-2 shadow-sm">
      <img :src="logoPath" alt="Logo" class="header-logo" />
      
      <div class="user-info-header text-center flex-grow-1">
        <span class="user-label-tiny">Registrar Conclusão Técnica</span> 
      </div>

      <button @click="confirmarSair" class="btn-logout-header" title="Sair do Sistema">
        <i class="bi bi-box-arrow-right"></i>
      </button>
    </div>

    <div class="container-app animate-in mt-header">
      
      <div class="text-center py-4">
   
        <span class="ultra-small text-muted">OS #{{ ordem.nordem }}</span>
      </div>

      <div class="premium-card shadow-sm p-3 mb-3 border-0">
        <div class="d-flex align-items-start gap-3 mb-3">
          <div class="icon-avatar"><i class="bi bi-building"></i></div>
          <div class="overflow-hidden text-start">
            <h6 class="client-name text-truncate mb-0">{{ ordem.fantasia }}</h6>
            <div class="ultra-small text-secondary text-uppercase">Solicitante: {{ ordem.solicitante }}</div>
          </div>
        </div>
        
        <div class="info-grid">
          <div class="info-cell">
            <span class="info-label">ID INTERNO</span>
            <span class="info-val">{{ ordem.idordem }}</span>
          </div>
          <div class="info-cell">
            <span class="info-label">LOCALIZAÇÃO</span>
            <span class="info-val text-truncate">{{ ordem.endereco }}</span>
          </div>
        </div>
      </div>

      <div class="premium-card shadow-sm p-3 mb-3 border-0 text-start">
        <div class="label-cyan">PROBLEMA RELATADO</div>
        <p class="defeito-text mb-0 mt-1">{{ ordem.defeito }}</p>
      </div>

      <div class="premium-card shadow-sm p-3 mb-4 border-0 text-start">
        <div class="label-cyan mb-3">REGISTRO TÉCNICO</div>
        
        <div class="mb-3">
          <label class="input-label">DATA DO SERVIÇO</label>
          <input v-model="ordem.data" type="date" class="form-input-clean input-disabled" readonly />
        </div>

        <div class="row g-2 mb-3">
          <div class="col-6">
            <label class="input-label">INÍCIO</label>
            <input v-model="ordem.horaini" type="time" class="form-input-clean" />
          </div>
          <div class="col-6">
            <label class="input-label">TÉRMINO</label>
            <input v-model="ordem.horafim" type="time" class="form-input-clean" />
          </div>
        </div>

        <div class="duration-box d-flex align-items-center justify-content-between" :class="{'bg-danger-subtle text-danger': erroHorario}">
          <span class="ultra-small fw-bold">TEMPO TOTAL</span>
          <span class="duration-val">{{ erroHorario ? 'INVÁLIDO' : (ordem.horatot || '--:--') }}</span>
        </div>

        <div class="mt-4">
          <label class="input-label">RELATÓRIO DE REPARO <span class="text-danger">*</span></label>
          <textarea 
            v-model="ordem.reparo" 
            class="form-input-clean mt-1" 
            rows="4" 
            placeholder="Descreva o que foi realizado..."
          ></textarea>
        </div>
      </div>

      <div class="d-flex gap-2 px-1 mb-5 pb-5">
        <button class="btn-gray flex-grow-1" @click="router.back()">VOLTAR</button>
        <button class="btn-primary-action flex-grow-1 shadow-sm" @click="confirmarFinalizacao">FINALIZAR OS</button>
      </div>
    </div>

    <nav class="bottom-nav shadow-lg">
      <div class="d-flex justify-content-around align-items-center h-100">
        <div class="nav-item" @click="router.push('/chamados')"><i class="bi bi-grid"></i><span>Chamados</span></div>
        <div class="nav-item" @click="router.push('/historico')"><i class="bi bi-clock-history"></i><span>Histórico</span></div>
        <div class="nav-item" @click="sair"><i class="bi bi-power"></i><span>Sair</span></div>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { API_URL } from '@/services/api'

const route = useRoute()
const router = useRouter()
const idFuncionario = ref(parseInt(localStorage.getItem('idFuncionario')))
const nomeUsuario = ref(localStorage.getItem('nomeUsuario') || 'Técnico') // 🔵 Adicionado fallback
const logoPath = new URL('@/assets/logo.png', import.meta.url).href

// 🔵 LOGICA DE SAÍDA COM CONFIRMAÇÃO (HEADER)
const confirmarSair = () => {
  if (confirm("Deseja realmente sair do sistema?")) {
    sair();
  }
}

const ordem = ref({
  idordem: '', nordem: route.params.id, fantasia: '—', solicitante: '—',
  defeito: '—', endereco: '—', data: '', horaini: '', horafim: '', horatot: '', reparo: ''
})

const loading = ref(true)

const erroHorario = computed(() => {
  if (!ordem.value.horaini || !ordem.value.horafim) return false
  const t1 = parseInt(ordem.value.horaini.replace(':', ''))
  const t2 = parseInt(ordem.value.horafim.replace(':', ''))
  return t1 > t2
})

function pad(n) { return n.toString().padStart(2, '0') }

function calcularDiferenca(ini, fim) {
  if (!ini || !fim) return ''
  const [h1, m1] = ini.split(':').map(Number)
  const [h2, m2] = fim.split(':').map(Number)
  const t1 = h1 * 60 + m1, t2 = h2 * 60 + m2
  if (t2 <= t1) return ''
  const d = t2 - t1
  return `${pad(Math.floor(d / 60))}:${pad(d % 60)}`
}

watch(() => [ordem.value.horaini, ordem.value.horafim], ([i, f]) => { 
  ordem.value.horatot = calcularDiferenca(i, f) 
})

const carregarOrdem = async () => {
  loading.value = true
  try {
    const { data: resp } = await axios.get(`${API_URL}/ordem_detalhe.php`, { params: { nordem: route.params.id } })
    const raw = resp?.success ? (resp.item || resp.data || resp) : resp
    
    ordem.value = {
      idordem: raw.idordem ?? raw.IDORDEM ?? '',
      nordem: raw.nordem ?? raw.NORDEM ?? route.params.id,
      fantasia: raw.nomecliente ?? raw.NOMECLIENTE ?? raw.fantasia ?? raw.FANTASIA ?? '—',
      solicitante: raw.solicitante ?? raw.SOLICITANTE ?? '—',
      defeito: raw.defeito ?? raw.DEFEITO ?? '—',
      endereco: (raw.endereco || raw.ENDERECO || '') + (raw.numero ? ', ' + raw.numero : ''),
      data: new Date().toISOString().split('T')[0],
      horaini: raw.horaini || '',
      horafim: new Date().toTimeString().slice(0, 5),
      horatot: '', reparo: ''
    }
  } catch (e) { console.error(e) } finally { loading.value = false }
}

const confirmarFinalizacao = async () => {
  if (erroHorario.value) return alert('A hora de início não pode ser maior que a hora de término.')
  if (!ordem.value.reparo.trim()) return alert('Descreva o reparo realizado.')

  try {
    await axios.post(`${API_URL}/ordem_detalhe.php`, {
      nordem: ordem.value.nordem, idordem: ordem.value.idordem, reparo: ordem.value.reparo,
      data: ordem.value.data, horaini: ordem.value.horaini, horafin: ordem.value.horafim,
      idtecnico: idFuncionario.value, tecnico: nomeUsuario.value
    })
    router.replace('/chamados')
  } catch { alert('Erro ao finalizar.') }
}

function sair() { localStorage.clear(); router.push('/') }
onMounted(carregarOrdem)
</script>

<style scoped>
/* 🔵 ESTILOS DO HEADER FIXO PADRONIZADO */
.header-fixed { 
  background: white; 
  z-index: 1000; 
  border-bottom: 1px solid #f1f1f1;
  height: 60px;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
}
.mt-header { margin-top: 60px; } 

.header-logo { height: 50px; }
.user-label-tiny { font-size: 0.55rem; color: #94a3b8; font-weight: 700; letter-spacing: 0.5px; }
.user-name-display { font-size: 0.85rem; color: #1e293b; font-weight: 500; margin-left: 5px; }

.btn-logout-header {
  background: transparent; border: none; color: #94a3b8; font-size: 1.2rem; transition: 0.2s;
  display: flex; align-items: center;
}
.btn-logout-header:hover { color: #ef4444; transform: scale(1.1); }

/* Estilos originais da página */
.container-app { max-width: 500px; margin: 0 auto; padding-bottom: 80px; }
.ultra-small { font-size: 0.58rem; letter-spacing: 0.8px; }

.premium-card { background: white; border-radius: 16px; border: 1px solid rgba(0,0,0,0.02) !important; }
.icon-avatar { width: 38px; height: 38px; background: #e0f4f9; color: #00A7CF; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1rem; }
.client-name { font-size: 0.9rem; font-weight: 500; color: #1e293b; }

.info-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 15px; margin-top: 10px; border-top: 1px solid #f8fafc; padding-top: 10px; }
.info-label { display: block; font-size: 0.5rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
.info-val { font-size: 0.72rem; color: #475569; font-weight: 400; }

.label-cyan { font-size: 0.52rem; font-weight: 700; color: #00A7CF; text-transform: uppercase; letter-spacing: 0.5px; }
.defeito-text { font-size: 0.72rem; color: #64748b; line-height: 1.5; font-weight: 400; }

.input-label { font-size: 0.58rem; font-weight: 600; color: #94a3b8; margin-bottom: 3px; display: block; }
.form-input-clean { background: #f8fafc; border: 1.5px solid #f1f5f9; border-radius: 12px; padding: 10px; font-size: 0.82rem; width: 100%; outline: none; transition: 0.2s; color: #475569; }
.form-input-clean:focus { border-color: #00A7CF; background: white; }
.input-disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }

.duration-box { background: #e0f4f9; color: #00A7CF; padding: 12px 15px; border-radius: 12px; transition: 0.3s; }
.duration-val { font-size: 0.85rem; font-weight: 500; }

.btn-primary-action { background: #00A7CF; color: white; border: none; border-radius: 14px; font-size: 0.75rem; font-weight: 500; padding: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
.btn-gray { background: #f1f5f9; color: #64748b; border: none; border-radius: 14px; font-size: 0.75rem; font-weight: 500; padding: 14px; text-transform: uppercase; }

.bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; height: 65px; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-top: 1px solid #f1f5f9; }
.nav-item { display: flex; flex-direction: column; align-items: center; color: #94a3b8; font-size: 0.6rem; font-weight: 500; }
.nav-item i { font-size: 1.2rem; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-in { animation: fadeIn 0.4s ease-out; }
</style>