<template>
  <div class="container py-4">
    <h2 class="h5 fw-bold mb-3">Calendário — Agendamentos (Semana)</h2>

    <!-- Filtros -->
    <div class="d-flex align-items-end gap-2 flex-wrap mb-2">
      <div>
        <label class="form-label mb-1">De</label>
        <input v-model="dataDe" type="date" class="form-control" style="width: 180px" />
      </div>
      <div>
        <label class="form-label mb-1">Até</label>
        <input v-model="dataAte" type="date" class="form-control" style="width: 180px" />
      </div>

      <div style="min-width: 260px">
        <label class="form-label mb-1">Técnico (opcional)</label>
        <select v-model="filtroTecnico" class="form-select">
          <option :value="0">Todos</option>
          <option v-for="f in funcionarios" :key="f.id" :value="f.id">{{ f.nome }}</option>
        </select>
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary" @click="semanaAnterior">Semana anterior</button>
        <button class="btn btn-outline-secondary" @click="semanaAtual">Semana atual</button>
        <button class="btn btn-outline-secondary" @click="proximaSemana">Próxima semana</button>

        <button class="btn btn-primary" :disabled="loading" @click="buscar">
          <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
          Buscar
        </button>
      </div>
    </div>

    <!-- Legenda completa + badges -->
    <div class="legend-bar mb-3">
      <div class="legend-item" v-for="l in legendItems" :key="l.key">
        <span class="legend-line" :style="{ background: l.color }"></span>
        <span class="legend-text">{{ l.label }}</span>
      </div>

      <div class="ms-auto d-flex align-items-center gap-2 flex-wrap">
        <span class="badge text-bg-primary">Período: {{ fmtDateBR(iniSemana) }} a {{ fmtDateBR(fimSemana) }}</span>
        <span class="badge text-bg-info">Agendamentos: {{ itens.length }}</span>
      </div>
    </div>

    <div v-if="!loading && dias.length === 0" class="alert alert-secondary">
      Selecione um período válido.
    </div>

    <!-- Grade semanal (5 colunas: Seg–Sex) -->
    <div class="week-grid" v-if="dias.length">
      <div v-for="d in dias" :key="d" class="day-col">
        <div class="day-header">
          <div class="fw-bold">{{ nomeDiaSemana(d) }}</div>
          <div class="small text-muted">{{ fmtDateBR(d) }}</div>
        </div>

        <div v-if="itensPorDia[d]?.length" class="day-body">
          <button
            v-for="ch in itensPorDia[d]"
            :key="String(ch.nordem) + '-' + String(ch.horaini||'')"
            class="os-card"
            type="button"
            @click="abrirDetalhe(ch)"
            :title="`${ch.fantasia || ''}`"
          >
            <!-- faixa lateral mais grossa -->
            <span class="os-accent" :style="{ background: statusColor(ch.situacao) }"></span>

            <div class="os-content">
              <!-- Linha 1: OS + Cliente (sem status para não cortar) -->
              <div class="os-title">
                <span class="os-num">#{{ ch.nordem }}</span>
                <span class="os-cli">— {{ ch.fantasia || '—' }}</span>
              </div>

              <!-- Linha 2: Horários organizados -->
              <div class="os-meta small text-muted">
                <span>Ag.: <strong>{{ fmtHora(ch.horaini) }}</strong></span>
                <span v-if="ch.hr_entrada"> • Ent.: <strong>{{ fmtHora(ch.hr_entrada) }}</strong></span>
              </div>

              <!-- Execução (faixa) - mantém seu padrão, mas prioriza o agregado por técnico -->
              <div class="os-meta small text-muted" v-if="execTecLabel(ch)">
                Exec.: <strong>{{ execTecLabel(ch) }}</strong>
              </div>

              <div class="os-meta small text-muted" v-else-if="ch.hr_exec_ini || ch.hr_exec_fim">
                Exec.: <strong>{{ fmtHora(ch.hr_exec_ini) }}</strong>
                <span v-if="ch.hr_exec_fim"> → <strong>{{ fmtHora(ch.hr_exec_fim) }}</strong></span>
              </div>

              <!-- Linha 3: Técnico (mantém, mas se tiver mais de um, mostra consolidado) -->
              <div class="os-meta small text-muted">
                {{ tecnicosLabel(ch) || (ch.nome_tecnico || 'Sem Técnico') }}
              </div>
            </div>
          </button>
        </div>

        <div v-else class="day-empty text-muted small">
          Sem agendamentos.
        </div>
      </div>
    </div>

    <!-- MODAL / OVERLAY DETALHE -->
    <div v-if="modalVisible" class="overlay" @click.self="fecharModal">
      <div class="modal-card">
        <div class="modal-header">
          <div class="d-flex align-items-center gap-2">
            <span class="modal-accent" :style="{ background: statusColor(det?.situacao) }"></span>
            <div>
              <div class="fw-bold">
                OS #{{ det?.nordem }} — {{ det?.nomecliente || det?.fantasia || '—' }}
              </div>
              <div class="small text-muted">
                {{ statusLabel(det?.situacao) }}
              </div>
            </div>
          </div>

          <button class="btn btn-sm btn-outline-secondary" @click="fecharModal">Fechar</button>
        </div>

        <div class="modal-body">
          <div v-if="detLoading" class="py-3">
            <span class="spinner-border spinner-border-sm me-2"></span>
            Carregando detalhes...
          </div>

          <div v-else>
            <!-- RESUMO -->
            <div class="section">
              <div class="section-title">Resumo</div>
              <div class="section-grid">
                <div>
                  <div class="k">Data/Hora agendada</div>
                  <div class="v">{{ fmtDateBR(det?.dataentrega) }} {{ fmtHora(det?.horaini) }}</div>
                </div>
                <div>
                  <div class="k">Técnico</div>
                  <div class="v">{{ det?.nome_tecnico || detTecnicosLabel || 'Sem Técnico' }}</div>
                </div>

                <div>
                  <div class="k">Entrada (último Iniciar)</div>
                  <div class="v">
                    <template v-if="detEntradaPorTecnico.length">
                      <div v-if="detEntradaPorTecnico.length === 1">
                        {{ detEntradaPorTecnico[0].label }}
                      </div>
                      <div v-else>
                        <div v-for="t in detEntradaPorTecnico" :key="`${t.idtecnico}-${t.tecnico}`">
                          <strong>{{ t.tecnico || ('ID ' + t.idtecnico) }}:</strong> {{ t.label }}
                        </div>
                      </div>
                    </template>
                    <span v-else>—</span>
                  </div>
                </div>

                <div>
                  <div class="k">Execução (faixa)</div>
                  <div class="v">
                    <template v-if="detExecPorTecnico.length">
                      <div v-if="detExecPorTecnico.length === 1">
                        {{ detExecPorTecnico[0].label }}
                      </div>
                      <div v-else>
                        <div v-for="t in detExecPorTecnico" :key="`${t.idtecnico}-${t.tecnico}`">
                          <strong>{{ t.tecnico || ('ID ' + t.idtecnico) }}:</strong> {{ t.label }}
                        </div>
                      </div>
                    </template>
                    <span v-else>—</span>
                  </div>
                </div>

                <div class="col-span-2">
                  <div class="k">Endereço</div>
                  <div class="v">{{ det?.endereco || '—' }}</div>
                </div>
              </div>
            </div>

            <!-- DESCRIÇÃO / DEFEITO / REPARO -->
            <div class="section">
              <div class="section-title">Descrição / Serviço</div>
              <div class="section-grid">
                <div class="col-span-2">
                  <div class="k">Solicitante</div>
                  <div class="v">{{ det?.solicitante || '—' }}</div>
                </div>
                <div class="col-span-2">
                  <div class="k">Descrição</div>
                  <div class="v pre">{{ det?.descricao || '—' }}</div>
                </div>
                <div class="col-span-2">
                  <div class="k">Defeito</div>
                  <div class="v pre">{{ det?.defeito || '—' }}</div>
                </div>
                <div class="col-span-2">
                  <div class="k">Reparo</div>
                  <div class="v pre">{{ det?.reparo || '—' }}</div>
                </div>
              </div>
            </div>

            <!-- OSHORAS -->

