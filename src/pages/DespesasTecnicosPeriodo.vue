<template>
  <div class="main-bg min-vh-100">
    
    <div class="header-fixed d-flex justify-content-between align-items-center px-3 px-md-5 py-2 shadow-sm">
      <img :src="logoPath" alt="Logo" class="header-logo" />
      
      <div class="user-info-header text-center flex-grow-1">
        <span class="user-label-tiny">Gestão de Despesas</span> 
      </div>

      <button @click="confirmarSair" class="btn-logout-header" title="Sair do Sistema">
        <i class="bi bi-box-arrow-right"></i>
      </button>
    </div>

    <div class="container py-4 pb-5 mt-header">
      
      <div v-if="erro" class="alert alert-danger py-2 small shadow-sm">{{ erro }}</div>

      <div class="card shadow-sm mb-3 border-0 bg-light">
        <div class="card-body p-2">
          <div class="row g-2 align-items-end text-start">
            <div class="col-md-3 col-6">
              <label class="small fw-bold text-muted">Início</label>
              <input v-model="dataIni" type="date" class="form-control form-control-sm border-0 shadow-sm" />
            </div>
            <div class="col-md-3 col-6">
              <label class="small fw-bold text-muted">Fim</label>
              <input v-model="dataFim" type="date" class="form-control form-control-sm border-0 shadow-sm" />
            </div>
            <div class="col-md-4" v-if="isAdmin30">
              <label class="small fw-bold text-muted">Técnico</label>
              <select v-model.number="tecSelecionado" class="form-select form-select-sm border-0 shadow-sm">
                <option :value="0">Seu usuário...</option>
                <option v-for="f in tecnicosPermitidosList" :key="f.id" :value="f.id">{{ f.nome }}</option>
              </select>
            </div>
            <div class="col-md-2 d-grid">
              <button class="btn btn-primary btn-sm fw-bold shadow-sm" :disabled="loading" @click="buscar">BUSCAR</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="dados">
        <div class="row g-2 mb-3">
          <div class="col-6 text-start">
            <div class="alert py-2 mb-0 shadow-sm border-0 border-start border-4" :class="getSaldoClass(dados.saldo_atual)">
              <div class="small fw-bold text-muted text-uppercase" style="font-size: 0.65rem;">Saldo em Conta</div>
              <div class="h5 mb-0 fw-bold text-dark">{{ moeda(dados.saldo_atual) }}</div>
            </div>
          </div>
          <div class="col-6 text-start">
            <div class="alert py-2 mb-0 shadow-sm border-0 border-start border-4" :class="getSaldoClass(saldoReal)">
              <div class="small fw-bold text-muted text-uppercase" style="font-size: 0.65rem;">Saldo Real</div>
              <div class="h5 mb-0 fw-bold text-dark">{{ moeda(saldoReal) }}</div>
            </div>
          </div>
        </div>

        <div class="row g-2 mb-3">
          <div class="col-6 col-md-3">
            <div class="card shadow-sm border-0 text-center p-2 bg-white">
              <div class="text-muted fw-bold text-uppercase" style="font-size: 0.6rem;">Almoço</div>
              <div class="fw-bold small">{{ moeda(dados.totais?.almoco) }}</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="card shadow-sm border-0 text-center p-2 bg-white">
              <div class="text-muted fw-bold text-uppercase" style="font-size: 0.6rem;">Transporte</div>
              <div class="fw-bold small">{{ moeda(dados.totais?.transporte) }}</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="card shadow-sm border-0 text-center p-2 bg-white">
              <div class="text-muted fw-bold text-uppercase" style="font-size: 0.6rem;">Despesas</div>
              <div class="fw-bold small text-primary">{{ moeda(dados.totais?.despesas) }}</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="card shadow-sm border-0 text-center p-2 bg-primary text-white">
              <div class="fw-bold text-uppercase" style="font-size: 0.6rem; opacity: 0.9;">Total Despesas</div>
              <div class="fw-bold small">{{ moeda(dados.totais?.geral) }}</div>
            </div>
          </div>
        </div>

        <ul class="nav nav-tabs mb-2 small fw-bold" id="pills-tab" role="tablist">
          <li class="nav-item"><button class="nav-link active py-2" data-bs-toggle="tab" data-bs-target="#tab-almoco">Almoço ({{ dados.almoco?.length || 0 }})</button></li>
          <li class="nav-item"><button class="nav-link py-2" data-bs-toggle="tab" data-bs-target="#tab-transporte">Transp. ({{ dados.transporte?.length || 0 }})</button></li>
          <li class="nav-item"><button class="nav-link py-2" data-bs-toggle="tab" data-bs-target="#tab-despesa">Desp. ({{ dados.despesas?.length || 0 }})</button></li>
          <li class="nav-item"><button class="nav-link py-2" data-bs-toggle="tab" data-bs-target="#tab-hist">Histórico ({{ listDepósitos.length }})</button></li>
        </ul>

        <div class="tab-content border rounded bg-white p-2 shadow-sm mb-5">
          <div class="tab-pane fade show active" id="tab-almoco">
            <table class="table table-sm small mb-0">
              <tbody>
                <tr v-for="a in dados.almoco" :key="a.id" :class="{'bg-pago-light': String(a.pago) === '1'}">
                  <td style="width:85px" class="ps-2 text-start">{{ br(a.data_ref) }}</td>
                  <td class="text-muted text-start">Início: {{ a.hora_inicio }} | Fim: {{ a.hora_fim }}</td>
                  <td class="fw-bold text-end pe-2">{{ moeda(a.valor) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="tab-pane fade" id="tab-transporte">
            <table class="table table-sm small mb-0">
              <tbody>
                <tr v-for="t in dados.transporte" :key="t.id" :class="{'bg-pago-light': String(t.pago) === '1'}">
                  <td style="width:85px" class="ps-2 text-start">{{ br(t.data_ref) }}</td>
                  <td class="text-muted text-start">{{ t.descricao || 'Transporte' }}</td>
                  <td class="fw-bold text-end pe-2">{{ moeda(t.valor) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="tab-pane fade" id="tab-despesa">
            <table class="table table-sm small mb-0">
              <tbody>
                <tr v-for="d in dados.despesas" :key="d.id" :class="{'bg-pago-light': String(d.pago) === '1'}">
                  <td style="width:85px" class="ps-2 text-start">{{ br(d.data_ref) }}</td>
                  <td class="text-start">{{ d.descricao }}</td>
                  <td class="fw-bold text-end pe-2" style="width:240px">
                    <div class="d-flex align-items-center justify-content-end gap-2">
                      {{ moeda(d.valor) }}
                      <button v-if="d.foto_url" class="btn btn-outline-primary btn-xs" @click="verFoto(d)">Visu. Comprovante</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="tab-pane fade" id="tab-hist">
            <div v-if="!listDepósitos.length" class="text-muted p-3 small text-center">Nenhum depósito no período.</div>
            <table v-else class="table table-sm small mb-0">
              <thead>
                <tr class="text-muted border-bottom" style="font-size: 0.7rem;">
                  <th class="ps-2 py-2 text-start" style="width:140px">DATA / HORA</th>
                  <th class="py-2 text-start">DESCRIÇÃO</th>
                  <th class="text-end pe-2 py-2">VALOR</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="h in listDepósitos" :key="h.id" class="border-bottom">
                  <td class="ps-2 text-muted py-2 text-start">{{ formatDateTime(h.data_ref) }}</td>
                  <td class="fw-bold py-2 text-start">Depósito</td>
                  <td class="fw-bold text-end pe-2 py-2 text-success">+{{ moeda(h.valor) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-if="fotoModalOpen" class="modal-custom-overlay" @click.self="fecharFoto">
        <div class="modal-custom-panel shadow-lg" style="max-width: 450px;">
          <div class="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
            <h6 class="mb-0 fw-bold small text-uppercase">Comprovante</h6>
            <button class="btn-close" @click="fecharFoto"></button>
          </div>
          <div class="p-2 text-center bg-white" style="min-height: 200px;">
            <div v-if="fotoLoading" class="py-5"><span class="spinner-border spinner-border-sm me-2"></span></div>
            <img v-else :src="fotoSrc" class="img-fluid rounded border shadow-sm" style="max-height: 70vh;" />
          </div>
          <div class="p-3 bg-light text-end"><button class="btn btn-secondary btn-sm" @click="fecharFoto">Fechar</button></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router"; // 🔵 Adicionado
import { api } from "@/services/api";

const router = useRouter(); // 🔵 Inicializado
const logoPath = new URL('@/assets/logo.png', import.meta.url).href;
const nomeUsuario = ref(localStorage.getItem('nomeUsuario') || 'Técnico'); // 🔵 Adicionado

// 🔵 LOGICA DE SAÍDA
const sair = () => { localStorage.clear(); router.push('/') }
const confirmarSair = () => {
  if (confirm("Deseja realmente sair do sistema?")) {
    sair();
  }
}

const apiBase = computed(() => {
  let url = localStorage.getItem("apiBase")?.replace(/['"]/g, "").trim() || "";
  if (url && !url.endsWith("/")) url += "/";
  return url;
});

const idFuncionario = computed(() => Number(localStorage.getItem("idFuncionario") || 0));
const isAdmin30 = computed(() => [30, 29, 14, 1].includes(idFuncionario.value));

const tecSelecionado = ref(0);
const tecnicosPermitidosList = ref([]);
const dataIni = ref("");
const dataFim = ref("");
const loading = ref(false), erro = ref(""), dados = ref(null);
const fotoModalOpen = ref(false), fotoLoading = ref(false), fotoSrc = ref("");

function br(iso) { return iso ? iso.split("-").reverse().join("/") : ""; }
function moeda(v) { return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

function formatDateTime(iso) {
  if (!iso) return '';
  const parts = iso.split(' ');
  const data = parts[0].split('-').reverse().join('/');
  return `${data} ${parts[1]?.substring(0, 5) || ''}`;
}

const saldoReal = computed(() => {
  if (!dados.value) return 0;
  const pendente = [
    ...(dados.value.almoco || []),
    ...(dados.value.transporte || []),
    ...(dados.value.despesas || [])
  ].filter(x => x.pago != 1).reduce((acc, x) => acc + Number(x.valor || 0), 0);
  return Number(dados.value.saldo_atual || 0) - pendente;
});

const listDepósitos = computed(() => {
  if (!dados.value?.historico) return [];
  return dados.value.historico
    .filter(h => h.descricao?.toLowerCase().includes('depósito') && !h.descricao?.toLowerCase().includes('retirada'))
    .sort((a, b) => (a.data_ref || '').localeCompare(b.data_ref || ''));
});

function getSaldoClass(valor) {
  const v = Number(valor || 0);
  if (v > 0) return 'bg-success-subtle border-success';
  if (v < 0) return 'bg-danger-subtle border-danger';
  return 'bg-secondary-subtle border-secondary';
}

async function carregarTecnicosPermitidos() {
  if (!isAdmin30.value) return;
  try {
    const { data } = await api.get("/get_funcionarios.php");
    tecnicosPermitidosList.value = (data?.funcionarios || []).map(x => ({ id: Number(x.idfuncionario || x.id), nome: x.nome }));
  } catch (e) { console.error(e); }
}

async function buscar() {
  erro.value = ""; loading.value = true;
  try {
    const params = { 
      data_ini: dataIni.value, 
      data_fim: dataFim.value,
      idtecnico: (isAdmin30.value && tecSelecionado.value > 0) ? tecSelecionado.value : idFuncionario.value
    };
    const { data } = await api.get("/despesas_periodo.php", { params });
    if (!data?.success) throw new Error(data?.message || "Erro na busca.");
    
    const safeSort = (arr) => arr ? arr.sort((a, b) => (a.data_ref || '').localeCompare(b.data_ref || '')) : [];
    safeSort(data.almoco); safeSort(data.transporte); safeSort(data.despesas); safeSort(data.historico);
    
    dados.value = data;
  } catch (e) { erro.value = e.message; }
  finally { loading.value = false; }
}

function verFoto(item) {
  if (!item.foto_url) return;
  fotoModalOpen.value = true; fotoLoading.value = true;
  const idAlvo = (isAdmin30.value && tecSelecionado.value > 0) ? tecSelecionado.value : idFuncionario.value;
  fotoSrc.value = apiBase.value + item.foto_url.replace(/^\//, '') + `&idFuncionario=${idAlvo}`;
  setTimeout(() => { fotoLoading.value = false; }, 300);
}
function fecharFoto() { fotoModalOpen.value = false; fotoSrc.value = ""; }

onMounted(async () => {
  dataFim.value = new Date().toISOString().slice(0, 10);
  dataIni.value = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10);
  await carregarTecnicosPermitidos();
  await buscar();
});
</script>

<style scoped>
.main-bg { background-color: #f8fafc; }

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

/* Estilos Originais */
.bg-pago-light td { background-color: rgba(209, 231, 221, 0.4) !important; }
.nav-tabs { border: none; border-bottom: 1px solid #dee2e6; }
.nav-link { color: #6c757d; border: none; background: none !important; }
.nav-link.active { color: #0d6efd !important; border-bottom: 2px solid #0d6efd !important; font-weight: bold; border-radius: 0; }
.modal-custom-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 4000; padding: 10px; }
.modal-custom-panel { background: white; width: 100%; border-radius: 8px; overflow: hidden; }
.btn-xs { padding: 2px 10px; font-size: 0.65rem; border-radius: 4px; }
</style>