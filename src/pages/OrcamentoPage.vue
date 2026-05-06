<template>
  <div class="main-bg min-vh-100 pb-5">
    
    <div class="header-fixed d-flex justify-content-between align-items-center px-3 px-md-5 py-2 shadow-sm">
      <img :src="logoPath" alt="Logo" class="header-logo" />
      
      <div class="user-info-header text-center flex-grow-1">
        <span class="user-label-tiny">Novo Orçamento</span> 
      </div>

      <button @click="confirmarSair" class="btn-logout-header" title="Sair do Sistema">
        <i class="bi bi-box-arrow-right"></i>
      </button>
    </div>

    <div class="container animate-in mt-header pt-3" style="max-width: 650px;">
      
      <div class="text-start mb-3">
        <button class="btn btn-tiny btn-outline-secondary border-0 text-uppercase ls-1" @click="router.back()">
          <i class="bi bi-arrow-left me-1"></i> Voltar
        </button>
      </div>

      <form @submit.prevent="salvarOrcamento">
        <div class="card shadow-sm border-0 rounded-4 bg-white mb-3 border-start border-4 border-primary">
          <div class="card-body p-4 text-start">
            <div class="row g-3">
              <div class="col-md-3">
                <label class="label-tiny">CÓDIGO</label>
                <input
                  v-model="orcamento.cliente.IDCLIENTE"
                  type="text"
                  class="input-premium-slim bg-light-subtle text-muted fw-bold"
                  readonly
                />
              </div>
              <div class="col-md-9">
                <label class="label-tiny">CLIENTE</label>
                <input
                  v-model="filtroCliente"
                  @input="filtrarClientes"
                  ref="clienteInput"
                  class="input-premium-slim"
                  placeholder="Pesquisar por nome ou código..."
                  required
                />
                <div v-if="clientesFiltrados.length" class="search-results-overlay shadow-lg rounded-3 animate-in">
                  <div
                    v-for="cliente in clientesFiltrados"
                    :key="cliente.IDCLIENTE"
                    class="search-item d-flex justify-content-between align-items-center p-2 border-bottom"
                  >
                    <span class="small fw-medium text-dark">{{ cliente.FANTASIA }}</span>
                    <button class="btn btn-xs btn-primary px-3" @click.prevent="selecionarCliente(cliente)">SELECIONAR</button>
                  </div>
                </div>
              </div>

              <div class="col-12">
                <label class="label-tiny">DESCRIÇÃO DO SERVIÇO</label>
                <textarea
                  v-model="orcamento.descricao"
                  class="input-premium-slim h-auto py-2"
                  rows="3"
                  required
                  placeholder="Detalhes técnicos do serviço a ser realizado..."
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <div class="card shadow-sm border-0 rounded-4 bg-white mb-4 border-start border-4 border-dark">
          <div class="card-body p-4 text-start">
            <label class="label-tiny">ADICIONAR PRODUTOS / PEÇAS</label>
            <div class="input-group-premium mb-3">
              <span class="prefix"><i class="bi bi-search"></i></span>
              <input
                v-model="filtroProduto"
                @input="filtrarProdutos"
                ref="produtoInput"
                class="input-premium-slim border-0"
                placeholder="Digite descrição ou ID do item..."
              />
            </div>

            <div v-if="produtosFiltrados.length" class="search-results-static border rounded-3 mb-3 animate-in">
              <div
                v-for="produto in produtosFiltrados"
                :key="produto.IDPRODUTO"
                class="search-item d-flex justify-content-between align-items-center p-2 border-bottom"
              >
                <div class="d-flex flex-column">
                  <span class="ultra-small text-muted">ID: {{ produto.IDPRODUTO }}</span>
                  <span class="small fw-medium text-dark">{{ produto.DESCRICAO }}</span>
                </div>
                <button class="btn btn-xs btn-dark px-3" @click.prevent="adicionarProduto(produto)">ADICIONAR</button>
              </div>
            </div>

            <div v-if="orcamento.produtos.length" class="mt-2">
              <span class="label-tiny text-muted mb-2 d-block">ITENS SELECIONADOS</span>
              <div class="table-responsive rounded-3 border">
                <table class="table table-clean table-zebra align-middle mb-0">
                  <thead class="bg-light">
                    <tr class="small text-muted uppercase">
                      <th class="ps-3 py-2">PRODUTO</th>
                      <th class="text-center" style="width: 100px;">QTD</th>
                      <th class="text-end pe-3">AÇÃO</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in orcamento.produtos" :key="item.IDPRODUTO">
                      <td class="ps-3">
                        <div class="fw-medium text-dark small">{{ item.DESCRICAO }}</div>
                        <div class="ultra-small text-muted">{{ item.IDPRODUTO }} | UN: {{ item.UNCOMPRA }}</div>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          v-model.number="item.quantidade"
                          class="input-premium-slim text-center py-1 h-auto"
                        />
                      </td>
                      <td class="text-end pe-3">
                        <button class="btn btn-sm text-danger border-0" @click.prevent="removerProduto(index)">
                          <i class="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-else class="empty-state py-4">Nenhum produto adicionado.</div>
          </div>
        </div>

        <div class="d-grid gap-2 animate-in">
          <button
            type="button"
            class="btn btn-premium-blue py-3 shadow-sm text-uppercase ls-1"
            @click="confirmarESalvarOrcamento"
          >
            Finalizar Orçamento
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { API_URL } from '@/services/api'