<div class="section">
  <div class="section-title">Horas lançadas (OSHORAS)</div>

  <div v-if="detOshorasPorTecnico.length">
    <div v-for="tec in detOshorasPorTecnico" :key="`${tec.idtecnico}-${tec.tecnico}`" class="mb-3">
      <div class="small fw-semibold mb-1">
        Técnico: {{ tec.tecnico || ('ID ' + tec.idtecnico) }}
      </div>

      <div class="tbl">
        <div class="tbl-row tbl-head">
          <div>Data</div>
          <div>Início</div>
          <div>Fim</div>
        </div>
        <div class="tbl-row" v-for="(h, i) in tec.itens" :key="i">
          <div>{{ fmtDateBR(h.DATA || h.data) }}</div>
          <div>{{ fmtHora(h.HORAINI || h.horaini) }}</div>
          <div>{{ fmtHora(h.HORAFIN || h.horafin) }}</div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-muted small">Sem OSHORAS.</div>
</div>

            
<!-- LOGIN_OSONLYNE -->
            <div class="section">
              <div class="section-title">Histórico (LOGIN_OSONLYNE)</div>

              <div v-if="detLoginsPorTecnico.length">
                <div v-for="tec in detLoginsPorTecnico" :key="`${tec.idtecnico}-${tec.tecnico}`" class="mb-3">
                  <div class="small fw-semibold mb-1">
                    Técnico: {{ tec.tecnico || ('ID ' + tec.idtecnico) }}
                  </div>

                  <div class="tbl">
                    <div class="tbl-row tbl-head">
                      <div>Data</div>
                      <div>Hora</div>
                      <div>Ação</div>
                    </div>
                    <div class="tbl-row" v-for="(l, i) in tec.itens" :key="i">
                      <div>{{ fmtDateBR(l.DATA || l.data || l.DATAHORA || l.datahora) }}</div>
                      <div>{{ fmtHora(l.HORA || l.hora || l.DATAHORA || l.datahora) }}</div>
                      <div>{{ l.ACAO || l.acao || l.TP_ACAO || l.tp_acao || '—' }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-muted small">Sem registros em LOGIN_OSONLYNE.</div>
            </div>
            </div>
          </div>
        </div>
      </div>

    <!-- Toast -->
    <div
      v-if="toastVisible"
      role="toast"
      class="position-fixed bottom-0 start-50 translate-middle-x mb-3 px-3 py-2 bg-dark text-white rounded"
      style="z-index: 1080;"
    >
      {{ toastMsg }}
    </div>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'

const API_URL = 'https://conexao.novaonlyne.com.br:31405/api/'

const loading = ref(false)
const itens = ref([])

const funcionarios = ref([])
const filtroTecnico = ref(0)

const dataDe = ref(new Date().toISOString().slice(0, 10))
const dataAte = ref(new Date().toISOString().slice(0, 10))

/* ====== Helpers de data ====== */
function parseDateLocal(yyyy_mm_dd) {
  const [y, m, d] = String(yyyy_mm_dd).split('T')[0].split(' ')[0].split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}
function toISODate(dt) {
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const d = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
function startOfWeekMonday(yyyy_mm_dd) {
  const dt = parseDateLocal(yyyy_mm_dd)
  const day = dt.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  dt.setDate(dt.getDate() + diff)
  return toISODate(dt)
}
function addDays(yyyy_mm_dd, n) {
  const dt = parseDateLocal(yyyy_mm_dd)
  dt.setDate(dt.getDate() + n)
  return toISODate(dt)
}

/* Semana útil: Seg–Sex */
const iniSemana = computed(() => startOfWeekMonday(dataDe.value))
const fimSemana = computed(() => addDays(iniSemana.value, 4))

watch(iniSemana, (v) => {
  if (!dataAte.value || dataAte.value < v || dataAte.value > fimSemana.value) {
    dataAte.value = fimSemana.value
  }
})

const dias = computed(() => {
  const ini = iniSemana.value
  if (!ini) return []
  return Array.from({ length: 5 }, (_, i) => addDays(ini, i))
})

function fmtDateBR(yyyy_mm_dd) {
  if (!yyyy_mm_dd) return '—'
  const [y, m, d] = String(yyyy_mm_dd).split('T')[0].split('-')
  if (!y || !m || !d) return yyyy_mm_dd
  return `${d}/${m}/${y}`
}
function fmtHora(hhmmss) {
  if (!hhmmss) return '—'
  return String(hhmmss).slice(0, 5)
}
function nomeDiaSemana(yyyy_mm_dd) {
  const dt = parseDateLocal(yyyy_mm_dd)
  const nomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  return nomes[dt.getDay()]
}

/* ===== [ADD] Abreviação e normalização ===== */
function abreviaNome(nome, max = 12) {
  if (!nome) return 'Sem técnico'
  const parts = String(nome).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'Sem técnico'
  if (parts.length === 1) return parts[0].slice(0, max)
  return (parts[0] + ' ' + parts[parts.length - 1]).slice(0, max)
}
function normDia(v) {
  return String(v || '').split('T')[0]
}
function normHora(v) {
  if (!v) return ''
  return String(v).slice(0, 5)
}

/* ===== Status ===== */
const STATUS_COLORS = {
  1: { bg: '#0d6efd' },
  2: { bg: '#20c997' },
  3: { bg: '#ffc107' },
  4: { bg: '#fd7e14' },
  5: { bg: '#198754' },
  6: { bg: '#6f42c1' },
  7: { bg: '#dc3545' },
  8: { bg: '#0dcaf0' },
  9: { bg: '#343a40' },
}
function statusCode(situacao) {
  const s = String(situacao || '')
  const m = s.match(/^(\d+)/)
  return m ? parseInt(m[1], 10) : null
}
function statusColor(situacao) {
  const code = statusCode(situacao)
  return STATUS_COLORS[code]?.bg || '#adb5bd'
}
function statusLabel(situacao) {
  const code = statusCode(situacao)
  if (!code) return String(situacao || '—')
  const map = {
    1: '1. Atendimento',
    2: '2. Agendado',
    3: '3. Não atendido',
    4: '4. Em rota',
    5: '5. Pendente',
    6: '6. Reagendado',
    7: '7. A baixar',
    8: '8. Outros',
    9: '9. A faturar',
  }
  return map[code] || String(situacao || '—')
}
const legendItems = computed(() => ([
  { key: 1, label: '1. Atendimento',   color: STATUS_COLORS[1].bg },
  { key: 2, label: '2. Agendado',      color: STATUS_COLORS[2].bg },
  { key: 3, label: '3. Não atendido',  color: STATUS_COLORS[3].bg },
  { key: 4, label: '4. Em rota',       color: STATUS_COLORS[4].bg },
  { key: 5, label: '5. Pendente',      color: STATUS_COLORS[5].bg },
  { key: 6, label: '6. Reagendado',    color: STATUS_COLORS[6].bg },
  { key: 7, label: '7. A baixar',      color: STATUS_COLORS[7].bg },
  { key: 8, label: '8. Outros',        color: STATUS_COLORS[8].bg },
  { key: 9, label: '9. A faturar',     color: STATUS_COLORS[9].bg },
]))

/* ===== Agrupamento por dia (SEU ORIGINAL) ===== */
const itensPorDia = computed(() => {
  const map = {}
  for (const d of dias.value) map[d] = []

  for (const it of itens.value) {
    const key = String(it.dataentrega || '').split('T')[0]
    if (map[key]) map[key].push(it)
  }

  for (const d of Object.keys(map)) {
    map[d].sort((a, b) => String(a.horaini || '').localeCompare(String(b.horaini || '')))
  }
  return map
})

/* ===== [ADD] Índice: Execução por técnico e Técnicos consolidados (front-only) =====
   Regras:
   - Agrupa por (dia + nordem)
   - Monta: "Leonardo Fer 08:30→17:00 | Luiz Maciel 11:00→17:10"
   - Só aparece quando existir mais de um técnico OU quando existir pelo menos 1 faixa válida
*/
const execTecByDiaOS = computed(() => {
  const idx = new Map()

  // junta linhas por dia+nordem
  const bucket = new Map()
  for (const it of itens.value) {
    const dia = normDia(it.dataentrega)
    const os = String(it.nordem ?? it.NORDEM ?? '').trim()
    if (!dia || !os) continue
    const k = `${dia}__${os}`
    if (!bucket.has(k)) bucket.set(k, [])
    bucket.get(k).push(it)
  }

  for (const [k, rows] of bucket.entries()) {
    // por técnico: menor ini / maior fim
    const tecMap = new Map()

    for (const r of rows) {
      const nome = abreviaNome(r.nome_tecnico || r.NOME_TECNICO || 'Sem técnico', 18)
      const ini = normHora(r.hr_exec_ini || r.HR_EXEC_INI || r.hr_exec_ini_dia || r.HR_EXEC_INI_DIA)
      const fim = normHora(r.hr_exec_fim || r.HR_EXEC_FIM || r.hr_exec_fim_dia || r.HR_EXEC_FIM_DIA)

      // se não tem execução nessa linha, ignora
      if (!ini && !fim) continue

      if (!tecMap.has(nome)) tecMap.set(nome, { nome, ini: ini || null, fim: fim || null })
      const cur = tecMap.get(nome)
      if (ini) cur.ini = !cur.ini || ini < cur.ini ? ini : cur.ini
      if (fim) cur.fim = !cur.fim || fim > cur.fim ? fim : cur.fim
    }

    const tecs = Array.from(tecMap.values()).sort((a, b) => a.nome.localeCompare(b.nome))

    // label exec por técnico
    const execLabel = tecs.length
      ? tecs.map(t => `${t.nome} ${t.ini || '—'}→${t.fim || '—'}`).join(' | ')
      : ''

    // label técnicos consolidado (mesmo se não tiver exec)
    const nomesTec = Array.from(new Set(
      rows.map(r => abreviaNome(r.nome_tecnico || r.NOME_TECNICO || 'Sem técnico', 18))
    )).filter(Boolean)

    let tecLabel = ''
    if (nomesTec.length === 1) tecLabel = nomesTec[0]
    else if (nomesTec.length === 2) tecLabel = `${nomesTec[0]} / ${nomesTec[1]}`
    else if (nomesTec.length > 2) tecLabel = `${nomesTec[0]} / ${nomesTec[1]} +${nomesTec.length - 2}`

    idx.set(k, { execLabel, tecLabel, tecCount: nomesTec.length })
  }

  return idx
})

function execTecLabel(ch) {
  const dia = normDia(ch?.dataentrega)
  const os = String(ch?.nordem ?? ch?.NORDEM ?? '').trim()
  if (!dia || !os) return ''
  const k = `${dia}__${os}`
  const item = execTecByDiaOS.value.get(k)
  // só mostra se houver label (ou seja, houve execução detectada)
  return item?.execLabel || ''
}

function tecnicosLabel(ch) {
  const dia = normDia(ch?.dataentrega)
  const os = String(ch?.nordem ?? ch?.NORDEM ?? '').trim()
  if (!dia || !os) return ''
  const k = `${dia}__${os}`
  const item = execTecByDiaOS.value.get(k)

  // Só “força” o consolidado se tiver mais de 1 técnico
  if (item?.tecCount > 1) return item.tecLabel
  return ''
}

/* Toast */
const toastVisible = ref(false)
const toastMsg = ref('')
let toastTimer = null
function showToast(msg, ms = 2500) {
  toastMsg.value = msg
  toastVisible.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastVisible.value = false), ms)
}

