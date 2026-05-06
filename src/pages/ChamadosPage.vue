<template>
  <div class="app-container">
    
    <div class="header-fixed d-flex justify-content-between align-items-center px-3 px-md-5 py-2 shadow-sm">
      <img :src="logoPath" alt="Logo" class="header-logo" />
      <div class="user-info-header text-center flex-grow-1">
        <span class="user-label-tiny">Controle de Campo</span> 
      </div>
      <button @click="confirmarSair" class="btn-logout-header" title="Sair do Sistema">
        <i class="bi bi-box-arrow-right"></i>
      </button>
    </div>

    <div class="content-scrollable">
      <div class="content-wrapper">
        
        <div class="meta-card shadow-sm mb-4 animate-in">
          <div class="p-3 d-flex justify-content-between align-items-center">
            <div class="text-start">
              <span class="meta-label">RESUMO DO DIA</span>
              <div class="meta-value-group">
                <span class="meta-number">{{ totalConcluidos + chamados.length }}</span>
                <span class="meta-text">atendimentos totais</span>
              </div>
              <div class="meta-subtext">
                <span class="text-success">{{ totalConcluidos }} Concluídos</span> / 
                <span class="text-primary">{{ chamados.length }} pendentes</span>
              </div>
            </div>
            <div class="percent-chip">{{ porcentagemProgresso }}%</div>
          </div>
          <div class="progress-container">
            <div class="progress-fill" :style="{ width: porcentagemProgresso + '%' }"></div>
          </div>
        </div>

        <div class="search-box-clean mb-4 shadow-sm">
          <i class="bi bi-search text-muted ms-3"></i>
          <input v-model="filtro" type="text" placeholder="Procurar OS ou Cliente..." />
        </div>

        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border spinner-border-sm text-info opacity-50"></div>
        </div>

        <div v-else class="pb-list-custom">
          <div v-for="ch in chamadosFiltrados" :key="ch.nordem" 
               class="os-card shadow-sm mb-3 animate-in"
               :class="{ 'border-active': statuses[ch.nordem]?.emAndamento }"
               @click="irParaOrdem(ch.nordem)">
            
            <div class="p-3 text-start">
              <div class="d-flex justify-content-between align-items-start mb-2 border-bottom pb-2">
                <div class="d-flex align-items-center overflow-hidden">
                  <span class="os-num-display">{{ ch.nordem }}</span>
                  <span class="mx-2 text-muted opacity-50">|</span>
                  <h5 class="client-name text-truncate mb-0">{{ ch.cliente }}</h5>
                </div>
                <span class="status-pill" :class="statuses[ch.nordem]?.emAndamento ? 'st-active' : 'st-wait'">
                  {{ statuses[ch.nordem]?.emAndamento ? 'EM CURSO' : 'ABERTO' }}
                </span>
              </div>

              <div class="info-line-single mb-2">
                <span class="info-item"><i class="bi bi-calendar3 me-1"></i>{{ formatarData(ch.dataentrega) }}</span>
                <span class="info-item ms-3 text-orange"><i class="bi bi-clock me-1"></i>{{ ch.horario || '08:00' }}</span>
                <span class="info-item ms-3 solicitante-text text-truncate">
                   <i class="bi bi-person me-1"></i>{{ ch.solicitante || 'Não informado' }}
                </span>
              </div>
              
              <div class="defect-box mb-2">
                <span class="label-tiny-normal text-warning">DESCRIÇÃO DO PROBLEMA</span>
                <p class="defect-text mb-0 text-truncate-2">{{ ch.defeito || ch.servico }}</p>
              </div>
              
              <div class="d-flex justify-content-between align-items-center mt-2">
                <div class="address-text text-truncate pe-2">
                  <i class="bi bi-geo-alt-fill text-danger me-1"></i>
                  {{ ch.endereco }}, {{ ch.numero }} - {{ ch.bairro }}, {{ ch.cidade }}/{{ ch.uf }}
                </div>
                <button class="btn-map-circle" @click.stop="abrirMaps(ch)"><i class="bi bi-cursor-fill"></i></button>
              </div>
            </div>

            <div v-if="statuses[ch.nordem]?.emAndamento" class="footer-active">
               <span class="pulse-dot"></span> ATENDIMENTO EM CURSO
            </div>
            <div v-else class="footer-btn-area">
               <button class="btn-start" :disabled="temAtendimentoAtivo" @click.stop="prepararInicio(ch)">
                 INICIAR ATENDIMENTO
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="proximaOS" class="next-day-slim-footer shadow-sm animate-up">
      <div class="px-3 d-flex align-items-center h-100 overflow-hidden">
        <span class="label-next-slim">AMANHÃ:</span>
        <span class="info-next-slim text-truncate">
          {{ proximaOS.horario }} - {{ proximaOS.cliente }} - <span class="solicitante-next-bar">{{ proximaOS.solicitante }}</span> - {{ proximaOS.endereco }}, {{ proximaOS.numero }} ({{ proximaOS.cidade }}/{{ proximaOS.uf }})
        </span>
      </div>
    </div>

    <nav class="bottom-nav shadow-lg">
      <div class="nav-item active"><i class="bi bi-list-stars"></i><span>ORDENS</span></div>
      <div class="nav-item" @click="router.push('/historico')"><i class="bi bi-check-circle"></i><span>FEITOS</span></div>
      <div class="nav-item" @click="router.push('/menu')"><i class="bi bi-grid-fill"></i><span>PAINEL</span></div>
    </nav>

    <div v-if="modalAberto" class="modal-blur" @click.self="modalAberto = false">
      <div class="modal-card animate-up">
        <h5 class="mb-4 fw-normal">Confirmar início da OS {{ chamadoSelecionado?.nordem }}?</h5>
        <div class="d-grid gap-2">
           <button @click="executarInicioAtendimento" class="btn-modal-confirm py-3" :disabled="loadingBtn">
             <span v-if="loadingBtn" class="spinner-border spinner-border-sm me-2"></span> CONFIRMAR
           </button>
           <button @click="modalAberto = false" class="btn-modal-cancel py-3">Voltar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const logoPath = new URL('@/assets/logo.png', import.meta.url).href
