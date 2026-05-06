<template>
  <div class="container py-4">
    <!-- Logo -->
    <div class="text-center mb-3">
      <img
        :src="logoPath"
        alt="Nova Onlyne"
        class="img-fluid"
        style="max-width: 260px; max-height: 160px; object-fit: contain;"
      />
    </div>

    <h4 class="text-center mb-2">Lançamentos</h4>

    <!-- Alertas -->
    <div v-if="erro" class="alert alert-danger">{{ erro }}</div>
    <div v-if="sucesso" class="alert alert-success">{{ sucesso }}</div>

    <!-- Data fixa -->
    <div class="alert alert-secondary text-center py-2">
      <strong>Data:</strong> {{ formatarDataBR(dataHoje) }}<br />
      <small class="text-muted">Lançamentos permitidos somente para hoje</small>
    </div>

    <!-- Abas -->
    <div class="d-flex justify-content-center gap-2 mb-3 flex-wrap">
      <button
        class="btn"
        :class="abaAtiva === 'almoco' ? 'btn-primary' : 'btn-outline-primary'"
        @click="trocarAba('almoco')"
        :disabled="carregando"
      >
        🍽️ Almoço
      </button>

      <button
        class="btn"
        :class="abaAtiva === 'transporte' ? 'btn-success' : 'btn-outline-success'"
        @click="trocarAba('transporte')"
        :disabled="carregando"
      >
        🚗 Transporte
      </button>

      <button
        class="btn"
        :class="abaAtiva === 'despesas' ? 'btn-dark' : 'btn-outline-dark'"
        @click="trocarAba('despesas')"
        :disabled="carregando"
      >
        🧾 Despesas
      </button>
    </div>

    <!-- ===================== ALMOÇO ===================== -->
    <div v-if="abaAtiva === 'almoco'">
      <div class="card shadow-sm mb-3">
        <div class="card-header"><strong>Almoço</strong></div>
        <div class="card-body">
          <div class="row g-2 align-items-end">
            <div class="col-6">
              <label class="form-label">Início</label>
              <input type="time" class="form-control" v-model="almoco.hora_inicio" :disabled="carregando" />
            </div>
            <div class="col-6">
              <label class="form-label">Fim</label>
              <input type="time" class="form-control" v-model="almoco.hora_fim" :disabled="carregando" />
            </div>

            <div class="col-12">
              <label class="form-label">Valor</label>
              <input class="form-control" :value="valorAlmocoFormatado" disabled />
            </div>

            <div class="col-12 d-grid">
              <button class="btn btn-primary" @click="salvarAlmoco" :disabled="carregando">
                <i class="bi bi-floppy me-1"></i> Salvar
              </button>
            </div>

            <div class="small text-muted mt-2">
              Valor do almoço é fixo.
            </div>
          </div>
        </div>
      </div>

      <!-- Histórico almoço 7 dias -->
      <div class="card shadow-sm">
        <div class="card-header"><strong>Histórico (últimos 7 dias)</strong></div>
        <div class="card-body">
          <div v-if="histAlmoco.length === 0" class="text-muted">
            Sem lançamentos no período.
          </div>

          <div v-else class="table-responsive">
            <table class="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Início</th>
                  <th>Fim</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in histAlmoco" :key="r.data_ref">
                  <td>{{ formatarDataBR(r.data_ref) }}</td>
                  <td>{{ r.almoco?.hora_inicio || "-" }}</td>
                  <td>{{ r.almoco?.hora_fim || "-" }}</td>
                  <td>{{ r.almoco ? formatarMoeda(r.almoco.valor) : "-" }}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>

    <!-- ===================== TRANSPORTE ===================== -->
    <div v-else-if="abaAtiva === 'transporte'">
      <div class="card shadow-sm mb-3">
        <div class="card-header"><strong>Transporte</strong></div>
        <div class="card-body">
          <!-- Novo transporte -->
          <div class="row g-2">
            <div class="col-6">
              <label class="form-label">Início</label>
              <input type="time" class="form-control" v-model="novoTransporte.hora_inicio" :disabled="carregando" />
            </div>

            <div class="col-6">
              <label class="form-label">Fim</label>
              <input type="time" class="form-control" v-model="novoTransporte.hora_fim" :disabled="carregando" />
            </div>

            <div class="col-12">
              <label class="form-label">Valor</label>
              <input type="number" step="0.01" class="form-control" v-model="novoTransporte.valor" :disabled="carregando" />
              <div class="form-text">{{ formatarMoeda(novoTransporte.valor || 0) }}</div>
            </div>

            <div class="col-12">
              <label class="form-label">Descrição</label>
              <input type="text" class="form-control" v-model="novoTransporte.descricao" :disabled="carregando" placeholder="Opcional" />
            </div>

            <div class="col-12 d-grid mt-1">
              <button class="btn btn-success" @click="criarTransporte" :disabled="carregando">
                <i class="bi bi-plus-circle me-1"></i> Adicionar
              </button>
            </div>
          </div>

          <hr />

          <!-- Lista do dia -->
          <div v-if="transportesHoje.length === 0" class="text-muted">
            Nenhum transporte lançado hoje.
          </div>

          <div v-else>
            <div v-for="t in transportesHoje" :key="t.id" class="border rounded p-2 mb-2">
              <div class="row g-2">
                <div class="col-4">
                  <label class="form-label mb-1">Início</label>
                  <input type="time" class="form-control form-control-sm" v-model="t.hora_inicio" :disabled="carregando" />
                </div>
                <div class="col-4">
                  <label class="form-label mb-1">Fim</label>
                  <input type="time" class="form-control form-control-sm" v-model="t.hora_fim" :disabled="carregando" />
                </div>
                <div class="col-4">
                  <label class="form-label mb-1">Valor</label>
                  <input type="number" step="0.01" class="form-control form-control-sm" v-model="t.valor" :disabled="carregando" />
                  <div class="form-text">{{ formatarMoeda(t.valor || 0) }}</div>
                </div>

                <div class="col-12">
                  <label class="form-label mb-1">Descrição</label>
                  <input type="text" class="form-control form-control-sm" v-model="t.descricao" :disabled="carregando" placeholder="Opcional" />
                </div>

                <div class="col-12 d-flex justify-content-end gap-2">
                  <button class="btn btn-outline-primary btn-sm px-2" title="Salvar" @click="atualizarTransporte(t)" :disabled="carregando">
                    <i class="bi bi-floppy"></i>
                  </button>
                  <button class="btn btn-outline-danger btn-sm px-2" title="Excluir" @click="excluirTransporte(t)" :disabled="carregando">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Histórico transporte 7 dias -->
      <div class="card shadow-sm">
        <div class="card-header"><strong>Histórico (últimos 7 dias)</strong></div>
        <div class="card-body">
          <div v-if="histTransporte.length === 0" class="text-muted">
            Sem lançamentos no período.
          </div>

          <div v-else class="accordion" id="accTrans7">
            <div class="accordion-item" v-for="(d, idx) in histTransporte" :key="d.data_ref">
              <h2 class="accordion-header" :id="'ht'+idx">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" :data-bs-target="'#ct'+idx">
                  {{ formatarDataBR(d.data_ref) }}
                </button>
              </h2>

              <div :id="'ct'+idx" class="accordion-collapse collapse" :aria-labelledby="'ht'+idx" data-bs-parent="#accTrans7">
                <div class="accordion-body">
                  <div v-if="!d.transportes || d.transportes.length === 0" class="text-muted">
                    Sem transportes.
                  </div>

                  <ul v-else class="mb-0">
                    <li v-for="t in d.transportes" :key="t.id">
                      {{ t.hora_inicio }} - {{ t.hora_fim }} | {{ formatarMoeda(t.valor) }}
                      <span v-if="t.descricao"> | {{ t.descricao }}</span>
                    </li>
                  </ul>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- ===================== DESPESAS ===================== -->
    <div v-else>
      <div class="card shadow-sm mb-3">
        <div class="card-header"><strong>Despesas</strong></div>
        <div class="card-body">
          <div class="mb-2">
            <label class="form-label">Descrição</label>
            <input class="form-control" v-model="despesa.descricao" :disabled="carregando" />
          </div>

          <div class="mb-2">
            <label class="form-label">Valor</label>
            <input type="number" step="0.01" class="form-control" v-model="despesa.valor" :disabled="carregando" />
            <div class="form-text">{{ formatarMoeda(despesa.valor || 0) }}</div>
          </div>

          <div class="mb-3">
            <label class="form-label">Cupom fiscal (foto obrigatória)</label>
            <input
              type="file"
              class="form-control"
              accept="image/*"
              capture="environment"
              @change="onFileChange"
              :disabled="carregando"
            />
            <div v-if="despesaFotoNome" class="small text-muted mt-1">
              Arquivo: {{ despesaFotoNome }}
            </div>
          </div>

          <div class="d-grid">
            <button class="btn btn-dark" @click="salvarDespesa" :disabled="carregando">
              <i class="bi bi-floppy me-1"></i> Salvar despesa
            </button>
          </div>
        </div>
      </div>

      <div class="card shadow-sm">
        <div class="card-header"><strong>Histórico (últimos 7 dias)</strong></div>
        <div class="card-body">
          <div v-if="despesas.length === 0" class="text-muted">
            Sem despesas no período.
          </div>

          <div v-else class="table-responsive">
            <table class="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Foto</th>
                  <th class="text-end" style="width: 90px;">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in despesas" :key="d.id">
                  <td>{{ formatarDataBR(d.data_ref) }}</td>
                  <td>{{ d.descricao }}</td>
                  <td>{{ formatarMoeda(d.valor) }}</td>
                  <td>
                    <a
                      :href="apiBase + d.foto_url + '&idFuncionario=' + idFuncionario"
                      target="_blank"
                      rel="noopener"
                    >
                      Ver
                    </a>
                  </td>
                  <td class="text-end">
                    <button
                      class="btn btn-outline-danger btn-sm px-2"
                      title="Excluir"
                      @click="excluirDespesa(d)"
                      :disabled="carregando || d.data_ref !== dataHoje"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="small text-muted">
              Exclusão permitida apenas para despesas de hoje.
            </div>
          </div>

        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";