/* ===== Modal detalhe ===== */
const modalVisible = ref(false)
const detLoading = ref(false)
const det = ref(null)
const detOshoras = ref([])
const detLogins = ref([])

function normTecId(v) {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : 0
}
function normTecNome(v) {
  return (v ?? '').toString().trim()
}
function groupByTecnico(lista) {
  const map = new Map()
  for (const it of (Array.isArray(lista) ? lista : [])) {
    const id = normTecId(it.IDTECNICO ?? it.idtecnico)
    const nome = normTecNome(it.TECNICO ?? it.tecnico)
    const key = `${id}::${nome}`
    if (!map.has(key)) map.set(key, { idtecnico: id, tecnico: nome, itens: [] })
    map.get(key).itens.push(it)
  }
  return Array.from(map.values()).sort((a,b) => (a.tecnico || '').localeCompare(b.tecnico || ''))
}

const detOshorasPorTecnico = computed(() => groupByTecnico(detOshoras.value))
const detLoginsPorTecnico = computed(() => groupByTecnico(detLogins.value))


const detExecPorTecnico = computed(() => {
  // A partir das OSHORAS (agrupadas por técnico no front)
  const out = []
  for (const t of detOshorasPorTecnico.value) {
    const itens = Array.isArray(t.itens) ? t.itens : []
    if (itens.length === 0) continue

    // pega a data mais recente do técnico (YYYY-MM-DD ou Date)
    const datas = itens.map(x => (x.DATA || x.data)).filter(Boolean).map(String)
    datas.sort() // ISO ordena lexical
    const dataRef = datas[datas.length - 1]

    // faixa no dia mais recente
    const doDia = itens.filter(x => String(x.DATA || x.data) === dataRef)
    const inis = doDia.map(x => fmtHora(x.HORAINI || x.horaini)).filter(Boolean)
    const fins = doDia.map(x => fmtHora(x.HORAFIN || x.horafin)).filter(Boolean)
    inis.sort()
    fins.sort()

    const ini = inis[0] || null
    const fim = fins.length ? fins[fins.length - 1] : null

    if (ini || fim) {
      const label = ini && fim ? `${ini} → ${fim}` : (ini ? `${ini} →` : `→ ${fim}`)
      out.push({ idtecnico: t.idtecnico, tecnico: t.tecnico, label, data: dataRef })
    }
  }
  return out
})