const router = useRouter()
const chamados = ref([])
const proximaOS = ref(null)
const filtro = ref('')
const loading = ref(false)
const loadingBtn = ref(false)
const modalAberto = ref(false)
const chamadoSelecionado = ref(null)
const statuses = ref({})
const totalConcluidos = ref(0) 

const idFuncionario = localStorage.getItem('idFuncionario')
const API = localStorage.getItem('apiBase') || 'https://conexao.novaonlyne.com.br:31405/api/'

function formatarData(data) {
  if (!data) return '--/--';
  const partes = data.split('-');
  return partes.length < 3 ? data : `${partes[2]}/${partes[1]}`;
}

async function buscarAmanha() {
  try {
    const { data } = await axios.get(`${API}chamados.php?idfuncionario=${idFuncionario}&data=2026-04-15`);
    const lista = data.items || data;
    if (Array.isArray(lista) && lista.length > 0) {
      proximaOS.value = lista.sort((a,b) => (a.horario || '').localeCompare(b.horario || ''))[0];
    }
  } catch (e) { console.error(e); }
}

async function buscar() {
  loading.value = true
  try {
    const { data } = await axios.get(`${API}chamados.php`, { params: { idfuncionario: idFuncionario } })
    const lista = Array.isArray(data) ? data : Object.values(data || {})
    chamados.value = lista.map(c => ({ ...c, cliente: c.cliente || c.fantasia, servico: c.servico || c.descricao }))
    for (const c of chamados.value) { verificarStatus(c.nordem) }
    const resT = await axios.get(`${API}total_dia.php`, { params: { id: idFuncionario } })
    totalConcluidos.value = parseInt(resT.data?.total || 0)
  } catch (err) { console.error(err) } finally { loading.value = false }
}

async function verificarStatus(nordem) {
    try {
        const res = await axios.get(`${API}verificar_status.php`, { params: { nordem, idtecnico: idFuncionario } })
        statuses.value[nordem] = { emAndamento: res.data.emAndamento }
    } catch(e) {}
}

const chamadosFiltrados = computed(() => {
  const f = filtro.value.toLowerCase()
  return chamados.value.filter(c => (c.cliente || '').toLowerCase().includes(f) || (c.nordem || '').toString().includes(f))
})

const porcentagemProgresso = computed(() => {
    const total = chamados.value.length + totalConcluidos.value;
    return total === 0 ? 0 : Math.round((totalConcluidos.value / total) * 100);
})