const logoPath = new URL("../assets/logo.png", import.meta.url).href;

const erro = ref("");
const sucesso = ref("");
const carregando = ref(false);

const abaAtiva = ref("almoco"); // almoco | transporte | despesas
function hojeLocalISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const dataHoje = hojeLocalISO();


// Valor fixo almoço
const VALOR_ALMOCO_FIXO = 34.87;
const valorAlmocoFormatado = computed(() => formatarMoeda(VALOR_ALMOCO_FIXO));

// State almoço/transporte
const almoco = ref({ hora_inicio: "", hora_fim: "" });

const novoTransporte = ref({
  hora_inicio: "",
  hora_fim: "",
  valor: 0,
  descricao: ""
});

const transportesHoje = ref([]);
const histAlmoco = ref([]);
const histTransporte = ref([]);

// State despesas
const despesas = ref([]);
const despesa = ref({ descricao: "", valor: 0 });
const despesaFotoFile = ref(null);
const despesaFotoNome = ref("");

// Auth/base
const apiBase = computed(() => normalizeApiBase(localStorage.getItem("apiBase") || ""));
const idFuncionario = computed(() => String(localStorage.getItem("idFuncionario") || "").trim());

// helpers
function limparMsgs() {
  erro.value = "";
  sucesso.value = "";
}