const detEntradaPorTecnico = computed(() => {
  // A partir do histórico (LOGIN), procura a última ação de iniciar/start por técnico
  const out = []
  for (const t of detLoginsPorTecnico.value) {
    const itens = Array.isArray(t.itens) ? t.itens : []
    if (itens.length === 0) continue

    let escolhido = null
    for (const it of itens) {
      const acao = String(it.ACAO || it.acao || '').toUpperCase()
      if (acao.includes('INICI') || acao.includes('START')) {
        escolhido = it
        break
      }
    }
    if (!escolhido) continue

    // DATAHORA pode vir como timestamp ou pode vir DATA + HORA
    const dt = escolhido.DATAHORA || escolhido.datahora || escolhido.DATA || escolhido.data || null
    const hr = escolhido.HORA || escolhido.hora || null

    let label = '—'
    if (dt && hr) label = `${fmtDateBR(dt)} ${fmtHora(hr)}`
    else if (dt) label = `${fmtDateBR(dt)}`
    else if (hr) label = `${fmtHora(hr)}`

    out.push({ idtecnico: t.idtecnico, tecnico: t.tecnico, label })
  }
  return out
})
const detTecnicosLabel = computed(() => {
  const nomes = detOshorasPorTecnico.value.map(t => t.tecnico).filter(Boolean)
  if (nomes.length === 0) return 'Sem Técnico'
  const unq = Array.from(new Set(nomes))
  if (unq.length === 1) return unq[0]
  return unq.join(' / ')
})

