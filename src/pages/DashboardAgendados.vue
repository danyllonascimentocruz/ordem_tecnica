<template>
  <div class="header-fixed d-flex justify-content-between align-items-center px-3 px-md-5 py-2 shadow-sm">
    <img :src="logoPath" alt="Logo" class="header-logo" />
    
    <div class="user-info-header text-center flex-grow-1">
      <span class="user-label-tiny">Dashboard de Atendimento</span> 

    </div>

    <button @click="confirmarSair" class="btn-logout-header" title="Sair do Sistema">
      <i class="bi bi-box-arrow-right"></i>
    </button>
  </div>

  <div class="container py-3 pb-5 bg-white min-vh-100 mt-header">
    
    <div class="card shadow-sm mb-5 border-0 bg-light">
      <div class="card-Dashboard body p-3">
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div class="d-flex align-items-center gap-3">
            <label class="small fw-bold text-muted mb-0">DATA</label>
            <input v-model="selectedDate" type="date" class="form-control form-control-sm border-0 shadow-sm" style="width: 160px; font-weight: 400;" />
          </div>
          
          <button class="btn btn-primary btn-sm px-5 shadow-sm text-uppercase" :disabled="loading" @click="buscar">
            <i v-if="!loading" class="bi bi-search me-2"></i> 
            <span v-else class="spinner-border spinner-border-sm me-2"></span>
            Buscar
          </button>
        </div>
      </div>
    </div>

    <div v-if="!loading" class="row g-4">
      <div class="col-12 col-lg-9 order-2 order-lg-1">
        <div v-if="tecnicos.length === 0" class="text-center py-5 text-muted">
          Nenhuma ordem de serviço encontrada para este dia.
        </div>
        <div class="row g-3">
          <div v-for="tec in tecnicos" :key="tec.nome_tecnico + tec.tipo" class="col-12 col-md-6">
            <div class="card shadow-sm border-0 h-100 bg-white border-start-custom" :style="borderStyle(tec)">
              <div class="card-header bg-white border-bottom-0 pt-3 px-3 d-flex justify-content-between align-items-start">
                <div class="text-truncate" style="max-width: 80%;">
                  <h6 class="fw-bold mb-0 text-uppercase text-truncate" :style="nameStyle(tec)" style="font-size: 0.85rem;">{{ tec.nome_tecnico }}</h6>
                  <small class="text-muted fw-bold" style="font-size: 0.6rem;">{{ tec.tipo.toUpperCase() }}</small>
                </div>
                <span class="badge bg-dark rounded-pill" style="font-size: 0.65rem;">{{ tec.qtd }} OS</span>
              </div>

              <div class="card-body p-0 pb-3">
                <div v-for="bucket in tec.por_situacao" :key="bucket.situacao" class="px-3 pt-2">
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <span class="status-dot" :style="statusStyle(bucket.situacao)"></span>
                    <span class="small fw-bold text-uppercase text-muted" style="font-size: 0.65rem;">{{ bucket.situacao }}</span>
                  </div>

                  <div class="d-flex flex-column gap-2">
                    <div
                      v-for="ch in bucket.chamados"
                      :key="ch.nordem"
                      class="os-item p-2 rounded border"
                      :class="{'cursor-pointer': canManage}"
                      @click="handleOSClick(ch)"
                    >
                      <div class="fw-bold text-dark mb-1 d-flex justify-content-between align-items-center" style="font-size: 0.82rem;">
                        <span class="text-truncate"><span class="text-primary">#{{ ch.nordem }}</span> {{ ch.fantasia }}</span>
                        <i v-if="canManage" class="bi bi-pencil-square text-primary" style="font-size: 0.75rem;"></i>
                      </div>
                      <div class="d-flex gap-2 mb-1">
                        <span class="badge bg-light text-dark border py-1" style="font-size: 0.6rem;">{{ String(ch.horaini || '').slice(0, 5) }}</span>
                        <span v-if="ch.entrada" class="badge bg-success-subtle text-success border border-success py-1" style="font-size: 0.6rem;">Início: {{ ch.entrada }}</span>
                      </div>
                      <div class="text-muted text-truncate small" style="font-size: 0.7rem;">{{ ch.endereco }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-3 order-1 order-lg-2">
        <div class="sticky-top" style="top: 20px;">
          <div class="card shadow-sm border-0 mb-3 p-3 bg-light text-center rounded-4">
            <small class="text-muted fw-bold text-uppercase" style="font-size: 0.6rem;">Total de OS</small>
            <h2 class="fw-bold text-dark mb-2">{{ totalChamados }}</h2>
            <div class="d-flex justify-content-around border-top pt-2">
               <div><h6 class="mb-0 fw-bold text-primary">{{ tecnicos.length }}</h6><small class="text-muted" style="font-size: 0.55rem;">GRUPOS</small></div>
               <div><h6 class="mb-0 fw-bold text-info">{{ totalIniciados }}</h6><small class="text-muted" style="font-size: 0.55rem;">EM CURSO</small></div>
            </div>
          </div>

          <div class="card shadow-sm border-0 p-3 text-center mb-3 rounded-4">
            <h6 class="small fw-bold text-muted text-uppercase mb-2" style="font-size: 0.65rem;">Situação Geral</h6>
            <div style="height: 150px;">
              <Doughnut v-if="chartData.labels.length" :data="chartData" :options="miniChartOptions" />
            </div>
          </div>

          <div class="card shadow-sm border-0 p-3 bg-white rounded-4 border-top border-primary border-4">
             <h6 class="small fw-bold text-muted text-uppercase mb-3" style="font-size: 0.65rem;">
               <i class="bi bi-clock-history me-1 text-primary"></i> Almoço dos Técnicos
             </h6>
             <div v-if="almocoRecords.length === 0" class="text-center py-2 text-muted fst-italic" style="font-size: 0.7rem;">
               Nenhum registro hoje.
             </div>
             <div v-else class="d-flex flex-column gap-2">
               <div v-for="alm in almocoRecords" :key="alm.id_tecnico" class="p-2 border rounded-3 bg-light-subtle">
                 <div class="d-flex justify-content-between align-items-start">
                    <div class="fw-bold text-dark text-truncate text-uppercase" style="font-size: 0.7rem; max-width: 120px;">{{ alm.tecnico }}</div>
                    <span class="badge bg-dark text-white" style="font-size: 0.6rem;">Total: {{ calcularDuracao(alm.hora_inicio, alm.hora_fim) }}</span>
                 </div>
                 <div class="text-primary fw-bold mt-1" style="font-size: 0.72rem;">
                   {{ alm.hora_inicio }} <i class="bi bi-arrow-right mx-1 opacity-50"></i> {{ alm.hora_fim }}
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="modalVisible" class="modal-custom-overlay" @click.self="fecharModal">
      <div class="modal-custom-panel shadow-lg" style="max-width: 400px; width: 95%;">
        <div class="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
          <h6 class="mb-0 fw-bold">Editar OS #{{ editChamado?.nordem }}</h6>
          <button class="btn-close" @click="fecharModal"></button>
        </div>
        <div class="p-4 text-start">
          <div class="mb-3">
            <label class="small fw-bold text-muted mb-1">TÉCNICO</label>
            <select v-model="editTecId" class="form-select border-primary shadow-none fw-bold">
              <option :value="0">-- SEM TÉCNICO --</option>
              <option v-for="f in funcionarios" :key="'t'+f.id" :value="f.id">{{ f.nome }}</option>
            </select>
          </div>
          <div class="mb-4">
            <label class="small fw-bold text-muted mb-1">VENDEDOR</label>
            <select v-model="editVendId" class="form-select border-primary shadow-none fw-bold">
              <option :value="0">-- SEM VENDEDOR --</option>
              <option v-for="f in funcionarios" :key="'v'+f.id" :value="f.id">{{ f.nome }}</option>
            </select>
          </div>
          <button class="btn btn-primary w-100 fw-bold py-2 shadow-sm" :disabled="saving" @click="salvarReatribuicao">
            <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span> GRAVAR
          </button>
        </div>
      </div>
    </div>

    <div v-if="toastVisible" class="toast-custom shadow-lg">{{ toastMsg }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router'; // 🔵 Importado para o logout funcionar
import { api } from '@/services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'vue-chartjs';

ChartJS.register(ArcElement, Tooltip, Legend);

const router = useRouter(); // 🔵 Inicializado
const logoPath = new URL('@/assets/logo.png', import.meta.url).href;
const nomeUsuario = ref(localStorage.getItem('nomeUsuario') || 'Gestor'); // 🔵 Adicionado

// Funções de Saída
const sair = () => { localStorage.clear(); router.push('/') }
const confirmarSair = () => {
  if (confirm("Deseja realmente sair do sistema?")) {
    sair();
  }
}

// ... Resto do teu código original de busca e lógica do Dashboard ...
const selectedDate = ref(new Date().toISOString().slice(0, 10));
const tecnicos = ref([]);
const almocoRecords = ref([]);
const loading = ref(false);
const modalVisible = ref(false);
const saving = ref(false);
const editChamado = ref(null);
const editTecId = ref(0);
const editVendId = ref(0);
const funcionarios = ref([]);
const toastVisible = ref(false);
const toastMsg = ref('');

const canManage = computed(() => [30, 29, 14, 1].includes(Number(localStorage.getItem('idFuncionario') || '0')));
const totalChamados = computed(() => tecnicos.value.reduce((acc, t) => acc + Number(t.qtd || 0), 0));
const totalIniciados = computed(() => {
  let count = 0;
  tecnicos.value.forEach(t => t.por_situacao.forEach(b => {
    if(b.situacao.toLowerCase().includes('atendimento') || b.situacao.toLowerCase().includes('iniciado')) count += b.chamados.length;
  }));
  return count;
});

function calcularDuracao(ini, fim) {
  if (!ini || !fim) return "00:00";
  try {
    const [h1, m1] = ini.split(':').map(Number);
    const [h2, m2] = fim.split(':').map(Number);
    let totalMinutos = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (totalMinutos < 0) totalMinutos = 0;
    const h = Math.floor(totalMinutos / 60);
    const m = totalMinutos % 60;
    return `${h}h ${String(m).padStart(2, '0')}m`;
  } catch (e) { return "--:--"; }
}

const PALETTE = ['#0B5D66', '#0d6efd', '#6f42c1', '#fd7e14', '#20c997', '#d6336c'];
const colorMap = ref(new Map());

function rebuildColorMap(groups) {
  const map = new Map();
  groups.forEach((g, idx) => {
    const key = `${g.tipo}:${g.idtecnico ?? g.idvendedor ?? -1}`;
    map.set(key, PALETTE[idx % PALETTE.length]);
  });
  colorMap.value = map;
}

function nameStyle(tec) {
  const key = `${tec.tipo}:${tec.idtecnico ?? tec.idvendedor ?? -1}`;
  return { color: tec.tipo === 'sem' ? '#dc3545' : (colorMap.value.get(key) || '#0B5D66') };
}

function borderStyle(tec) { return { borderLeft: `5px solid ${nameStyle(tec).color}` }; }

const STATUS_COLORS = { 1: '#0d6efd', 2: '#20c997', 3: '#ffc107', 7: '#dc3545', 'default': '#adb5bd' };
function statusStyle(s) {
  const m = String(s || '').match(/^(\d+)/);
  return { background: STATUS_COLORS[m ? parseInt(m[1], 10) : 'default'] || STATUS_COLORS['default'] };
}

const chartData = computed(() => {
    const counts = {};
    tecnicos.value.forEach(tec => tec.por_situacao.forEach(b => counts[b.situacao] = (counts[b.situacao] || 0) + b.chamados.length));
    const labels = Object.keys(counts);
    return { labels, datasets: [{ backgroundColor: labels.map(l => statusStyle(l).background), data: Object.values(counts), borderWidth: 0 }] };
});

const miniChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '75%' };

async function buscar() {
  loading.value = true;
  try {
    const viewer = parseInt(localStorage.getItem('idFuncionario') || '0', 10);
    const { data } = await api.get("/agendados_por_dia.php", { params: { data: selectedDate.value, viewer } });
    if (data?.success) {
      tecnicos.value = (data.tecnicos || []).sort((a, b) => b.qtd - a.qtd);
      rebuildColorMap(tecnicos.value);
    }
    const { data: resAlm } = await api.get("/almoco_listar.php", { 
      params: { data_ini: selectedDate.value, data_fim: selectedDate.value } 
    });
    if (resAlm?.success) { almocoRecords.value = resAlm.items || []; }
  } catch (e) { console.error(e); } 
  finally { loading.value = false; }
}

async function carregarFuncionarios() {
  const { data } = await api.get("/get_funcionarios.php");
  if (data?.success) funcionarios.value = data.funcionarios.map(f => ({ id: Number(f.id || f.idfuncionario), nome: f.nome }));
}

function handleOSClick(ch) {
  if (!canManage.value) return;
  editChamado.value = ch; 
  editTecId.value = Number(ch.idtecnico || 0); 
  editVendId.value = Number(ch.idvendedor || 0);
  modalVisible.value = true; 
  if (funcionarios.value.length === 0) carregarFuncionarios(); 
}

function fecharModal() { modalVisible.value = false; }
function showToast(msg) { toastMsg.value = msg; toastVisible.value = true; setTimeout(() => toastVisible.value = false, 3000); }

async function salvarReatribuicao() {
  saving.value = true;
  try {
    const payload = { nordem: editChamado.value.nordem, idtecnico: Number(editTecId.value), idvendedor: Number(editVendId.value), viewer: localStorage.getItem('idFuncionario') };
    const { data } = await api.post("/atualizar_responsaveis.php", payload);
    if (data?.success) { showToast('Sucesso!'); fecharModal(); buscar(); } 
  } catch(e) { showToast('Erro de rede.'); } 
  finally { saving.value = false; }
}

onMounted(buscar);
</script>

<style scoped>
/* 🔵 ESTILOS DO HEADER FIXO */
.header-fixed { 
  background: white; 
  z-index: 1000; 
  border-bottom: 1px solid #f1f1f1;
  height: 60px;
  position: fixed; /* 🔵 Fixado no topo */
  top: 0;
  width: 100%;
}
.mt-header { margin-top: 60px; } /* 🔵 Espaço para o conteúdo não ficar atrás do header */

.header-logo { height: 50px; }
.user-label-tiny { font-size: 0.55rem; color: #94a3b8; font-weight: 700; letter-spacing: 0.5px; }
.user-name-display { font-size: 0.85rem; color: #1e293b; font-weight: 500; margin-left: 5px; }

.btn-logout-header {
  background: transparent; border: none; color: #94a3b8; font-size: 1.2rem; transition: 0.2s;
}
.btn-logout-header:hover { color: #ef4444; transform: scale(1.1); }

/* Estilos originais do Dashboard */
.status-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
.os-item { background: #fff; border: 1px solid #f2f2f2 !important; transition: all 0.2s; }
.cursor-pointer { cursor: pointer !important; }
.os-item:hover.cursor-pointer { border-color: #0d6efd !important; background-color: #f9fcff !important; transform: translateX(3px); }
.modal-custom-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 5000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal-custom-panel { background: #fff; border-radius: 12px; overflow: hidden; }
.border-start-custom { border-left: 5px solid #dee2e6; }
.toast-custom { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: #333; color: #fff; padding: 10px 25px; border-radius: 30px; z-index: 6000; font-size: 0.85rem; font-weight: bold; }

@media (min-width: 992px) { .sticky-top { top: 25px; } }
</style>