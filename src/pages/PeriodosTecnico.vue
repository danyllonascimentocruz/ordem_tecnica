<template>
  <div class="main-bg min-vh-100 pb-5">
    
    <div class="header-fixed d-flex justify-content-between align-items-center px-3 px-md-5 py-2 shadow-sm">
      <img :src="logoPath" alt="Logo" class="header-logo" />
      
      <div class="user-info-header text-center flex-grow-1">
        <span class="user-label-tiny">Lançamentos de Despesas</span> 
      </div>

      <button @click="confirmarSair" class="btn-logout-header" title="Sair do Sistema">
        <i class="bi bi-box-arrow-right"></i>
      </button>
    </div>

    <div class="container mt-header pt-4" style="max-width: 500px;">
      
      <div class="text-center mb-4 animate-in">
        <div class="ref-pill shadow-sm">
          <i class="bi bi-calendar-event text-primary me-2"></i>
          <span class="ref-label">REFERÊNCIA:</span>
          <span class="ref-date">{{ formatarDataBR(dataHoje) }}</span>
        </div>
      </div>

      <div v-if="erro" class="alert-premium-danger mb-3 animate-in">{{ erro }}</div>
      <div v-if="sucesso" class="alert-premium-success mb-3 animate-in">{{ sucesso }}</div>

      <div class="nav-tabs-premium mb-4 animate-in">
        <button class="nav-link-clean" :class="{ active: abaAtiva === 'almoco' }" @click="trocarAba('almoco')">ALMOÇO</button>
        <button class="nav-link-clean" :class="{ active: abaAtiva === 'transporte' }" @click="trocarAba('transporte')">TRANSPORTE</button>
        <button class="nav-link-clean" :class="{ active: abaAtiva === 'despesas' }" @click="trocarAba('despesas')">DESPESAS</button>
      </div>

      <div v-if="abaAtiva === 'almoco'" class="animate-in">
        <div class="card-premium mb-4 border-top-blue">
          <div class="card-body p-4 text-start">
            <div class="row g-3">
              <div class="col-6">
                <label class="label-clean">HORA INÍCIO</label>
                <input type="time" class="input-premium" v-model="almoco.hora_inicio" />
              </div>
              <div class="col-6">
                <label class="label-clean">HORA FIM</label>
                <input type="time" class="input-premium" v-model="almoco.hora_fim" />
              </div>
              <div class="col-12">
                <label class="label-clean">VALOR REEMBOLSO (FIXO)</label>
                <input type="text" class="input-premium bg-light fw-bold" :value="VALOR_ALMOCO_FIXO.toFixed(2)" readonly />
              </div>
              <div class="col-12 pt-2">
                <button class="btn-blue-premium w-100 py-3" @click="salvarAlmoco" :disabled="carregando">
                  <span v-if="carregando" class="spinner-border spinner-border-sm me-2"></span>
                  SALVAR ALMOÇO
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="history-section shadow-sm">
          <button class="btn-history-toggle" @click="showHistAlmoco = !showHistAlmoco">
            <span><i class="bi bi-clock-history me-2"></i>VER ÚLTIMOS LANÇAMENTOS</span>
            <i class="bi" :class="showHistAlmoco ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
          </button>
          
          <div v-if="showHistAlmoco" class="history-content animate-in">
            <div v-for="r in histAlmoco" :key="r.data_ref" class="history-item">
              <span class="small fw-bold text-dark">{{ formatarDataBR(r.data_ref) }}</span>
              <span class="small text-muted" v-if="r.almoco">{{ normalizarHora(r.almoco.hora_inicio) }} - {{ normalizarHora(r.almoco.hora_fim) }}</span>
              <span class="fw-bold text-primary">{{ r.almoco ? formatarMoeda(r.almoco.valor) : '--' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="abaAtiva === 'transporte'" class="animate-in">
        <div class="card-premium mb-4 border-top-green">
          <div class="card-body p-4 text-start">
            <div class="row g-3">
              <div class="col-6"><label class="label-clean">SAÍDA</label><input type="time" class="input-premium" v-model="novoTransporte.hora_inicio" /></div>
              <div class="col-6"><label class="label-clean">RETORNO</label><input type="time" class="input-premium" v-model="novoTransporte.hora_fim" /></div>
              <div class="col-12">
                <label class="label-clean">VALOR GASTO</label>
                <input type="number" step="0.01" class="input-premium fw-bold text-success" v-model="novoTransporte.valor" placeholder="0,00" />
              </div>
              <div class="col-12">
                <label class="label-clean">DESTINO / MEIO</label>
                <input type="text" class="input-premium" v-model="novoTransporte.descricao" placeholder="Ex: Ônibus / Uber" />
              </div>
              <button class="btn-green-premium w-100 py-3 mt-2" @click="criarTransporte">LANÇAR CONDUÇÃO</button>
            </div>
          </div>
        </div>

        <div class="history-section shadow-sm">
          <button class="btn-history-toggle" @click="showHistTransp = !showHistTransp">
            <span><i class="bi bi-bus-front me-2"></i>HISTÓRICO DE HOJE</span>
            <i class="bi" :class="showHistTransp ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
          </button>
          <div v-if="showHistTransp" class="history-content animate-in">
            <div v-for="t in transportesHoje" :key="t.id" class="history-item justify-content-between">
              <div class="text-start">
                <div class="small fw-bold">{{ t.descricao }}</div>
                <div class="ultra-small text-muted">{{ t.hora_inicio }} - {{ t.hora_fim }}</div>
              </div>
              <div class="d-flex align-items-center gap-3">
                <span class="fw-bold text-success">{{ formatarMoeda(t.valor) }}</span>
                <button class="btn-del" @click="excluirTransporte(t)"><i class="bi bi-trash"></i></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="animate-in">
        <div class="card-premium mb-4 border-top-gray">
          <div class="card-body p-4 text-start">
            <div class="row g-3">
              <div class="col-12"><label class="label-clean">DESCRIÇÃO</label><input class="input-premium" v-model="despesa.descricao" placeholder="O que comprou?" /></div>
              <div class="col-12"><label class="label-clean">VALOR (R$)</label><input type="number" class="input-premium" v-model="despesa.valor" placeholder="0,00" /></div>
              <div class="col-12">
                <label class="label-clean">COMPROVANTE</label>
                <div class="upload-box" @click="$refs.fileInput.click()">
                  <i class="bi bi-camera-fill me-2"></i>
                  <span>{{ despesaFotoNome || 'ANEXAR RECIBO' }}</span>
                  <input type="file" ref="fileInput" class="d-none" accept="image/*" capture="environment" @change="onFileChange" />
                </div>
              </div>
              <button class="btn-dark-premium w-100 py-3" @click="salvarDespesa">SALVAR DESPESA</button>
            </div>
          </div>
        </div>

        <div class="history-section shadow-sm">
          <button class="btn-history-toggle" @click="showHistDesp = !showHistDesp">
            <span><i class="bi bi-receipt me-2"></i>ÚLTIMOS RECIBOS</span>
            <i class="bi" :class="showHistDesp ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
          </button>
          <div v-if="showHistDesp" class="history-content animate-in">
            <div v-for="d in despesas" :key="d.id" class="history-item">
              <div class="text-start">
                <div class="small fw-bold">{{ d.descricao }}</div>
                <div class="ultra-small text-muted">{{ formatarDataBR(d.data_ref) }} • {{ formatarMoeda(d.valor) }}</div>
              </div>
              <a :href="apiBase + d.foto_url + '&idFuncionario=' + idFuncionario" target="_blank" class="btn-proof-icon shadow-sm">
                <i class="bi bi-image"></i>
              </a>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const router = useRouter();
const logoPath = new URL("../assets/logo.png", import.meta.url).href;
const nomeUsuario = ref(localStorage.getItem('nomeUsuario') || 'Técnico');

// Estados
const erro = ref(""), sucesso = ref(""), carregando = ref(false), abaAtiva = ref("almoco");
const showHistAlmoco = ref(false), showHistTransp = ref(false), showHistDesp = ref(false);

const VALOR_ALMOCO_FIXO = 34.87;
const dataHoje = new Date().toISOString().split('T')[0];

const almoco = ref({ hora_inicio: "", hora_fim: "" });
const novoTransporte = ref({ hora_inicio: "", hora_fim: "", valor: 0, descricao: "" });
const transportesHoje = ref([]), histAlmoco = ref([]), despesas = ref([]);
const despesa = ref({ descricao: "", valor: 0 }), despesaFotoFile = ref(null), despesaFotoNome = ref("");

const apiBase = computed(() => normalizeApiBase(localStorage.getItem("apiBase") || ""));
const idFuncionario = computed(() => String(localStorage.getItem("idFuncionario") || "").trim());

const confirmarSair = () => { if (confirm("Deseja sair?")) { localStorage.clear(); router.push('/') } }
function normalizeApiBase(url) { if(!url) return ""; url = url.replace(/['"]/g, "").trim(); if(!url.endsWith("/")) url += "/"; return url; }
function getAxios() { return axios.create({ baseURL: apiBase.value, headers: { "X-Id-Funcionario": idFuncionario.value } }); }
function formatarDataBR(v) { if(!v) return ""; const [y,m,d] = v.split("-"); return `${d}/${m}/${y}`; }
function formatarMoeda(v) { return Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function normalizarHora(h) { return (h || "").toString().slice(0, 5); }

async function trocarAba(aba) { abaAtiva.value = aba; if(aba === "despesas") carregarDespesas7Dias(); }

async function carregarLancamentos7Dias() {
  carregando.value = true;
  try {
    const http = getAxios();
    const resp = await http.get("periodos_historico.php", { params: { dias: 7 } });
    if (resp.data?.success) {
      const hoje = resp.data.data.find(x => x.data_ref === dataHoje);
      if (hoje?.almoco) {
        almoco.value.hora_inicio = normalizarHora(hoje.almoco.hora_inicio);
        almoco.value.hora_fim = normalizarHora(hoje.almoco.hora_fim);
      }
      transportesHoje.value = (hoje?.transportes || []).map(t => ({ ...t, hora_inicio: normalizarHora(t.hora_inicio), hora_fim: normalizarHora(t.hora_fim) }));
      histAlmoco.value = resp.data.data;
    }
  } catch (e) { } finally { carregando.value = false; }
}

async function salvarAlmoco() {
  if (!almoco.value.hora_inicio || !almoco.value.hora_fim) return;
  carregando.value = true;
  try { await getAxios().post("almoco_salvar.php", { data_ref: dataHoje, hora_inicio: almoco.value.hora_inicio, hora_fim: almoco.value.hora_fim }); sucesso.value = "Sucesso!"; await carregarLancamentos7Dias(); } catch (e) { } finally { carregando.value = false; }
}

async function criarTransporte() {
  if (!novoTransporte.value.hora_inicio || !novoTransporte.value.valor) return;
  try { await getAxios().post("transporte_criar.php", { ...novoTransporte.value, data_ref: dataHoje }); await carregarLancamentos7Dias(); novoTransporte.value = { hora_inicio: "", hora_fim: "", valor: 0, descricao: "" }; } catch (e) { }
}

async function excluirTransporte(t) { if(confirm("Excluir?")) { await getAxios().delete(`transporte_excluir.php?id=${t.id}`); await carregarLancamentos7Dias(); } }
function onFileChange(e) { const f = e.target.files[0]; despesaFotoFile.value = f; despesaFotoNome.value = f ? f.name : ""; }
async function carregarDespesas7Dias() { try { const resp = await getAxios().get("despesa_listar.php", { params: { dias: 7 } }); if(resp.data?.success) despesas.value = resp.data.data; } catch(e){} }
async function salvarDespesa() {
  if (!despesa.value.descricao || !despesaFotoFile.value) return;
  const fd = new FormData(); fd.append("data_ref", dataHoje); fd.append("descricao", despesa.value.descricao); fd.append("valor", String(despesa.value.valor)); fd.append("foto", despesaFotoFile.value);
  try { await axios.post(apiBase.value + "despesa_criar.php", fd, { headers: { "X-Id-Funcionario": idFuncionario.value, "Content-Type": "multipart/form-data" } }); carregarDespesas7Dias(); despesa.value = { descricao: "", valor: 0 }; despesaFotoNome.value = ""; } catch(e){}
}

onMounted(carregarLancamentos7Dias);
</script>

<style scoped>
.main-bg { background-color: #f8fafc; font-family: 'Inter', sans-serif; }

/* 🔵 HEADER COM FORMATAÇÃO */
.header-fixed { background: white; z-index: 1000; border-bottom: 1px solid #e2e8f0; height: 60px; position: fixed; top: 0; left: 0; width: 100%; }
.mt-header { margin-top: 60px; }
.header-logo { height: 50px; }
.user-label-tiny { font-size: 0.55rem; color: #94a3b8; font-weight: 700; letter-spacing: 0.5px; }
.user-name-display { font-size: 0.85rem; color: #1e293b; font-weight: 500; margin-left: 5px; }
.btn-logout-header { background: transparent; border: none; color: #94a3b8; font-size: 1.2rem; }

/* DATA REFERÊNCIA */
.ref-pill { display: inline-flex; align-items: center; background: white; border: 1px solid #e2e8f0; padding: 6px 18px; border-radius: 12px; }
.ref-label { font-size: 0.55rem; font-weight: 800; color: #94a3b8; margin-right: 5px; }
.ref-date { font-size: 0.85rem; font-weight: 700; color: #1e293b; }

/* TABS */
.nav-tabs-premium { display: flex; justify-content: center; gap: 15px; border-bottom: 2px solid #e2e8f0; }
.nav-link-clean { border: none; background: transparent; padding: 10px 5px; color: #94a3b8; font-size: 0.7rem; font-weight: 700; position: relative; }
.nav-link-clean.active { color: #00A7CF; }
.nav-link-clean.active::after { content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 2px; background: #00A7CF; }

/* CARDS E INPUTS */
.card-premium { background: white; border: 1px solid #e2e8f0; border-radius: 12px; }
.border-top-blue { border-top: 4px solid #00A7CF; }
.border-top-green { border-top: 4px solid #10b981; }
.border-top-gray { border-top: 4px solid #64748b; }

.label-clean { font-size: 0.55rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; display: block; }
.input-premium { width: 100%; border: 1px solid #e2e8f0; padding: 10px; font-size: 0.85rem; outline: none; border-radius: 8px; background: #fff; }

/* 🔵 ACORDEÃO DE HISTÓRICO */
.history-section { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
.btn-history-toggle { width: 100%; border: none; background: #f8fafc; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; font-size: 0.65rem; font-weight: 800; color: #64748b; }
.history-content { border-top: 1px solid #f1f5f9; padding: 5px 0; }
.history-item { padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f8fafc; }
.history-item:last-child { border-bottom: none; }

/* BOTÕES E ÍCONES */
.btn-blue-premium { background: #00A7CF; color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 0.75rem; }
.btn-green-premium { background: #10b981; color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 0.75rem; }
.btn-dark-premium { background: #1e293b; color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 0.75rem; }

.btn-proof-icon { width: 34px; height: 34px; background: #f0f9ff; border: 1px solid #e0f2fe; color: #00A7CF; display: flex; align-items: center; justify-content: center; border-radius: 8px; text-decoration: none; }
.btn-del { background: transparent; border: none; color: #ef4444; font-size: 1rem; opacity: 0.6; }

.upload-box { border: 2px dashed #e2e8f0; padding: 15px; text-align: center; color: #94a3b8; font-size: 0.7rem; font-weight: 700; cursor: pointer; border-radius: 8px; }

.alert-premium-danger { background: #fff1f2; color: #e11d48; border: 1px solid #fda4af; padding: 10px; font-size: 0.75rem; border-radius: 8px; }
.alert-premium-success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; padding: 10px; font-size: 0.75rem; border-radius: 8px; }

.ultra-small { font-size: 0.6rem; }
.animate-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
</style>