function normalizeApiBase(url) {
  if (!url) return "";
  url = url.replace(/['"]/g, "").trim();
  if (!url.endsWith("/")) url += "/";
  return url;
}

function getAxios() {
  const base = apiBase.value;
  const idFunc = idFuncionario.value;

  if (!base) throw new Error("apiBase não encontrado no localStorage.");
  if (!idFunc) throw new Error("idFuncionario não encontrado no localStorage.");

  return axios.create({
    baseURL: base,
    headers: {
      "X-Id-Funcionario": idFunc,
      "Content-Type": "application/json",
    },
    timeout: 30000
  });
}

function formatarDataBR(dataISO) {
  if (!dataISO) return "";
  const [y, m, d] = dataISO.split("-");
  return `${d}/${m}/${y}`;
}

function formatarMoeda(v) {
  const n = Number(v ?? 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function normalizarHora(h) {
  return (h || "").toString().slice(0, 5);
}

function trocarAba(aba) {
  abaAtiva.value = aba;
  limparMsgs();
  if (aba === "despesas") {
    carregarDespesas7Dias();
  }
}

// ========= LOAD =========
async function carregarLancamentos7Dias() {
  limparMsgs();
  carregando.value = true;

  try {
    const http = getAxios();
    const resp = await http.get("periodos_historico.php", { params: { dias: 7 } });
    if (!resp.data?.success) throw new Error(resp.data?.message || "Falha ao carregar histórico.");

    const dados = resp.data.data || [];
    const hoje = dados.find(x => x.data_ref === dataHoje);

    if (hoje?.almoco) {
      almoco.value.hora_inicio = normalizarHora(hoje.almoco.hora_inicio);
      almoco.value.hora_fim = normalizarHora(hoje.almoco.hora_fim);
    } else {
      almoco.value.hora_inicio = "";
      almoco.value.hora_fim = "";
    }

    transportesHoje.value = (hoje?.transportes || []).map(t => ({
      ...t,
      hora_inicio: normalizarHora(t.hora_inicio),
      hora_fim: normalizarHora(t.hora_fim),
      valor: t.valor ?? 0,
      descricao: t.descricao ?? ""
    }));

    histAlmoco.value = dados.map(d => ({ data_ref: d.data_ref, almoco: d.almoco || null }));
    histTransporte.value = dados.map(d => ({ data_ref: d.data_ref, transportes: d.transportes || [] }));

  } catch (e) {
    erro.value = e?.message || "Erro ao carregar histórico.";
  } finally {
    carregando.value = false;
  }
}

async function carregarDespesas7Dias() {
  limparMsgs();
  carregando.value = true;

  try {
    const http = getAxios();
    const resp = await http.get("despesa_listar.php", { params: { dias: 7 } });
    if (!resp.data?.success) throw new Error(resp.data?.message || "Falha ao carregar despesas.");
    despesas.value = resp.data.data || [];
  } catch (e) {
    erro.value = e?.message || "Erro ao carregar despesas.";
  } finally {
    carregando.value = false;
  }
}

// ========= ALMOÇO =========
async function salvarAlmoco() {
  limparMsgs();

  if (!almoco.value.hora_inicio || !almoco.value.hora_fim) {
    erro.value = "Informe hora início e hora fim do almoço.";
    return;
  }
  if (almoco.value.hora_inicio >= almoco.value.hora_fim) {
    erro.value = "Hora início deve ser menor que hora fim.";
    return;
  }

  carregando.value = true;
  try {
    const http = getAxios();

    // valor fixo no backend
    const payload = {
      data_ref: dataHoje,
      hora_inicio: almoco.value.hora_inicio,
      hora_fim: almoco.value.hora_fim
    };

    const resp = await http.post("almoco_salvar.php", payload);
    if (!resp.data?.success) throw new Error(resp.data?.message || "Falha ao salvar almoço.");

    sucesso.value = "Almoço salvo.";
    await carregarLancamentos7Dias();
  } catch (e) {
    erro.value = e?.message || "Erro ao salvar almoço.";
  } finally {
    carregando.value = false;
  }
}

// ========= TRANSPORTE =========
async function criarTransporte() {
  limparMsgs();

  if (!novoTransporte.value.hora_inicio || !novoTransporte.value.hora_fim) {
    erro.value = "Informe hora início e hora fim do transporte.";
    return;
  }
  if (novoTransporte.value.hora_inicio >= novoTransporte.value.hora_fim) {
    erro.value = "Hora início deve ser menor que hora fim.";
    return;
  }

  carregando.value = true;
  try {
    const http = getAxios();

    const payload = {
      data_ref: dataHoje,
      hora_inicio: novoTransporte.value.hora_inicio,
      hora_fim: novoTransporte.value.hora_fim,
      valor: Number(novoTransporte.value.valor || 0),
      descricao: (novoTransporte.value.descricao || "").trim() || null
    };

    const resp = await http.post("transporte_criar.php", payload);
    if (!resp.data?.success) throw new Error(resp.data?.message || "Falha ao criar transporte.");

    sucesso.value = "Transporte adicionado.";
    novoTransporte.value = { hora_inicio: "", hora_fim: "", valor: 0, descricao: "" };
    await carregarLancamentos7Dias();
  } catch (e) {
    erro.value = e?.message || "Erro ao criar transporte.";
  } finally {
    carregando.value = false;
  }
}

async function atualizarTransporte(t) {
  limparMsgs();

  if (!t.hora_inicio || !t.hora_fim) {
    erro.value = "Informe hora início e hora fim.";
    return;
  }
  if (t.hora_inicio >= t.hora_fim) {
    erro.value = "Hora início deve ser menor que hora fim.";
    return;
  }

  carregando.value = true;
  try {
    const http = getAxios();

    const payload = {
      hora_inicio: t.hora_inicio,
      hora_fim: t.hora_fim,
      valor: Number(t.valor || 0),
      descricao: (t.descricao || "").trim() || null
    };

    const resp = await http.put(`transporte_atualizar.php?id=${t.id}`, payload);
    if (!resp.data?.success) throw new Error(resp.data?.message || "Falha ao atualizar transporte.");

    sucesso.value = "Transporte atualizado.";
    await carregarLancamentos7Dias();
  } catch (e) {
    erro.value = e?.message || "Erro ao atualizar transporte.";
  } finally {
    carregando.value = false;
  }
}

async function excluirTransporte(t) {
  limparMsgs();
  if (!confirm("Confirma excluir este transporte?")) return;

  carregando.value = true;
  try {
    const http = getAxios();
    const resp = await http.delete(`transporte_excluir.php?id=${t.id}`);
    if (!resp.data?.success) throw new Error(resp.data?.message || "Falha ao excluir transporte.");

    sucesso.value = "Transporte excluído.";
    await carregarLancamentos7Dias();
  } catch (e) {
    erro.value = e?.message || "Erro ao excluir transporte.";
  } finally {
    carregando.value = false;
  }
}

// ========= DESPESAS =========
function onFileChange(e) {
  const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
  despesaFotoFile.value = f;
  despesaFotoNome.value = f ? f.name : "";
}

async function salvarDespesa() {
  limparMsgs();

  if (!despesa.value.descricao || !despesa.value.descricao.trim()) {
    erro.value = "Descrição é obrigatória.";
    return;
  }
  const v = Number(despesa.value.valor || 0);
  if (!(v > 0)) {
    erro.value = "Valor deve ser maior que zero.";
    return;
  }
  if (!despesaFotoFile.value) {
    erro.value = "Foto do cupom fiscal é obrigatória.";
    return;
  }

  carregando.value = true;
  try {
    const base = apiBase.value;
    const idFunc = idFuncionario.value;

    const fd = new FormData();
    fd.append("data_ref", dataHoje);
    fd.append("descricao", despesa.value.descricao.trim());
    fd.append("valor", String(v));
    fd.append("foto", despesaFotoFile.value);

    const resp = await axios.post(base + "despesa_criar.php", fd, {
      headers: {
        "X-Id-Funcionario": idFunc,
        "Content-Type": "multipart/form-data"
      },
      timeout: 30000
    });

    if (!resp.data?.success) throw new Error(resp.data?.message || "Falha ao salvar despesa.");

    sucesso.value = "Despesa salva.";
    despesa.value = { descricao: "", valor: 0 };
    despesaFotoFile.value = null;
    despesaFotoNome.value = "";

    await carregarDespesas7Dias();
  } catch (e) {
    erro.value = e?.message || "Erro ao salvar despesa.";
  } finally {
    carregando.value = false;
  }
}

async function excluirDespesa(d) {
  limparMsgs();

  if (d.data_ref !== dataHoje) {
    erro.value = "Só é permitido excluir despesas de hoje.";
    return;
  }
  if (!confirm("Confirma excluir esta despesa?")) return;

  carregando.value = true;
  try {
    const http = getAxios();
    const resp = await http.delete(`despesa_excluir.php?id=${d.id}`);
    if (!resp.data?.success) throw new Error(resp.data?.message || "Falha ao excluir despesa.");

    sucesso.value = "Despesa excluída.";
    await carregarDespesas7Dias();
  } catch (e) {
    erro.value = e?.message || "Erro ao excluir despesa.";
  } finally {
    carregando.value = false;
  }
}

onMounted(async () => {
  await carregarLancamentos7Dias();
});
</script>