const router = useRouter()
const logoPath = new URL('@/assets/logo.png', import.meta.url).href
const nomeUsuario = ref(localStorage.getItem('nomeUsuario') || 'Vendedor') // 🔵 Adicionado

// 🔵 LOGICA DE SAÍDA
const sair = () => { localStorage.clear(); router.push('/') }
const confirmarSair = () => {
  if (confirm("Deseja realmente sair do sistema?")) {
    sair();
  }
}

// ESTADOS DO ORÇAMENTO (ORIGINAIS)
const orcamento = ref({ cliente: { IDCLIENTE: '', FANTASIA: '' }, descricao: '', produtos: [] })
const produtos = ref([]), clientes = ref([]), filtroProduto = ref(''), filtroCliente = ref('')
const produtosFiltrados = ref([]), clientesFiltrados = ref([]), clienteInput = ref(null), produtoInput = ref(null)

onMounted(async () => {
  try {
    const responseProdutos = await axios.get(`${API_URL}/produtos_ativos.php`)
    produtos.value = responseProdutos.data.map(p => ({ ...p, PRECOVENDA: parseFloat(p.PRECOVENDA) || 0, quantidade: 1 }))
    const responseClientes = await axios.get(`${API_URL}/clientes_ativos.php`)
    clientes.value = responseClientes.data
  } catch (error) { console.error('Erro ao carregar dados:', error) }
})

function filtrarClientes() {
  const filtro = filtroCliente.value.trim().toLowerCase()
  if (!filtro) { clientesFiltrados.value = []; return; }
  clientesFiltrados.value = clientes.value.filter(c => (c.FANTASIA && c.FANTASIA.toLowerCase().includes(filtro)) || (c.IDCLIENTE && String(c.IDCLIENTE).includes(filtro))).slice(0, 8);
}
function selecionarCliente(cliente) { orcamento.value.cliente = cliente; filtroCliente.value = cliente.FANTASIA; clientesFiltrados.value = []; }
function filtrarProdutos() {
  const filtro = filtroProduto.value.trim().toLowerCase()
  if (!filtro) { produtosFiltrados.value = []; return; }
  produtosFiltrados.value = produtos.value.filter(p => (p.DESCRICAO && p.DESCRICAO.toLowerCase().includes(filtro)) || (p.IDPRODUTO && String(p.IDPRODUTO).includes(filtro))).slice(0, 5);
}
function adicionarProduto(produto) {
  if (!orcamento.value.produtos.find(p => p.IDPRODUTO === produto.IDPRODUTO)) { orcamento.value.produtos.push({ ...produto, quantidade: 1 }) }
  filtroProduto.value = ''; produtosFiltrados.value = []; if (produtoInput.value) { produtoInput.value.focus(); }
}
function confirmarESalvarOrcamento() { if (confirm('Deseja finalizar o orçamento?')) { salvarOrcamento(); } }
function removerProduto(index) { orcamento.value.produtos.splice(index, 1); }
async function salvarOrcamento() {
  try {
    const idVendedor = localStorage.getItem('idFuncionario'), nomeVendedor = localStorage.getItem('nomeUsuario')
    await axios.post(`${API_URL}/orcamento_salvar.php`, { cliente: orcamento.value.cliente, descricao: orcamento.value.descricao, produtos: orcamento.value.produtos, idVendedor, nomeVendedor })
    alert('Orçamento salvo com sucesso!'); router.back()
  } catch (error) { alert('Erro ao salvar orçamento.') }
}
</script>

<style scoped>
.main-bg { background-color: #f8fafc; font-family: 'Inter', sans-serif; }

/* 🔵 HEADER FIXO PADRONIZADO */
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

/* Estilos originais */
.label-tiny { font-size: 0.52rem; font-weight: 700; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 3px; display: block; }
.input-premium-slim { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; font-size: 0.85rem; width: 100%; height: 42px; outline: none; background: #fff; transition: 0.2s; }
.input-group-premium { display: flex; align-items: center; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
.btn-premium-blue { background: #00A7CF; color: white; border: none; border-radius: 10px; font-size: 0.8rem; font-weight: 600; }
.table-clean th { font-size: 0.6rem; color: #94a3b8; padding: 10px 8px; border-bottom: 1px solid #f1f5f9; }
.table-clean td { padding: 10px 8px; border-bottom: 1px solid #f8fafc; }
.empty-state { text-align: center; color: #cbd5e1; font-size: 0.7rem; text-transform: uppercase; font-weight: 500; }
.ultra-small { font-size: 0.55rem; }
.ls-1 { letter-spacing: 1px; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-in { animation: fadeIn 0.3s ease-out; }
</style>