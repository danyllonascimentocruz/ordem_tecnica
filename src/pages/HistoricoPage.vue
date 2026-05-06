<template>
  <div class="bg-light-subtle min-vh-100 pb-5">
    
    <div class="header-fixed d-flex justify-content-between align-items-center px-3 px-md-5 py-2 shadow-sm">
      <img :src="logoPath" alt="Logo" class="header-logo" />
      
      <div class="user-info-header text-center flex-grow-1">
        <span class="user-label-tiny">Hstórico de Atendimentos</span> 

      </div>

      <button @click="confirmarSair" class="btn-logout-header" title="Sair do Sistema">
        <i class="bi bi-box-arrow-right"></i>
      </button>
    </div>

    <div class="container mt-header pt-3 px-2">
      
      <div class="text-center mb-4">
        <div class="premium-card p-4 shadow-sm border-0 d-inline-block w-100">
          <span class="label-mini text-primary d-block mb-1 text-uppercase">Total no Período</span>
          <div class="display-4 fw-black text-dark mb-0">{{ dash.total || 0 }}</div>
        </div>
      </div>

      <div class="row g-2 mb-4 align-items-end">
        <div class="col-5">
          <div class="filter-box shadow-sm">
            <label>INÍCIO</label>
            <input v-model="dataIni" type="date">
          </div>
        </div>
        <div class="col-5">
          <div class="filter-box shadow-sm">
            <label>FINAL</label>
            <input v-model="dataFim" type="date">
          </div>
        </div>
        <div class="col-2">
          <button @click="validarPeriodo" class="btn-lupa shadow-sm" :disabled="loading">
            <i v-if="!loading" class="bi bi-search"></i>
            <span v-else class="spinner-border spinner-border-sm"></span>
          </button>
        </div>
      </div>

      <div class="info-alert shadow-sm mb-4 animate-in">
        <div class="d-flex align-items-center p-2 px-3">
          <i class="bi bi-info-circle-fill text-primary me-2"></i>
          <span class="ultra-small text-muted">Limite de <strong>31 dias</strong> por consulta para maior velocidade.</span>
        </div>
      </div>

      <div class="d-flex flex-column gap-2 text-start mb-5">
        <h6 class="fw-bold text-muted x-small text-uppercase ps-1 mb-1">Ordens Localizadas</h6>
        
        <div v-for="ch in lista" :key="ch.nordem + ch.data" class="os-card shadow-sm animate-in" @click="verDetalhes(ch)">
          <div class="p-3">
            <div class="d-flex justify-content-between mb-1">
              <span class="badge-os">#{{ ch.nordem }}</span>
              <span class="text-muted ultra-small fw-bold">{{ formatarData(ch.data) }}</span>
            </div>
            <h5 class="fw-bold text-dark mb-1 small">{{ ch.fantasia }}</h5>
            <div class="ultra-small text-muted text-truncate">
              <i class="bi bi-geo-alt-fill text-danger"></i> {{ ch.endereco }}
            </div>
          </div>
        </div>
        
        <div v-if="!loading && lista.length === 0" class="text-center py-5 opacity-50">
          <i class="bi bi-binoculars h1 d-block mb-2"></i>
          <span class="small fw-bold">Clique na lupa para buscar.</span>
        </div>
      </div>

      <div v-if="dash.stats && dash.stats.length > 0" class="animate-in pb-4">
        <hr class="my-5 opacity-25">
        <div class="premium-card p-3 mb-3 shadow-sm border-0">
          <h6 class="fw-bold text-dark x-small text-start mb-3"><i class="bi bi-pie-chart-fill text-primary me-1"></i> DISTRIBUIÇÃO</h6>
          <div style="height: 250px; position: relative;"><Pie :data="chartData" :options="chartOptions" /></div>
        </div>

        <div class="premium-card p-3 shadow-sm border-0 text-start">
          <h6 class="fw-bold text-dark x-small mb-3"><i class="bi bi-trophy-fill text-warning me-1"></i> TOP 5 CLIENTES</h6>
          <div class="d-flex flex-column gap-2">
            <div v-for="(st, idx) in dash.stats.slice(0, 5)" :key="idx" class="d-flex align-items-center justify-content-between bg-light p-2 rounded-3">
              <div class="d-flex align-items-center gap-3">
                <span class="rank-num" :class="'rank-' + (idx + 1)">{{ idx + 1 }}º</span>
                <span class="small fw-bold text-dark text-truncate" style="max-width: 150px;">{{ st.cliente }}</span>
              </div>
              <span class="badge bg-white text-primary border rounded-pill">{{ st.qty }} OS</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Transition name="slide-up">
      <div v-if="showModal" class="sheet-overlay" @click.self="showModal = false">
        <div class="sheet-content">
          <div class="sheet-handle"></div>
          <div class="p-4 pt-2 text-start">
            <h5 class="fw-bold text-dark mb-1">{{ infoOS.cliente }}</h5>
            <div class="row g-2 mb-3">
              <div class="col-6"><div class="info-pill"><span class="label">PERÍODO</span><span class="val">{{ infoOS.horario }}</span></div></div>
              <div class="col-6"><div class="info-pill"><span class="label">TOTAL</span><span class="val">{{ infoOS.total }} hrs</span></div></div>
            </div>
            <div class="report-box">
              <label class="fw-bold x-small text-primary mb-1 d-block">REPARO:</label>
              <div class="small lh-sm text-dark">{{ infoOS.relato || 'Sem descrição.' }}</div>
            </div>
            <button class="btn btn-dark w-100 py-3 mt-4 rounded-4 fw-bold" @click="showModal = false">VOLTAR</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router'; // 🔵 Importado