function fecharModal() {
  modalVisible.value = false
  det.value = null
  detOshoras.value = []
  detLogins.value = []
  detLoading.value = false
}

async function abrirDetalhe(ch) {
  modalVisible.value = true
  det.value = { ...ch } // mostra o básico já
  detOshoras.value = []
  detLogins.value = []

  detLoading.value = true
  try {
    const { data } = await axios.get(`${API_URL}ordem_detalhe.php`, { params: { nordem: ch.nordem } })
    if (data?.success) {
      const base = data.item || data.data || null
      det.value = base ? { ...base, ...(data.derived || {}) } : null
      detOshoras.value = Array.isArray(data.oshora) ? data.oshora : []
      detLogins.value = Array.isArray(data.logins) ? data.logins : (Array.isArray(data.logins_flat) ? data.logins_flat : [])
    } else {
      showToast(data?.message || 'Falha ao carregar detalhe.')
    }
  } catch {
    showToast('Erro ao carregar detalhe do chamado.')
  } finally {
    detLoading.value = false
  }
}

/* ====== API ====== */
async function carregarFuncionarios() {
  try {
    const viewer = parseInt(localStorage.getItem('idFuncionario') || '0', 10)
    const { data } = await axios.get(`${API_URL}get_funcionarios.php`, { params: { viewer } })
    if (data?.success) {
      const rows = Array.isArray(data.funcionarios) ? data.funcionarios : []
      funcionarios.value = rows
        .map(f => ({ id: Number(f.id ?? f.ID ?? 0), nome: String(f.nome ?? f.NOME ?? '') }))
        .filter(x => x.id && x.nome)
    }
  } catch {}
}

