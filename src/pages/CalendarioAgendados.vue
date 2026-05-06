<template>
  <div class="main-bg min-vh-100 d-flex flex-column">
    
    <div class="header-fixed d-flex justify-content-between align-items-center px-3 px-md-5 py-2 shadow-sm">
      <img :src="logoPath" alt="Logo" class="header-logo" />
      
      <div class="user-info-header text-center flex-grow-1">
        <span class="user-label-tiny">Agendamentos do Dia</span> 
      
      </div>

      <button @click="confirmarSair" class="btn-logout-header" title="Sair do Sistema">
        <i class="bi bi-box-arrow-right"></i>
      </button>
    </div>

    <div class="mt-header">
      <div class="legend-row d-flex justify-content-center gap-3 my-3 px-2 animate-in">
        <div v-for="it in legendItems" :key="it.label" class="legend-item">
          <span class="dot-status" :style="{ background: it.color }"></span>
          <span class="label-status">{{ it.label }}</span>
        </div>
      </div>

      <div class="filter-bar-clean mx-auto mb-3 shadow-sm rounded-4 bg-white p-2" style="width: 90%;">
        <div class="row g-2 align-items-end">
          <div class="col-md-5 d-flex gap-2 align-items-end">
            <div class="flex-grow-1 text-start">
              <label class="label-input">INÍCIO DA SEMANA</label>
              <input v-model="dataDe" type="date" class="input-flat" @change="alinharSemana" />
            </div>
            <button class="btn-search-blue shadow-sm" @click="buscar" :disabled="loading">
              <i v-if="!loading" class="bi bi-search"></i>
              <div v-else class="spinner-border spinner-border-sm"></div>
            </button>
          </div>
          <div class="col-md-7 d-flex justify-content-end gap-2">
            <button class="btn-nav-flat" @click="semanaAnterior">← Anterior</button>
            <button class="btn-nav-today" @click="semanaAtual">Hoje</button>
            <button class="btn-nav-flat" @click="proximaSemana">Próxima →</button>
          </div>
        </div>
      </div>
    </div>

    <div class="calendar-wrapper mx-auto flex-grow-1 mb-5" style="width: 95%;">
      <div class="week-grid-auto">
        <div class="day-column-clean" v-for="d in diasSemana" :key="d.data">
          <div class="day-header-flat" :class="{ 'is-today': eHoje(d.data) }">
            <div class="day-name">{{ d.rotulo }}</div>
            <div class="day-date">{{ formatarDataBR(d.data) }}</div>
          </div>
          
          <div class="day-body-content p-2">
            <div v-if="!getProfissionaisDoDia(d.data).length" class="empty-state">Sem agendamentos</div>
            
            <div v-for="nome in getProfissionaisDoDia(d.data)" :key="nome" class="tec-block mb-3 shadow-sm">
              <div class="tec-name-header" :style="getTecnicoStyle(nome)">
                {{ nome }}
              </div>
              <div class="os-list-inner p-1">
                <div v-for="os in agrupados[d.data][nome]" :key="os.NORDEM" class="os-card-flat" @click="abrirDetalhe(os.NORDEM)">
                  <div class="status-indicator" :style="{ background: statusColor(os.SITUACAO) }"></div>
                  <div class="os-info-flat p-2 flex-grow-1 text-start">
                    <div class="os-title-text">#{{ os.NORDEM }} — {{ os.NOMECLIENTE }}</div>
                    <div class="os-time-tag mt-1">{{ formatarHora(os.HORA_AGENDADA) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <footer class="footer-dashboard shadow-lg px-4 d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center gap-4 flex-grow-1 overflow-hidden">
        <span class="label-resumo">RESUMO DA SEMANA:</span>
        <div class="d-flex gap-3">
          <div v-for="(total, status) in resumoStatus" :key="status" class="stat-item-slim">
            <div class="d-flex align-items-center gap-1">
               <span class="stat-value-slim">{{ total }}</span>
               <span class="stat-label-slim">{{ status }}</span>
            </div>
            <div class="progress-track-slim">
              <div class="progress-fill-slim" :style="{ background: statusColor(status), width: calcularPorcentagem(total) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="total-final-slim">
        TOTAL DA SEMANA <span class="badge-total-slim">{{ linhas.length }}</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { api } from "@/services/api";

const router = useRouter();
const dataDe = ref("");
const dataAte = ref("");
const linhas = ref([]);
const loading = ref(false);
const logoPath = new URL('@/assets/logo.png', import.meta.url).href;
const nomeUsuario = ref(localStorage.getItem('nomeUsuario') || 'Gestor'); // 🔵 Adicionado

// 🔵 LOGICA DE SAÍDA
const sair = () => { localStorage.clear(); router.push('/') }
const confirmarSair = () => {
  if (confirm("Deseja realmente sair do sistema?")) {
    sair();
  }
}

const legendItems = [
  { label: "1.Atendimento", color: "#3CB371" }, 
  { label: "2.Agendamento", color: "#00A7CF" },
  { label: "3.Nao Atendida", color: "#DC143C" }, 
  { label: "Concluida", color: "#333" }
];

const tecnicoPalettes = [
  { bg: '#e0f2fe', text: '#0369a1', border: '#0ea5e9' },
  { bg: '#dcfce7', text: '#15803d', border: '#22c55e' },
  { bg: '#fef3c7', text: '#b45309', border: '#f59e0b' },
  { bg: '#f3e8ff', text: '#7e22ce', border: '#a855f7' },
  { bg: '#fee2e2', text: '#b91c1c', border: '#ef4444' },
  { bg: '#ffedd5', text: '#c2410c', border: '#f97316' },
  { bg: '#e0e7ff', text: '#4338ca', border: '#6366f1' },
  { bg: '#fae8ff', text: '#a21caf', border: '#d946ef' }
];

const getTecnicoStyle = (nome) => {
  let hash = 0;
  for (let i = 0; i < nome.length; i++) hash = nome.charCodeAt(i) + ((hash << 5) - hash);
  const index = Math.abs(hash) % tecnicoPalettes.length;
  const p = tecnicoPalettes[index];
  return { backgroundColor: p.bg, color: p.text, borderBottom: `2px solid ${p.border}` };
};

const statusColor = (s) => legendItems.find(i => i.label === s)?.color || "#adb5bd";

const calcularPorcentagem = (valor) => {
  const total = linhas.value.length;
  return total > 0 ? (valor / total) * 100 : 0;
};

const agrupados = computed(() => {
  const map = {};
  diasSemana.value.forEach(d => map[d.data] = {});
  linhas.value.forEach(os => {
    const dia = os.DATAENTREGA;
    const nome = os.PROFISSIONAL_NOME || "NÃO DEFINIDO";
    if (map[dia]) {
      if (!map[dia][nome]) map[dia][nome] = [];
      map[dia][nome].push(os);
    }
  });
  return map;
});

const getProfissionaisDoDia = (dia) => {
  if (!agrupados.value[dia]) return [];
  return Object.keys(agrupados.value[dia]).sort();
};

const resumoStatus = computed(() => {
  const counts = {};
  linhas.value.forEach(it => { counts[it.SITUACAO] = (counts[it.SITUACAO] || 0) + 1; });
  return counts;
});

async function buscar() {
  loading.value = true;
  try {
    const { data } = await api.get("agendados_por_periodo_tecnico.php", { 
      params: { data_ini: dataDe.value, data_fim: dataAte.value } 
    });
    if (data.success) {
      linhas.value = data.items || [];
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

const diasSemana = computed(() => {
  if (!dataDe.value) return [];
  const start = new Date(dataDe.value + 'T00:00:00');
  return ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].map((rotulo, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i);
    return { rotulo, data: d.toISOString().split('T')[0] };
  });
});

function setSemana(d) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.setDate(diff));
  dataDe.value = mon.toISOString().split('T')[0];
  const fri = new Date(mon); fri.setDate(mon.getDate() + 4);
  dataAte.value = fri.toISOString().split('T')[0];
}

const alinharSemana = () => { setSemana(new Date(dataDe.value + 'T00:00:00')); buscar(); };
const semanaAtual = () => { setSemana(new Date()); buscar(); };
const semanaAnterior = () => { const d = new Date(dataDe.value + 'T00:00:00'); d.setDate(d.getDate() - 7); setSemana(d); buscar(); };
const proximaSemana = () => { const d = new Date(dataDe.value + 'T00:00:00'); d.setDate(d.getDate() + 7); setSemana(d); buscar(); };

const formatarDataBR = (v) => v ? v.split('-').reverse().join('/') : '';
const formatarHora = (v) => v ? v.substring(0, 5) : "--:--";
const eHoje = (d) => d === new Date().toISOString().split('T')[0];
const abrirDetalhe = (nordem) => router.push({ name: 'ordem', params: { id: String(nordem) } });

onMounted(() => { setSemana(new Date()); buscar(); });
</script>

<style scoped>
.main-bg { background-color: #f1f5f9; font-family: 'Inter', sans-serif; }

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

/* Filtros */
.legend-item { display: flex; align-items: center; gap: 6px; }
.dot-status { width: 8px; height: 8px; border-radius: 50%; }
.label-status { font-size: 0.65rem; color: #64748b; font-weight: 500; }

.filter-bar-clean { background: white; border-radius: 12px; }
.input-flat { border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 12px; font-size: 0.8rem; outline: none; background: #fff; width: 100%; height: 38px; }
.label-input { font-size: 0.5rem; font-weight: 700; color: #94a3b8; display: block; margin-bottom: 2px; }
.btn-search-blue { background: #00A7CF; color: white; border: none; border-radius: 8px; width: 45px; height: 38px; display: flex; align-items: center; justify-content: center; }

/* Grid e Calendário */
.calendar-wrapper { overflow-x: auto; padding-bottom: 120px; }
.week-grid-auto { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; min-width: 1100px; }

.day-column-clean { background: #fff; border-radius: 16px; border: 1px solid rgba(0,0,0,0.02); display: flex; flex-direction: column; height: fit-content; }
.day-header-flat { padding: 10px; text-align: center; border-bottom: 1px solid #f1f5f9; }
.day-name { font-size: 0.7rem; font-weight: 600; color: #64748b; text-transform: uppercase; }
.day-date { font-size: 0.65rem; color: #94a3b8; }
.is-today { background: #00bcd4 !important; border-radius: 16px 16px 0 0; }
.is-today * { color: white !important; }

/* Bloco do Técnico e Cards */
.tec-block { background: #fff; border-radius: 12px; border: 1px solid #f1f5f9; overflow: hidden; }
.tec-name-header { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; padding: 6px 10px; letter-spacing: 0.5px; }

.os-card-flat { background: #fdfdfd; border-radius: 8px; border: 1px solid #f1f5f9; display: flex; margin-bottom: 4px; cursor: pointer; transition: 0.1s; }
.os-card-flat:hover { transform: translateY(-2px); border-color: #00A7CF; }
.status-indicator { width: 4px; border-radius: 4px 0 0 4px; }
.os-title-text { font-size: 0.72rem; font-weight: 500; color: #334155; line-height: 1.2; }
.os-time-tag { font-size: 0.6rem; font-weight: 700; color: #00bcd4; background: #e0f4f9; padding: 1px 8px; border-radius: 20px; display: inline-block; }

/* RODAPÉ DASHBOARD */
.footer-dashboard { 
  background: white; border-top: 1px solid #e2e8f0; height: 40px; 
  position: fixed; bottom: 60px; left: 0; right: 0; z-index: 1000; 
}
.label-resumo { font-size: 0.5rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px; }
.stat-item-slim { min-width: 65px; display: flex; flex-direction: column; justify-content: center; }
.stat-value-slim { font-size: 0.65rem; color: #1e293b; font-weight: 700; }
.stat-label-slim { font-size: 0.42rem; color: #94a3b8; text-transform: uppercase; white-space: nowrap; }

.progress-track-slim { height: 2.5px; background: #f1f5f9; border-radius: 10px; overflow: hidden; margin-top: 1px; }
.progress-fill-slim { height: 100%; transition: width 0.8s ease-in-out; }

.total-final-slim { font-size: 0.6rem; font-weight: 500; color: #64748b; }
.badge-total-slim { background: #00A7CF; color: white; padding: 1px 8px; border-radius: 10px; font-weight: 600; font-size: 0.7rem; }

/* Botões de Navegação */
.btn-nav-flat { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; padding: 4px 12px; border-radius: 8px; font-size: 0.75rem; height: 38px; }
.btn-nav-today { background: #00bcd4; color: white; border: none; padding: 4px 18px; border-radius: 8px; font-size: 0.75rem; font-weight: 600; height: 38px; }

.empty-state { text-align: center; padding: 20px; font-size: 0.6rem; color: #cbd5e1; font-weight: 600; text-transform: uppercase; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
.animate-in { animation: fadeIn 0.4s ease-out; }
</style>