import axios from 'axios';
import { API_URL } from '@/services/api';
import { Pie } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale);

const router = useRouter(); // 🔵 Inicializado
const loading = ref(false);
const showModal = ref(false);
const lista = ref([]);
const dash = ref({ total: 0, stats: [] });
const infoOS = ref({});

const dataIni = ref(new Date(new Date().setDate(new Date().getDate() - 15)).toISOString().split('T')[0]);
const dataFim = ref(new Date().toISOString().split('T')[0]);

const idFuncionario = parseInt(localStorage.getItem('idFuncionario'));
const nomeUsuario = ref(localStorage.getItem('nomeUsuario') || 'Técnico'); // 🔵 Adicionado
const logoPath = new URL('@/assets/logo.png', import.meta.url).href;

// 🔵 LOGICA DE SAÍDA
const sair = () => { localStorage.clear(); router.push('/') }
const confirmarSair = () => {
  if (confirm("Deseja realmente sair do sistema?")) {
    sair();
  }
}

function validarPeriodo() {
  const d1 = new Date(dataIni.value);
  const d2 = new Date(dataFim.value);

  if (d2 < d1) {
    alert("A data final não pode ser menor que a inicial.");
    dataFim.value = dataIni.value;
    return;
  }

  const diffDays = Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
  if (diffDays > 31) {
    alert("Período máximo de 31 dias.");
    const novaData = new Date(d1);
    novaData.setDate(novaData.getDate() + 30);
    dataFim.value = novaData.toISOString().split('T')[0];
  }
  
  buscar();
}

async function buscar() {
  loading.value = true;
  try {
    const { data } = await axios.get(`${API_URL}/historico_dash.php`, { 
      params: { idfuncionario: idFuncionario, data_ini: dataIni.value, data_fim: dataFim.value } 
    });
    if (data && !data.error) {
      lista.value = data.lista || [];
      dash.value = data;
    } else {
      lista.value = [];
      dash.value = { total: 0, stats: [] };
    }
  } catch (e) { console.error(e); } 
  finally { loading.value = false; }
}

