<template>
  <div class="main-bg min-vh-100 d-flex flex-column">
    
    <div class="header-fixed d-flex justify-content-between align-items-center px-3 px-md-5 py-2 shadow-sm">
      <img :src="logoPath" alt="Logo" class="header-logo" />
      
      <div class="user-info-header text-center flex-grow-1">
        <span class="user-label-tiny">Calendário - Lançamentos de Horas</span> 
      </div>

      <button @click="confirmarSair" class="btn-logout-header" title="Sair do Sistema">
        <i class="bi bi-box-arrow-right"></i>
      </button>
    </div>

    <div class="mt-header">
      <div class="legend-row d-flex justify-content-center gap-3 my-3 px-2">
        <div v-for="it in legendItems" :key="it.label" class="legend-item">
          <span class="dot-status" :style="{ background: it.color }"></span>
          <span class="label-status">{{ it.label }}</span>
        </div>
      </div>

      <div class="filter-bar-clean mx-auto mb-3 shadow-sm rounded-4 bg-white p-2" style="width: 90%;">
        <div class="row g-2 align-items-end text-start">
          <div class="col-md-5 d-flex gap-2 align-items-end">
            <div class="flex-grow-1">
              <label class="label-input">INÍCIO DA SEMANA</label>
              <input v-model="dataDe" type="date" class="input-flat" @change="alinharSemana" />
            </div>
            <button class="btn-search-blue shadow-sm" @click="buscar" :disabled="carregando">
              <i v-if="!carregando" class="bi bi-search"></i>
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
        <div class="day-column-clean shadow-sm" v-for="d in diasSemana" :key="d.data">
          <div class="day-header-flat" :class="{ 'is-today': eHoje(d.data) }">
            <div class="day-name">{{ d.rotulo }}</div>
            <div class="day-date">{{ formatarDataBR(d.data) }}</div>
          </div>
          
          <div class="day-body-content p-2">
            <div v-if="!getTecnicosOrdenados(d.data).length" class="empty-state">Sem registros</div>
            
            <div v-for="tecNome in getTecnicosOrdenados(d.data)" :key="tecNome" class="tec-block mb-3 shadow-sm">
              <div class="tec-name-header" :style="getTecnicoStyle(tecNome)">
                {{ tecNome }}
              </div>
              <div class="os-list-inner p-1">
                <div 
                  v-for="c in (cardsAgrupados[d.data] ? cardsAgrupados[d.data][tecNome] : [])" 
                  :key="c.key" 
                  class="os-card-flat" 
                  :class="{'os-validated': c.validado}"
                  @click="abrirConfirmacao(c)"
                >
                  <div class="status-indicator" :style="{ background: corSituacao(c.situacao) }"></div>
                  <div class="os-info-flat p-2 flex-grow-1 text-start">
                    <div class="d-flex justify-content-between align-items-center">
                      <div class="d-flex align-items-center gap-2 overflow-hidden">
                        <span class="dot-status-card" :style="{ background: corSituacao(c.situacao) }"></span>
                        <div class="os-title-text text-truncate">#{{ c.nordem }} — {{ c.nomecliente }}</div>
                      </div>
                      <i v-if="c.validado" class="bi bi-check-circle-fill text-success ms-1"></i>
                    </div>
                    <div class="os-time-tag mt-1">{{ c.horaini }} → {{ c.horafin }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModalValidar" class="modal-overlay" @click.self="showModalValidar = false">
      <div class="modal-card animate-in">
        <div class="p-3 text-center border-bottom bg-light rounded-top-4">
          <h6 class="m-0 fw-bold text-dark">Validar Lançamento</h6>
        </div>
        <div class="p-4 text-center">
          <div class="os-preview-box mb-3">
            <span class="d-block small text-muted mb-1">ORDEM DE SERVIÇO</span>
            <div class="d-flex justify-content-center align-items-center gap-2 mb-1">
              <span class="dot-status" :style="{ background: corSituacao(osAlvo.situacao) }"></span>
              <span class="fw-bold text-primary fs-5">#{{ osAlvo.nordem }}</span>
            </div>
            <p class="small m-0 text-dark text-truncate fw-medium">{{ osAlvo.nomecliente }}</p>
            <hr class="my-2 opacity-50">
            <div class="text-start ps-2">
              <div class="ultra-small text-muted text-uppercase"><b>Técnico:</b> {{ osAlvo.tecnico }}</div>
              <div class="ultra-small text-muted text-uppercase"><b>Data:</b> {{ formatarDataBR(osAlvo.data_ref) }}</div>
            </div>
          </div>
          <p class="small text-muted m-0">Deseja alterar o status de conferência?</p>
        </div>
        <div class="p-3 d-flex gap-2">
          <button class="btn btn-light btn-sm flex-grow-1 border fw-semibold" @click="showModalValidar = false">FECHAR</button>
          <button class="btn btn-primary-action btn-sm flex-grow-1 fw-bold" @click="toggleValidacaoOS">
            {{ osAlvo.validado ? 'DESMARCAR' : 'CONFERIR' }}
          </button>
        </div>
      </div>
    </div>

    <footer class="footer-dashboard shadow-lg px-4 d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center gap-4 flex-grow-1 overflow-hidden">
        <span class="label-resumo">RESUMO:</span>
        <div class="d-flex gap-3">
          <div v-for="(total, status) in resumoStatus" :key="status" class="stat-item-slim">
            <div class="d-flex align-items-center gap-1">
               <span class="stat-value-slim">{{ total }}</span>
               <span class="stat-label-slim">{{ status }}</span>
            </div>
            <div class="progress-track-slim">
              <div class="progress-fill-slim" :style="{ background: corSituacao(status), width: calcularPorcentagem(total) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="total-final-slim">
        TOTAL <span class="badge-total-slim">{{ itens.length }}</span>
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
const itens = ref([]);
const carregando = ref(false);
const logoPath = new URL('@/assets/logo.png', import.meta.url).href;
const nomeUsuario = ref(localStorage.getItem('nomeUsuario') || 'Gestor');

// ESTADOS VALIDAÇÃO
const showModalValidar = ref(false);
const osAlvo = ref(null);
const idFuncionario = computed(() => Number(localStorage.getItem('idFuncionario') || 0));
const isAdmin = computed(() => [29, 30, 14, 1].includes(idFuncionario.value));

const sair = () => { localStorage.clear(); router.push('/') }
const confirmarSair = () => { if (confirm("Deseja realmente sair do sistema?")) { sair(); } }

const legendItems = [
  { label: "1.Atendimento", color: "#3CB371" }, 
  { label: "2.Agendamento", color: "#00A7CF" },
  { label: "3.Nao Atendida", color: "#DC143C" }, 
  { label: "Concluida", color: "#333" }
];

// 🔵 LÓGICA DE COR CORRIGIDA: "A BAIXAR" AGORA É CINZA (#adb5bd)
const corSituacao = (s) => {
  const status = String(s || "").toUpperCase();
  if (status.includes("NAO ATENDIDA") || status.includes("3.")) return "#DC143C";
  if (status.includes("CONCLUIDA")) return "#333";
  if (status.includes("AGENDAMENTO") || status.includes("2.")) return "#00A7CF";
  if (status.includes("ATENDIMENTO") || status.includes("1.")) return "#3CB371";
  return "#adb5bd"; // Cor padrão (Cinza para "A BAIXAR" e outros)
};

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

const abrirConfirmacao = (os) => {
  if (!isAdmin.value) { abrirDetalhe(os); return; }
  osAlvo.value = os;
  showModalValidar.value = true;
};

const toggleValidacaoOS = async () => {
  const novoEstado = !osAlvo.value.validado;
  try {
    const { data } = await api.post("/os_validar_hora.php", { 
      nordem: osAlvo.value.nordem,
      data_ref: osAlvo.value.data_ref,
      idtecnico: osAlvo.value.idtecnico,
      validado: novoEstado ? 1 : 0,
      id_conferidor: idFuncionario.value 
    });
    if (data.success) {
      osAlvo.value.validado = novoEstado;
      showModalValidar.value = false;
    }
  } catch (e) { alert("Falha na API."); }
};

const cardsAgrupados = computed(() => {
  const map = {};
  diasSemana.value.forEach(d => map[d.data] = {});
  itens.value.forEach(it => {
    const dia = it.data_ref;
    if (map[dia]) {
      const tec = it.tecnico || 'NÃO DEFINIDO';
      if (!map[dia][tec]) map[dia][tec] = [];
      map[dia][tec].push(it);
    }
  });
  return map;
});

const getTecnicosOrdenados = (dia) => (cardsAgrupados.value[dia] ? Object.keys(cardsAgrupados.value[dia]).sort() : []);
const resumoStatus = computed(() => {
  const counts = {};
  itens.value.forEach(it => { counts[it.situacao] = (counts[it.situacao] || 0) + 1; });
  return counts;
});
const calcularPorcentagem = (valor) => (itens.value.length > 0 ? (valor / itens.value.length) * 100 : 0);

async function buscar() {
  carregando.value = true;
  try {
    const { data } = await api.get("/oshora_rotina_periodo.php", { 
      params: { data_ini: dataDe.value, data_fim: dataAte.value } 
    });
    if (data.success) {
      itens.value = (data.items || []).map(r => ({ 
        ...r, 
        key: `${r.idoshoras}-${r.idtecnico}`,
        validado: Number(r.validado || 0) === 1
      }));
    }
  } catch (e) { console.error(e); } finally { carregando.value = false; }
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
const formatarDataBR = (iso) => iso ? iso.split('-').reverse().join('/') : '';
const eHoje = (d) => d === new Date().toISOString().split('T')[0];
const abrirDetalhe = (c) => router.push({ name: 'ordem', params: { id: String(c.nordem) } });

onMounted(() => { setSemana(new Date()); buscar(); });
</script>

<style scoped>
.main-bg { background-color: #f1f5f9; font-family: 'Inter', sans-serif; }
.header-fixed { background: white; z-index: 1000; border-bottom: 1px solid #f1f1f1; height: 60px; position: fixed; top: 0; left: 0; width: 100%; }
.mt-header { margin-top: 60px; }
.header-logo { height: 50px; }
.user-label-tiny { font-size: 0.55rem; color: #94a3b8; font-weight: 700; letter-spacing: 0.5px; }
.user-name-display { font-size: 0.85rem; color: #1e293b; font-weight: 500; margin-left: 5px; }
.btn-logout-header { background: transparent; border: none; color: #94a3b8; font-size: 1.2rem; display: flex; align-items: center; }

/* ESTILO VALIDADO */
.os-validated {
  background-color: #ecfdf5 !important;
  border: 1.5px solid #10b981 !important;
}

/* BOLINHA DE STATUS NO CARD */
.dot-status-card { 
  width: 8px; height: 8px; border-radius: 50%; 
  flex-shrink: 0; display: inline-block;
}

/* MODAL CONFIRMAÇÃO */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center; z-index: 5000;
}
.modal-card {
  background: white; border-radius: 20px; width: 90%; max-width: 340px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15); overflow: hidden;
}
.os-preview-box { background: #f8fafc; border-radius: 14px; padding: 15px; border: 1px solid #e2e8f0; }
.btn-primary-action { background: #00A7CF; color: white; border: none; border-radius: 10px; font-weight: 600; padding: 8px; }

/* ESTILOS ORIGINAIS MANTIDOS */
.legend-item { display: flex; align-items: center; gap: 6px; }
.dot-status { width: 8px; height: 8px; border-radius: 50%; }
.label-status { font-size: 0.65rem; color: #64748b; font-weight: 500; }
.filter-bar-clean { background: white; border-radius: 12px; }
.input-flat { border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 12px; font-size: 0.8rem; outline: none; background: #fff; width: 100%; height: 38px; }
.label-input { font-size: 0.5rem; font-weight: 700; color: #94a3b8; display: block; margin-bottom: 2px; }
.btn-search-blue { background: #00A7CF; color: white; border: none; border-radius: 8px; width: 45px; height: 38px; display: flex; align-items: center; justify-content: center; }
.calendar-wrapper { overflow-x: auto; padding-bottom: 120px; }
.week-grid-auto { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; min-width: 1100px; }
.day-column-clean { background: #fff; border-radius: 16px; border: 1px solid rgba(0,0,0,0.02); display: flex; flex-direction: column; height: fit-content; }
.day-header-flat { padding: 10px; text-align: center; border-bottom: 1px solid #f1f5f9; }
.day-name { font-size: 0.7rem; font-weight: 600; color: #64748b; text-transform: uppercase; }
.day-date { font-size: 0.65rem; color: #94a3b8; }
.is-today { background: #00bcd4 !important; border-radius: 16px 16px 0 0; }
.is-today * { color: white !important; }
.tec-block { background: #fff; border-radius: 12px; border: 1px solid #f1f5f9; overflow: hidden; }
.tec-name-header { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; padding: 6px 10px; letter-spacing: 0.5px; }
.os-card-flat { background: #fdfdfd; border-radius: 8px; border: 1px solid #f1f5f9; display: flex; margin-bottom: 4px; cursor: pointer; transition: 0.1s; }
.os-card-flat:hover { transform: translateY(-2px); border-color: #00A7CF; }
.status-indicator { width: 4px; border-radius: 4px 0 0 4px; }
.os-title-text { font-size: 0.72rem; font-weight: 500; color: #334155; line-height: 1.2; }
.os-time-tag { font-size: 0.6rem; font-weight: 700; color: #00bcd4; background: #e0f4f9; padding: 1px 8px; border-radius: 20px; display: inline-block; }
.footer-dashboard { background: white; border-top: 1px solid #e2e8f0; height: 40px; position: fixed; bottom: 60px; left: 0; right: 0; z-index: 1000; }
.label-resumo { font-size: 0.5rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px; }
.stat-item-slim { min-width: 65px; display: flex; flex-direction: column; justify-content: center; }
.stat-value-slim { font-size: 0.65rem; color: #1e293b; font-weight: 700; }
.stat-label-slim { font-size: 0.42rem; color: #94a3b8; text-transform: uppercase; white-space: nowrap; }
.progress-track-slim { height: 2.5px; background: #f1f5f9; border-radius: 10px; overflow: hidden; margin-top: 1px; }
.progress-fill-slim { height: 100%; transition: width 0.8s ease-in-out; }
.total-final-slim { font-size: 0.6rem; font-weight: 500; color: #64748b; }
.badge-total-slim { background: #00A7CF; color: white; padding: 1px 8px; border-radius: 10px; font-weight: 600; font-size: 0.7rem; }
.ultra-small { font-size: 0.55rem; line-height: 1.4; }
.btn-nav-flat { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; padding: 4px 12px; border-radius: 8px; font-size: 0.75rem; height: 38px; }
.btn-nav-today { background: #00bcd4; color: white; border: none; padding: 4px 18px; border-radius: 8px; font-size: 0.75rem; font-weight: 600; height: 38px; }
.empty-state { text-align: center; padding: 20px; font-size: 0.6rem; color: #cbd5e1; font-weight: 600; text-transform: uppercase; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
.animate-in { animation: fadeIn 0.4s ease-out; }
</style>