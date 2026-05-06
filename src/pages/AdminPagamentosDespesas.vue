<template>
  <div class="header-fixed d-flex justify-content-between align-items-center px-3 px-md-5 py-2 shadow-sm no-print">
    <img :src="logoPath" alt="Logo" class="header-logo" />
    
    <div class="user-info-header text-center flex-grow-1">
      <span class="user-label-tiny">Gestão de Pagamentos</span> 
      
    </div>

    <button @click="confirmarSair" class="btn-logout-header" title="Sair do Sistema">
      <i class="bi bi-box-arrow-right"></i>
    </button>
  </div>

  <div class="main-bg container py-4 pb-5 min-vh-100 mt-header">
    
    <div class="no-print text-center">
   

      <div class="card shadow-sm mb-4 border-0 rounded-4 bg-white p-2">
        <div class="card-body p-2">
          <div class="row g-2 align-items-end justify-content-center text-start">
            <div class="col-md-3">
              <label class="label-tiny">PERÍODO INICIAL</label>
              <input v-model="dataIni" type="date" class="input-premium-slim" />
            </div>
            <div class="col-md-3">
              <label class="label-tiny">PERÍODO FINAL</label>
              <input v-model="dataFim" type="date" class="input-premium-slim" />
            </div>
            <div class="col-md-4">
              <label class="label-tiny">PROFISSIONAL / TÉCNICO</label>
              <select v-model.number="idTecnico" class="form-select select-premium-slim shadow-none">
                <option :value="0">Selecione o técnico...</option>
                <option v-for="f in funcionarios" :key="f.id" :value="f.id">{{ f.nome }}</option>
              </select>
            </div>
            <div class="col-md-2">
              <button class="btn btn-premium-blue w-100" :disabled="carregando" @click="buscar">
                <span v-if="carregando" class="spinner-border spinner-border-sm me-1"></span>BUSCAR
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="idTecnico > 0 && lista" class="row g-3 mb-4 animate-in">
        <div class="col-md-8">
          <div class="row g-3 h-100 align-items-stretch">
            <div class="col-md-6">
              <div class="saldo-card shadow-sm rounded-4 bg-white p-3 border-start border-4 border-primary h-100 d-flex flex-column justify-content-center">
                <div class="d-flex justify-content-between align-items-center">
                  <div class="text-start">
                    <span class="label-tiny text-muted">SALDO ATUAL (DISPONÍVEL)</span>
                    <div class="h4 mb-0 fw-semibold text-dark">{{ moeda(saldoTecnico) }}</div>
                  </div>
                  <div class="d-flex flex-column gap-1">
                    <button class="btn btn-tiny btn-outline-danger" @click="abrirModalAjuste('RETIRAR')">RETIRAR</button>
                    <button class="btn btn-tiny btn-primary" @click="abrirModalAjuste('ADICIONAR')">ADICIONAR</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="saldo-card shadow-sm rounded-4 bg-white p-3 border-start border-4 h-100 d-flex flex-column justify-content-center" :class="saldoReal >= 0 ? 'border-success' : 'border-danger'">
                <div class="text-start">
                  <span class="label-tiny text-muted">SALDO REAL (LÍQUIDO)</span>
                  <div class="h4 mb-0 fw-semibold" :class="saldoReal >= 0 ? 'text-success' : 'text-danger'">{{ moeda(saldoReal) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card border-0 shadow-sm rounded-4 bg-white h-100">
            <div class="card-body d-flex flex-column justify-content-center p-3 text-start">
              <span class="label-tiny text-muted mb-2 text-center d-block">GERAR RELATÓRIOS</span>
              <div class="d-flex gap-2 w-100">
                <button class="btn btn-report btn-outline-dark flex-grow-1" @click="abrirEdicaoPonto">
                  <i class="bi bi-clock me-1"></i> PONTO
                </button>
                <button class="btn btn-report btn-outline-danger flex-grow-1" @click="imprimirFinanceiro">
                  <i class="bi bi-cash-stack me-1"></i> FINANCEIRO
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="idTecnico > 0 && lista" class="row g-2 mb-4 animate-in">
        <div v-for="cat in categoriasResumo" :key="cat.nome" class="col-md-4">
          <div class="card border-0 shadow-sm rounded-4 p-2 bg-white">
            <div class="d-flex align-items-center justify-content-between px-2 pt-1">
              <span class="label-tiny text-muted">{{ cat.nome.toUpperCase() }} PENDENTE</span>
              <span class="fw-bold text-dark small">{{ moeda(cat.valor) }}</span>
            </div>
            <div class="progress mt-1 mx-2" style="height: 4px; background: #f1f5f9;">
              <div class="progress-bar" :class="cat.cor" :style="{ width: cat.percent + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="idTecnico > 0 && lista">
        <ul class="nav nav-tabs-premium mb-3">
          <li v-for="aba in ['Almoço', 'Transporte', 'Despesa', 'Histórico']" :key="aba" class="nav-item">
            <button class="nav-link" :class="{ active: abaAtiva === aba }" @click="abaAtiva = aba">
              {{ aba }} 
              <span v-if="aba !== 'Histórico'" class="badge-count">{{ getListaPorCat(aba).length }}</span>
            </button>
          </li>
        </ul>

        <div class="tab-content shadow-sm rounded-4 bg-white mb-5 p-3 animate-in">
          <div v-if="abaAtiva !== 'Histórico'">
            <div v-if="!getListaPorCat(abaAtiva).length" class="empty-state">Nenhum lançamento pendente encontrado.</div>
            <table v-else class="table table-clean table-zebra align-middle">
              <thead>
                <tr class="text-muted small">
                  <th style="width:40px"><input type="checkbox" class="form-check-input" @change="e => toggleSelectAll(e.target.checked)"></th>
                  <th @click="toggleSort" class="cursor-pointer">DATA <i class="bi bi-sort-down"></i></th>
                  <th>DESCRIÇÃO</th>
                  <th class="text-end">VALOR</th>
                  <th class="text-end">STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in sortedLista(getListaPorCat(abaAtiva))" :key="item.tipo + item.id" :class="{'row-pago': item.pago}">
                  <td><input type="checkbox" class="form-check-input" :checked="selecionados.has(`${item.tipo}|${item.id}`) || selecionadosEstorno.has(`${item.tipo}|${item.id}`)" @change="e => handleCheckbox(item, e.target.checked)"></td>
                  <td class="text-muted small">{{ br(item.data) }}</td>
                  <td class="fw-medium text-dark">{{ item.descricao }}</td>
                  <td class="fw-semibold text-end text-dark">{{ moeda(item.valor) }}</td>
                  <td class="text-end">
                    <span class="status-pill" :class="item.pago ? 'pago' : 'pendente'">{{ item.pago ? 'Pago' : 'Pendente' }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else>
            <table class="table table-clean table-zebra align-middle">
              <thead><tr><th class="ps-3 small">DATA / HORA</th><th class="small">DESCRIÇÃO</th><th class="text-end pe-3 small">VALOR</th></tr></thead>
              <tbody>
                <tr v-for="h in listaHistorico" :key="h.id">
                  <td class="ps-3 text-muted small">{{ formatDateTime(h.data_ref) }}</td>
                  <td class="fw-medium text-dark">{{ h.descricao }}</td>
                  <td class="fw-semibold text-end pe-3" :class="h.valor > 0 ? 'text-success' : 'text-danger'">{{ h.valor > 0 ? '+' : '' }}{{ moeda(h.valor) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selecionados.size > 0 || selecionadosEstorno.size > 0" class="barra-confirmacao animate-in">
       <div class="d-flex justify-content-between align-items-center container h-100">
         <div class="text-white small">ITENS SELECIONADOS: <span class="fw-bold text-warning ms-1">{{ selecionados.size || selecionadosEstorno.size }}</span></div>
         <div class="d-flex gap-2">
            <button v-if="selecionados.size > 0" class="btn btn-success btn-sm px-4 fw-medium" @click="revisaoOpen = true">PAGAR {{ moeda(totalSelecionado) }}</button>
            <button v-if="selecionadosEstorno.size > 0" class="btn btn-danger btn-sm px-4 fw-medium" @click="revisaoOpen = true">ESTORNAR {{ moeda(totalSelecionadoEstorno) }}</button>
         </div>
       </div>
    </div>

    <div v-if="modalPontoOpen" class="modal-custom-overlay no-print">
      <div class="modal-card-ponto shadow-lg p-4 animate-in">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="text-start">
            <h5 class="fw-semibold mb-0 text-uppercase ls-1">Folha de Ponto Profissional</h5>
            <small class="text-muted">{{ tecnicoNome }} | Período: {{ dataIni.split('-').reverse().join('/') }} a {{ dataFim.split('-').reverse().join('/') }}</small>
          </div>
          <button class="btn-close" @click="modalPontoOpen = false"></button>
        </div>
        <div class="table-responsive flex-grow-1 rounded-3 border">
          <table class="table table-sm align-middle text-center table-zebra mb-0">
            <thead class="bg-dark text-white sticky-top">
              <tr class="small uppercase ls-1">
                <th class="py-2">DIA</th><th>ENTRADA</th><th>ALM INI</th><th>ALM FIM</th><th>SAÍDA</th><th>ATR</th><th>BRUTA</th><th>DESL</th><th>TRAB</th><th>OS</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in dadosPontoEditavel" :key="d.dia" :class="{'bg-feriado-soft': d.isFeriado}">
                <td class="fw-bold bg-light">{{ d.dia }} <small class="text-muted fw-normal">{{ d.sem }}</small></td>
                <td><input v-model="d.entrada" type="time" class="input-time" @change="recalcularLinha(d)" /></td>
                <td><input v-model="d.alm_ini" type="time" class="input-time" @change="recalcularLinha(d)" /></td>
                <td><input v-model="d.alm_fim" type="time" class="input-time" @change="recalcularLinha(d)" /></td>
                <td><input v-model="d.saida" type="time" class="input-time" @change="recalcularLinha(d)" /></td>
                <td class="text-danger fw-bold">{{ d.atrasos }}</td>
                <td class="text-muted">{{ d.jornada }}</td>
                <td><input v-model="d.deslocamento" type="text" class="input-time" @change="recalcularLinha(d)" /></td>
                <td class="bg-primary-subtle fw-bold text-primary">{{ d.trabalhadas }}</td>
                <td><input v-model.number="d.qtd" type="number" class="input-time" /></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pt-3 d-flex justify-content-end gap-2">
          <button class="btn btn-light px-4" @click="modalPontoOpen = false">FECHAR</button>
          <button class="btn btn-success px-4 shadow-sm fw-medium" @click="imprimirPonto">GERAR PDF</button>
        </div>
      </div>
    </div>

    <div v-if="revisaoOpen" class="modal-custom-overlay" @click.self="revisaoOpen = false">
      <div class="modal-card animate-in" style="max-width: 450px;">
        <div class="p-3 border-bottom bg-light fw-semibold text-center small uppercase">Processamento de Lote</div>
        <div class="p-3" style="max-height: 50vh; overflow-y: auto;">
          <div v-for="i in itensParaRevisar" :key="i.tipo+i.id" class="d-flex justify-content-between py-2 border-bottom small">
            <div class="text-start">
              <div class="fw-bold text-dark">{{ i.tipo }}</div>
              <div class="text-muted" style="font-size: 0.65rem;">{{ br(i.data) }} - {{ i.descricao }}</div>
            </div>
            <div class="fw-bold text-dark align-self-center">{{ moeda(i.valor) }}</div>
          </div>
          <div class="d-flex justify-content-between pt-3 text-primary h6 fw-bold">
            <span>TOTAL SELECIONADO:</span>
            <span>{{ selecionados.size > 0 ? moeda(totalSelecionado) : moeda(totalSelecionadoEstorno) }}</span>
          </div>
        </div>
        <div class="p-3 d-flex gap-2 bg-light rounded-bottom-4">
          <button class="btn btn-light btn-sm w-100 fw-medium" @click="revisaoOpen = false">CANCELAR</button>
          <button v-if="selecionados.size > 0" class="btn btn-success btn-sm w-100 fw-medium" @click="confirmarPagamentos">CONFIRMAR PAGAMENTO</button>
          <button v-else class="btn btn-danger btn-sm w-100 fw-medium" @click="confirmarEstornoLote">CONFIRMAR ESTORNO</button>
        </div>
      </div>
    </div>

    <div v-if="modalSaldoOpen" class="modal-custom-overlay" @click.self="modalSaldoOpen = false">
      <div class="modal-card p-4 animate-in" style="max-width: 350px;">
        <h6 class="fw-semibold mb-4 text-center text-uppercase small ls-1">AJUSTAR SALDO ({{ tipoAjuste }})</h6>
        <input v-model.number="valorSaldoManual" type="number" class="form-control mb-4 text-center fs-2 border-0 bg-light rounded-3" step="0.01" autofocus />
        <div class="d-flex gap-2">
          <button class="btn btn-light btn-sm w-100" @click="modalSaldoOpen = false">CANCELAR</button>
          <button class="btn btn-primary btn-sm w-100 fw-medium" @click="salvarSaldoManual">GRAVAR</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router"; // 🔵 Adicionado para o sair
import { api } from "@/services/api";

const router = useRouter(); // 🔵 Inicializado
const nomeUsuario = ref(localStorage.getItem('nomeUsuario') || 'Gestor'); // 🔵 Adicionado

// 🔵 Lógica de Saída Corrigida
const sair = () => { localStorage.clear(); router.push('/') }
const confirmarSair = () => { if (confirm("Deseja realmente sair do sistema?")) { sair(); } }

const dataIni = ref(""), dataFim = ref(""), idTecnico = ref(0), abaAtiva = ref('Almoço'), sortOrder = ref('desc');
const funcionarios = ref([]), lista = ref([]), listaHistorico = ref([]), saldoTecnico = ref(0);
const selecionados = ref(new Set()), selecionadosEstorno = ref(new Set()), carregando = ref(false), salvando = ref(false);
const erro = ref(""), okMsg = ref(""), modalSaldoOpen = ref(false), revisaoOpen = ref(false), valorSaldoManual = ref(0), tipoAjuste = ref('ADICIONAR');
const modalPontoOpen = ref(false), dadosPontoEditavel = ref([]);
const logoPath = new URL('@/assets/logo.png', import.meta.url).href;

// MANTIDAS TODAS AS TUAS FUNÇÕES ORIGINAIS
function moeda(v) { return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function br(iso) { return iso ? iso.split("-").reverse().join("/") : ""; }
function formatDateTime(iso) { if (!iso) return ''; const p = iso.split(' '); return `${br(p[0])} ${p[1]?.substring(0,5)}`; }
function timeToMin(t) { if(!t || !t.includes(':')) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function minToTime(m) { const hrs = Math.floor(m/60), mins = m%60; return `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}`; }

async function buscar() {
    if (!idTecnico.value) return; carregando.value = true; erro.value = ""; selecionados.value.clear(); selecionadosEstorno.value.clear();
    try {
        const { data } = await api.get("/despesas_periodo.php", { params: { data_ini: dataIni.value, data_fim: dataFim.value, idtecnico: idTecnico.value } });
        if (data?.success) {
            saldoTecnico.value = Number(data.saldo_atual || 0);
            lista.value = [...(data.almoco||[]), ...(data.transporte||[]), ...(data.despesas||[])].map(d => ({ 
                id: d.id, data: d.data_ref, descricao: d.descricao || d.tipo, valor: Number(d.valor), tipo: d.tipo, pago: d.pago == 1, raw: d 
            }));
            listaHistorico.value = data.historico || [];
        }
    } catch(e) { erro.value = "Falha ao buscar dados."; } finally { carregando.value = false; }
}

function imprimirPonto() {
    if (!dadosPontoEditavel.value.length) return;
    const rows = dadosPontoEditavel.value.map(d => `
        <tr style="background:${d.isFeriado?'#fdfbf2':'#fff'}">
            <td><b>${d.dia}</b> <small>${d.sem}</small></td><td>${d.entrada||'--'}</td><td>${d.alm_ini||'--'}</td><td>${d.alm_fim||'--'}</td><td>${d.saida||'--'}</td>
            <td style="color:red">${d.atrasos}</td><td>${d.jornada}</td><td>${d.deslocamento}</td><td style="font-weight:bold">${d.trabalhadas}</td><td>${d.qtd}</td>
        </tr>
    `).join('');
    const win = window.open('', '_blank');
    win.document.write(`<html><head><style>body{font-family:sans-serif;padding:30px;color:#333}table{width:100%;border-collapse:collapse}th{background:#333;color:#fff;padding:8px;font-size:8pt}td{border-bottom:1px solid #ddd;padding:6px;text-align:center;font-size:9.5pt}h2{color:#00A7CF}</style></head><body>
        <div style="display:flex;justify-content:space-between;border-bottom:2px solid #00A7CF;padding-bottom:10px;margin-bottom:20px">
            <img src="${logoPath}" style="height:55px">
            <div style="text-align:right"><h2>RESUMO DE PONTO</h2>${tecnicoNome.value}<br>Ref: ${mesReferencia.value}</div>
        </div>
        <table><thead><tr><th>DIA</th><th>ENTRA</th><th>ALM I</th><th>ALM F</th><th>SAÍDA</th><th>ATR</th><th>BRUTA</th><th>DESL</th><th>TRAB</th><th>OS</th></tr></thead><tbody>${rows}</tbody></table>
        <div style="margin-top:50px;border-top:1px solid #999;width:300px;margin-left:auto;margin-right:auto;text-align:center;padding-top:10px">Assinatura do Profissional</div>
        <script>setTimeout(()=>{window.print();window.close()},600)<\/script></body></html>`);
}

function imprimirFinanceiro() {
    const map = {};
    let tAlm = 0, tMat = 0, tCon = 0, tRec = 0;
    lista.value.forEach(i => { 
        if(!map[i.data]) map[i.data] = { d: i.data.split('-').reverse().slice(0,2).join('/'), alm: 0, mat: 0, con: 0, rec: 0 }; 
        if(i.tipo === 'Almoço') { map[i.data].alm += i.valor; tAlm += i.valor; }
        if(i.tipo === 'Despesa') { map[i.data].mat += i.valor; tMat += i.valor; }
        if(i.tipo === 'Transporte') { map[i.data].con += i.valor; tCon += i.valor; }
    });
    listaHistorico.value.forEach(h => { 
        const d = h.data_ref.split(' ')[0]; 
        if(!map[d]) map[d] = { d: d.split('-').reverse().slice(0,2).join('/'), alm: 0, mat: 0, con: 0, rec: 0 }; 
        if(h.valor > 0 && h.descricao.toLowerCase().includes('depósito')) { map[d].rec += h.valor; tRec += h.valor; }
    });
    const rowsHtml = Object.keys(map).sort().map(k => {
        const d = map[k];
        return `<tr style="border-bottom:1px solid #eee"><td>${d.d}</td><td>${moeda(d.alm)}</td><td>${moeda(d.mat)}</td><td>${moeda(d.con)}</td><td style="color:#157347;font-weight:bold">${moeda(d.rec)}</td></tr>`;
    }).join('');
    const win = window.open('', '_blank');
    win.document.write(`<html><head><style>body{font-family:sans-serif;padding:40px;color:#333}table{width:100%;border-collapse:collapse;margin:20px 0}th{text-align:right;padding:12px;border-bottom:2px solid #333;font-size:10pt}td{text-align:right;padding:10px;font-size:11pt}.total-row{background:#f8f9fa;font-weight:bold}.signature{margin-top:60px;border-top:1.5px solid #333;width:280px;text-align:center;padding-top:10px;margin-left:auto;margin-right:auto;font-size:10pt}</style></head><body>
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #00A7CF;padding-bottom:10px">
            <img src="${logoPath}" style="height:65px">
            <div style="text-align:right"><h2 style="margin:0;color:#00A7CF">RELATÓRIO FINANCEIRO</h2><p style="margin:0"><b>${tecnicoNome.value}</b> | ${mesReferencia.value}</p></div>
        </div>
        <table><thead><tr><th style="text-align:left">DATA</th><th>ALMOÇO</th><th>MATERIAIS</th><th>CONDUÇÃO</th><th>RECEBIDO</th></tr></thead><tbody>${rowsHtml}</tbody>
        <tfoot class="total-row"><tr><td style="text-align:left">TOTAIS</td><td>${moeda(tAlm)}</td><td>${moeda(tMat)}</td><td>${moeda(tCon)}</td><td>${moeda(tRec)}</td></tr></tfoot></table>
        <div style="margin-top:30px;padding:20px;background:#eef2f3;border-radius:12px;text-align:right;font-size:13pt">SALDO FINAL EM CONTA: <b>${moeda(saldoTecnico.value)}</b></div>
        <div class="signature">Assinatura do Responsável</div>
        <script>setTimeout(()=>{window.print();window.close()},600)<\/script></body></html>`);
}

const totalSelecionado = computed(() => { let s = 0; selecionados.value.forEach(k => { const [t, id] = k.split('|'); const i = lista.value.find(x => x.id == id && x.tipo == t); if(i) s += i.valor; }); return s; });
const totalSelecionadoEstorno = computed(() => { let s = 0; selecionadosEstorno.value.forEach(k => { const [t, id] = k.split('|'); const i = lista.value.find(x => x.id == id && x.tipo == t); if(i) s += i.valor; }); return s; });
const itensParaRevisar = computed(() => { const arr = []; const sels = selecionados.value.size > 0 ? selecionados.value : selecionadosEstorno.value; sels.forEach(k => { const [t, id] = k.split('|'); const i = lista.value.find(x => x.id == id && x.tipo == t); if(i) arr.push(i); }); return arr; });
const saldoReal = computed(() => Number(saldoTecnico.value) - (lista.value?.filter(i => !i.pago).reduce((s,i)=>s+i.valor,0)||0));
const getListaPorCat = (c) => lista.value?.filter(i => i.tipo === c) || [];
const tecnicoNome = computed(() => funcionarios.value.find(f => f.id === idTecnico.value)?.nome || 'Técnico');
const mesReferencia = computed(() => dataIni.value ? new Date(dataIni.value + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase() : '');
const sortedLista = (arr) => [...arr].sort((a,b) => sortOrder.value === 'asc' ? a.data.localeCompare(b.data) : b.data.localeCompare(a.data));
function toggleSort() { sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'; }

const categoriasResumo = computed(() => {
  const cats = [
    { nome: 'Almoço', valor: lista.value?.filter(x => x.tipo === 'Almoço' && !x.pago).reduce((s,i)=>s+i.valor,0)||0, cor: 'bg-primary' },
    { nome: 'Transporte', valor: lista.value?.filter(x => x.tipo === 'Transporte' && !x.pago).reduce((s,i)=>s+i.valor,0)||0, cor: 'bg-info' },
    { nome: 'Despesa', valor: lista.value?.filter(x => x.tipo === 'Despesa' && !x.pago).reduce((s,i)=>s+i.valor,0)||0, cor: 'bg-warning' }
  ];
  const max = Math.max(...cats.map(c=>c.valor), 1);
  return cats.map(c => ({ ...c, percent: (c.valor/max)*100 }));
});

function handleCheckbox(item, checked) { const k = `${item.tipo}|${item.id}`; if (!item.pago) { checked ? (selecionadosEstorno.value.clear(), selecionados.value.add(k)) : selecionados.value.delete(k); } else { checked ? (selecionados.value.clear(), selecionadosEstorno.value.add(k)) : selecionadosEstorno.value.delete(k); } }
function toggleSelectAll(checked) { const p = lista.value?.filter(i => i.tipo === abaAtiva.value && !i.pago) || []; checked ? p.forEach(i => selecionados.value.add(`${i.tipo}|${i.id}`)) : p.forEach(i => selecionados.value.delete(`${i.tipo}|${i.id}`)); }
async function confirmarPagamentos() { try { await api.post("/despesa_marcar_pago.php", { idtecnico: idTecnico.value, itens: itensParaRevisar.value.map(i => ({ id: i.id, tipo: i.tipo, valor: i.valor })) }); revisaoOpen.value = false; await buscar(); } catch(e){} }
async function confirmarEstornoLote() { for (const k of Array.from(selecionadosEstorno.value)) { const [t, id] = k.split('|'); await api.post("/despesa_estornar.php", { id: Number(id), tipo: t, idtecnico: idTecnico.value }); } revisaoOpen.value = false; await buscar(); }
function abrirModalAjuste(t) { tipoAjuste.value = t; valorSaldoManual.value = 0; modalSaldoOpen.value = true; }
async function salvarSaldoManual() { const v = tipoAjuste.value === 'RETIRAR' ? (valorSaldoManual.value * -1) : valorSaldoManual.value; await api.post("/tecnico_saldo_ajustar.php", { idtecnico: idTecnico.value, valor: v }); modalSaldoOpen.value = false; await buscar(); }

async function abrirEdicaoPonto() {
    carregando.value = true;
    try {
        const { data } = await api.get("/oshora_ponto_tecnico.php", { params: { data_ini: dataIni.value, data_fim: dataFim.value, idtecnico: idTecnico.value } });
        if (data?.success) {
            const mapAlm = {}; lista.value.filter(i => i.tipo === 'Almoço').forEach(i => mapAlm[i.data] = i.raw);
            const mapOS = {}; data.items.forEach(o => { if(!mapOS[o.data_ref]) mapOS[o.data_ref] = []; mapOS[o.data_ref].push(o); });
            const dataRef = new Date(dataIni.value + 'T12:00:00'), totalDias = new Date(dataRef.getFullYear(), dataRef.getMonth() + 1, 0).getDate();
            const rows = [];
            for (let i = 1; i <= totalDias; i++) {
                const dStr = `${dataRef.getFullYear()}-${String(dataRef.getMonth()+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
                const diaOS = mapOS[dStr] ? mapOS[dStr].sort((a,b) => a.horaini.localeCompare(b.horaini)) : [];
                const alm = mapAlm[dStr] || { hora_inicio: '', hora_fim: '' };
                let total_gap = 0;
                if (diaOS.length > 1) { for(let j=0; j < diaOS.length - 1; j++) { const gap = timeToMin(diaOS[j+1].horaini) - timeToMin(diaOS[j].horafin); if (gap > 0) total_gap += gap; } }
                const durAlm = (alm.hora_inicio && alm.hora_fim) ? (timeToMin(alm.hora_fim) - timeToMin(alm.hora_inicio)) : 0;
                const r = { dia: i, data: dStr, sem: new Date(dStr+'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }), isFeriado: isWeekendOrHoliday(dStr), entrada: diaOS[0]?.horaini || '', saida: diaOS[diaOS.length-1]?.horafin || '', alm_ini: alm.hora_inicio || '', alm_fim: alm.hora_fim || '', atrasos: '00:00', jornada: '00:00', trabalhadas: '00:00', deslocamento: minToTime(total_gap > durAlm ? (total_gap - durAlm) : 0), qtd: new Set(diaOS.map(o => o.idordem)).size };
                recalcularLinha(r); rows.push(r);
            }
            dadosPontoEditavel.value = rows; modalPontoOpen.value = true;
        }
    } finally { carregando.value = false; }
}
function recalcularLinha(r) { if (!r.entrada || !r.saida) return; const bruto = timeToMin(r.saida) - timeToMin(r.entrada); r.jornada = minToTime(bruto); const alm = (r.alm_ini && r.alm_fim) ? (timeToMin(r.alm_fim) - timeToMin(r.alm_ini)) : 0; const liq = bruto - alm - timeToMin(r.deslocamento); r.trabalhadas = minToTime(liq > 0 ? liq : 0); }
function isWeekendOrHoliday(dateStr) { const d = new Date(dateStr + 'T12:00:00'), dm = dateStr.substring(5); return d.getDay() === 0 || d.getDay() === 6 || ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25'].includes(dm); }

onMounted(async () => {
    dataFim.value = new Date().toISOString().slice(0, 10);
    dataIni.value = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10);
    const { data } = await api.get("/get_funcionarios.php");
    funcionarios.value = (data?.funcionarios || []).map(x => ({ id: Number(x.idfuncionario || x.id), nome: x.nome }));
});
</script>

<style scoped>
.main-bg { background-color: #f8fafc; font-family: 'Inter', sans-serif; }

/* 🔵 HEADER PADRONIZADO ADICIONADO */
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

/* MANTIDOS TODOS OS TEUS ESTILOS ORIGINAIS */
.logo-top-large { max-height: 80px; width: auto; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.05)); }
.header-title-clean-internal { font-size: 0.85rem; font-weight: 600; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; }
.subtitle-clean { font-size: 0.55rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }

.label-tiny { font-size: 0.52rem; font-weight: 700; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 3px; display: block; }
.input-premium-slim { border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 12px; font-size: 0.8rem; width: 100%; height: 38px; outline: none; }
.select-premium-slim { border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.8rem; height: 38px; }

.btn-premium-blue { background: #00A7CF; color: white; border: none; border-radius: 8px; font-size: 0.72rem; height: 38px; font-weight: 600; }
.btn-report { font-size: 0.65rem; font-weight: 600; border-radius: 8px; padding: 6px; }
.btn-tiny { font-size: 0.55rem; padding: 2px 8px; border-radius: 6px; font-weight: 700; }

.table-zebra tbody tr:nth-child(even) { background-color: #fcfdfe; }
.table-clean th { font-size: 0.62rem; color: #94a3b8; text-transform: uppercase; padding: 12px 8px; border-bottom: 1px solid #f1f5f9; }
.table-clean td { padding: 12px 8px; font-size: 0.78rem; border-bottom: 1px solid #f8fafc; }
.row-pago td { background-color: #f8fafc !important; color: #94a3b8 !important; opacity: 0.75; }

.status-pill { padding: 2px 10px; border-radius: 12px; font-size: 0.6rem; font-weight: 700; text-transform: uppercase; }
.status-pill.pago { background: #157347; color: #ffffff; }
.status-pill.pendente { background: #fef3c7; color: #b45309; }

.nav-tabs-premium { display: flex; gap: 15px; border-bottom: 2px solid #f1f5f9; padding: 0; list-style: none; }
.nav-tabs-premium .nav-link { border: none; background: transparent; padding: 10px 5px; color: #94a3b8; font-size: 0.75rem; font-weight: 600; position: relative; cursor: pointer; }
.nav-tabs-premium .nav-link.active { color: #00A7CF; }
.nav-tabs-premium .nav-link.active::after { content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 2px; background: #00A7CF; }
.badge-count { font-size: 0.6rem; background: #f1f5f9; color: #64748b; padding: 2px 6px; border-radius: 10px; margin-left: 5px; }

.barra-confirmacao { position: fixed; left: 0; bottom: 60px; width: 100%; height: 50px; background: #0f172a; z-index: 3000; display: flex; align-items: center; box-shadow: 0 -4px 10px rgba(0,0,0,0.1); }
.modal-custom-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 5000; }
.modal-card-ponto { background: white; border-radius: 20px; width: 98vw; height: 94vh; display: flex; flex-direction: column; overflow: hidden; }
.input-time { border: none; background: transparent; text-align: center; width: 100%; font-weight: 600; font-size: 0.85rem; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-in { animation: fadeIn 0.3s ease-out; }
.ls-1 { letter-spacing: 1px; }

@media print {
  .no-print { display: none !important; }
}
</style>