async function verDetalhes(ch) {
  loading.value = true;
  try {
    const { data } = await axios.get(`${API_URL}/detalhes_historico.php`, { 
      params: { nordem: ch.nordem, data: ch.data } 
    });
    infoOS.value = data;
    showModal.value = true;
  } catch (e) { alert("Erro ao carregar"); } 
  finally { loading.value = false; }
}

const formatarData = (d) => { if (!d) return ''; const p = d.split('-'); return `${p[2]}/${p[1]}`; };
const chartData = computed(() => ({
  labels: dash.value.stats?.map(s => s.cliente) || [],
  datasets: [{
    data: dash.value.stats?.map(s => s.qty) || [],
    backgroundColor: ['#00A7CF', '#007bff', '#6610f2', '#e83e8c', '#fd7e14', '#20c997', '#ffc107', '#28a745'],
    borderWidth: 2, borderColor: '#ffffff'
  }]
}));

const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { size: 10, weight: 'bold' } } } } };

onMounted(buscar);
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
.mt-header { margin-top: 60px; } /* 🔵 Compensação do Header */

.header-logo { height: 50px; }
.user-label-tiny { font-size: 0.55rem; color: #94a3b8; font-weight: 700; letter-spacing: 0.5px; }
.user-name-display { font-size: 0.85rem; color: #1e293b; font-weight: 500; margin-left: 5px; }

.btn-logout-header {
  background: transparent; border: none; color: #94a3b8; font-size: 1.2rem; transition: 0.2s;
  display: flex; align-items: center;
}
.btn-logout-header:hover { color: #ef4444; transform: scale(1.1); }

/* Estilos originais do Histórico */
.fw-black { font-weight: 900; }
.label-mini { font-size: 0.55rem; font-weight: 800; letter-spacing: 1px; }
.x-small { font-size: 0.65rem; }
.ultra-small { font-size: 0.55rem; }

.premium-card { background: white; border-radius: 20px; border: 1px solid rgba(0,0,0,0.04); }
.os-card { background: white; border-radius: 16px; border: 1px solid rgba(0,0,0,0.05); cursor: pointer; transition: 0.2s; }

.btn-lupa {
  width: 100%; height: 48px; background: #00A7CF; color: white; border: none; border-radius: 14px;
  display: flex; align-items: center; justify-content: center; font-size: 1.2rem; transition: 0.2s;
}
.btn-lupa:active { transform: scale(0.9); background: #008eb0; }
.btn-lupa:disabled { background: #ccc; }

.filter-box { background: white; border-radius: 14px; padding: 6px 10px; border: 1px solid #eee; text-align: left; }
.filter-box label { display: block; font-size: 0.45rem; font-weight: 800; color: #999; }
.filter-box input { border: none; width: 100%; font-size: 0.8rem; font-weight: 700; outline: none; background: transparent; }

.info-alert { background: #f0f9ff; border-radius: 15px; border: 1px solid #e0f2fe; }
.badge-os { font-size: 0.6rem; font-weight: 800; color: #00A7CF; background: #e0f4f9; padding: 2px 8px; border-radius: 6px; }

.sheet-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); z-index: 9999; }
.sheet-content { position: absolute; bottom: 0; left: 0; right: 0; background: white; border-radius: 30px 30px 0 0; }
.sheet-handle { width: 40px; height: 4px; background: #e2e8f0; border-radius: 10px; margin: 12px auto; }
.info-pill { background: #f8fafc; padding: 10px; border-radius: 14px; border: 1px solid #f1f5f9; }
.info-pill .label { display: block; font-size: 0.45rem; font-weight: 800; color: #94a3b8; }
.info-pill .val { font-size: 0.8rem; font-weight: 700; color: #1e293b; }
.report-box { background: #fcfcfc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 15px; }

.rank-num { width: 24px; height: 24px; font-size: 0.65rem; font-weight: 900; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; }
.rank-1 { background: #FFD700; } .rank-2 { background: #C0C0C0; } .rank-3 { background: #CD7F32; } .rank-4, .rank-5 { background: #adb5bd; }

@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.slide-up-enter-active { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.animate-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>