async function buscar() {
  loading.value = true
  try {
    const params = {
      data_ini: dataDe.value,
      data_fim: dataAte.value,
    }
    if (Number(filtroTecnico.value) > 0) params.idtecnico = Number(filtroTecnico.value)

    const { data } = await axios.get(`${API_URL}agendados_por_periodo.php`, { params })
    if (data?.success) {
      itens.value = Array.isArray(data.items) ? data.items : []
    } else {
      itens.value = []
      showToast(data?.message || 'Falha ao carregar agendamentos.')
    }
  } catch {
    itens.value = []
    showToast('Erro ao carregar calendário.')
  } finally {
    loading.value = false
  }
}

/* Navegação de semana */
function semanaAtual() {
  const hoje = new Date()
  dataDe.value = toISODate(hoje)
  buscar()
}
function semanaAnterior() {
  dataDe.value = addDays(iniSemana.value, -7)
  dataAte.value = addDays(startOfWeekMonday(dataDe.value), 4)
  buscar()
}
function proximaSemana() {
  dataDe.value = addDays(iniSemana.value, 7)
  dataAte.value = addDays(startOfWeekMonday(dataDe.value), 4)
  buscar()
}

onMounted(async () => {
  dataDe.value = iniSemana.value
  dataAte.value = fimSemana.value
  await carregarFuncionarios()
  await buscar()
})
</script>