const temAtendimentoAtivo = computed(() => Object.values(statuses.value).some(s => s.emAndamento))
const irParaOrdem = (id) => router.push(`/ordem/${id}`)
const abrirMaps = (ch) => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ch.endereco + ',' + ch.numero + ' ' + ch.cidade)}`)
const prepararInicio = (ch) => { chamadoSelecionado.value = ch; modalAberto.value = true; }

async function executarInicioAtendimento() {
  loadingBtn.value = true
  try {
    await axios.post(`${API}login_os.php`, { nordem: chamadoSelecionado.value.nordem, idtecnico: idFuncionario, acao: 'INICIAR' })
    modalAberto.value = false
    buscar()
  } catch (e) { alert("Erro ao iniciar."); } finally { loadingBtn.value = false }
}

const confirmarSair = () => { if (confirm("Deseja realmente sair?")) { localStorage.clear(); router.push('/') } }

onMounted(() => { buscar(); buscarAmanha(); })
</script>

<style scoped>
.app-container { background-color: #fcfdfe; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }

/* HEADER */
.header-fixed { background: white; z-index: 1000; border-bottom: 1px solid #f1f1f1; height: 60px; position: fixed; top: 0; width: 100%; }
.header-logo { height: 50px; }
.user-label-tiny { font-size: 0.55rem; color: #94a3b8; font-weight: 700; letter-spacing: 0.5px; }

/* CONTEÚDO SCROLLABLE */
.content-scrollable { flex: 1; overflow-y: auto; padding-top: 70px; padding-bottom: 110px; scrollbar-width: none; }
.content-wrapper { width: 70%; margin: 0 auto; }
@media (max-width: 800px) { .content-wrapper { width: 94%; } }

/* INFO LINE (DATA, HORA, SOLICITANTE) */
.info-line-single { display: flex; align-items: center; font-size: 0.85rem; color: #64748b; font-weight: 500; }
.text-orange { color: #f39c12; font-weight: 500; } /* Sem negrito conforme pedido */
.solicitante-text { flex: 1; text-transform: uppercase; font-weight: 400; color: #1e293b; }

/* RODAPÉ AMANHÃ SLIM */
.next-day-slim-footer { 
  position: fixed; bottom: 65px; left: 0; width: 100%; height: 35px;
  background: white; border-top: 1px solid #f39c12; z-index: 90;
  display: flex; align-items: center;
}
.label-next-slim { font-size: 0.65rem; color: #f39c12; font-weight: 800; margin-right: 8px; }
.info-next-slim { font-size: 0.7rem; color: #475569; font-weight: 500; }
.solicitante-next-bar { font-weight: 600; color: #1e293b; }

/* CARDS */
.meta-card { background: white; border-radius: 16px; border: 1px solid #f0f0f0; overflow: hidden; }
.meta-number { font-size: 1.8rem; font-weight: 800; color: #343a40; }
.percent-chip { background: #f0f9ff; color: #00A7CF; padding: 4px 12px; border-radius: 20px; font-weight: 800; }
.progress-container { height: 4px; background: #f1f5f9; width: 100%; }
.progress-fill { height: 100%; background: #00A7CF; transition: 1s; }

.search-box-clean { background: white; border-radius: 12px; border: 1px solid #f1f5f9; padding: 8px 0; display: flex; align-items: center; }
.search-box-clean input { border: none; outline: none; width: 100%; padding-left: 10px; font-size: 0.85rem; }

.os-card { background: white; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; }
.border-active { border-left: 5px solid #00A7CF !important; }
.client-name { font-size: 1rem; font-weight: 700; color: #1e293b; text-transform: uppercase; }
.os-num-display { font-size: 1rem; font-weight: 800; color: #00A7CF; }
.status-pill { font-size: 0.55rem; font-weight: 800; padding: 3px 8px; border-radius: 6px; }

/* DESCRIÇÃO DO PROBLEMA AJUSTADA (RESTAURADA E SEM NEGRITO) */
.defect-box { background-color: rgba(255, 243, 205, 0.4); border-left: 3px solid #ffc107; padding: 8px 10px; }
.defect-text { font-size: 0.92rem; color: #64748b; font-weight: 400; line-height: 1.4; } 
.label-tiny-normal { font-size: 0.62rem; font-weight: 400; color: #94a3b8; }

.address-text { font-size: 0.72rem; color: #94a3b8; }
.btn-start { width: 100%; background: white; color: #00A7CF; padding: 12px; border: none; font-size: 0.8rem; border-top: 1px solid #f1f5f9; }
.btn-map-circle { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; color: #ef4444; }

.bottom-nav { position: fixed; bottom: 0; left: 0; width: 100%; height: 65px; background: white; display: flex; justify-content: space-around; align-items: center; border-top: 1px solid #f1f5f9; z-index: 100; }
.nav-item { display: flex; flex-direction: column; align-items: center; color: #94a3b8; font-size: 0.55rem; }
.nav-item.active { color: #00A7CF; }

.modal-blur { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
.modal-card { background: white; width: 90%; max-width: 320px; border-radius: 20px; padding: 25px; text-align: center; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-in { animation: fadeInUp 0.5s ease forwards; }
.animate-up { animation: fadeInUp 0.3s ease-out; }

.pulse-dot { width: 8px; height: 8px; background: #00A7CF; border-radius: 50%; display: inline-block; margin-right: 5px; animation: pulse 1.5s infinite; }
@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
</style>