<style scoped>
.week-grid{
  display: grid;
  grid-template-columns: repeat(5, minmax(220px, 1fr));
  gap: 10px;
  align-items: start;
}

.day-col{
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  min-height: 220px;
  overflow: hidden;
}

.day-header{
  padding: 10px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.day-body{
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.day-empty{
  padding: 10px 12px;
}

/* Legenda */
.legend-bar{
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  padding: 8px 10px;
  border: 1px solid #eee;
  border-radius: 12px;
  background: #fff;
}
.legend-item{
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.legend-line{
  width: 18px;
  height: 4px;
  border-radius: 99px;
}
.legend-text{
  font-size: .9rem;
  color: #495057;
}

/* Card do chamado */
.os-card{
  width: 100%;
  text-align: left;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 10px 10px 10px 12px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  display: flex;
  gap: 10px;
  cursor: pointer;
}
.os-card:hover{
  border-color: #e1e5ea;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
}

/* Faixa lateral MAIS GROSSA */
.os-accent{
  width: 10px;
  border-radius: 99px;
  flex: 0 0 10px;
}

.os-content{ flex: 1; min-width: 0; }

.os-title{
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.os-num{ font-weight: 800; }
.os-cli{ font-weight: 600; }

.os-meta{ line-height: 1.2; }

/* Modal overlay */
.overlay{
  position: fixed;
  inset: 0;
  background: rgba(15,23,42,0.55);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.modal-card{
  width: min(980px, 96vw);
  max-height: 88vh;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e9ecef;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.modal-header{
  padding: 12px 14px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.modal-accent{
  width: 10px;
  height: 34px;
  border-radius: 99px;
}
.modal-body{
  padding: 14px;
  overflow: auto;
}
.modal-footer{
  padding: 10px 14px;
  border-top: 1px solid #eee;
  background: #fff;
}

/* Seções */
.section{
  border: 1px solid #eee;
  border-radius: 14px;
  padding: 12px;
  margin-bottom: 12px;
}
.section-title{
  font-weight: 800;
  margin-bottom: 10px;
}
.section-grid{
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 10px 14px;
}
.col-span-2{ grid-column: span 2; }
.k{
  font-size: .78rem;
  color: #6c757d;
}
.v{
  font-size: .95rem;
  color: #212529;
  word-break: break-word;
}
.v.pre{
  white-space: pre-wrap;
}

/* tabelas simples */
.tbl{ border: 1px solid #eee; border-radius: 12px; overflow: hidden; }
.tbl-row{
  display: grid;
  grid-template-columns: 1fr 110px 110px 140px;
  gap: 10px;
  padding: 8px 10px;
  border-top: 1px solid #eee;
  align-items: center;
  font-size: .9rem;
}
.tbl-head{
  background: #f8f9fa;
  font-weight: 700;
  border-top: none;
}
.tbl-row > div{ overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

@media (max-width: 1200px){
  .week-grid{ grid-template-columns: repeat(3, minmax(200px, 1fr)); }
}
@media (max-width: 768px){
  .week-grid{ grid-template-columns: 1fr; }
  .section-grid{ grid-template-columns: 1fr; }
  .col-span-2{ grid-column: auto; }
  .tbl-row{ grid-template-columns: 1fr 90px 90px 110px; }
}

/* Toast auto-hide */
[role="toast"] { animation: fadeout 2.5s forwards; }
@keyframes fadeout { 0%{opacity:1} 85%{opacity:1} 100%{opacity:0} }
</style>