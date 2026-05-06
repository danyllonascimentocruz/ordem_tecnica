<template>
  <div class="d-flex flex-column align-items-center bg-light min-vh-100 py-4">
    <div class="w-100" style="max-width: 600px">
      <button class="btn btn-outline-secondary btn-sm mb-3" @click="router.back()">
        ← Voltar
      </button>
      

      <form @submit.prevent="salvarOrcamento" class="card shadow-sm border-0">
        <div class="card-body">

  <!-- Logo centralizado -->
        <div class="text-center mb-3">
          <img
  :src="logoPath"
  alt="Logo Nova Onlyne"
  class="img-fluid"
  style="max-width: 350px; max-height: 200px; object-fit: contain;"
/>
        </div>
<h2 class="h5 text-center mb-4">Novo Orçamento</h2>
          <!-- Cliente -->
          <div class="mb-3">
            <div class="d-flex">
              <div class="me-2" style="width: 80px;">
                <label class="form-label">Código</label>
                <input
                  v-model="orcamento.cliente.IDCLIENTE"
                  type="text"
                  class="form-control"
                  placeholder="Código"
                  readonly
                />
              </div>
              <div class="flex-grow-1">
                <label class="form-label">Nome do Cliente</label>
                <input
                  v-model="filtroCliente"
                  @input="filtrarClientes"
                  ref="clienteInput"
                  class="form-control"
                  placeholder="Digite o nome do cliente"
                  required
                />
              </div>
            </div>

            <!-- Lista de clientes filtrados -->
            <ul class="list-group mt-2" v-if="clientesFiltrados.length">
              <li
                v-for="cliente in clientesFiltrados"
                :key="cliente.IDCLIENTE"
                class="list-group-item d-flex justify-content-between align-items-center"
              >
                <span>{{ cliente.FANTASIA }}</span>
                <button
                  class="btn btn-sm btn-primary"
                  @click.prevent="selecionarCliente(cliente)"
                >
                  Selecionar
                </button>
              </li>
            </ul>
          </div>

          <!-- Descrição -->
          <div class="mb-3">
            <label class="form-label">Descrição do serviço</label>
            <textarea
              v-model="orcamento.descricao"
              class="form-control"
              rows="3"
              required
              placeholder="Detalhes do serviço"
            ></textarea>
          </div>

          <!-- Filtro de produtos -->
          <div class="mb-3">
            <label class="form-label">Buscar Produto</label>
            <input
              v-model="filtroProduto"
              @input="filtrarProdutos"
              ref="produtoInput"
              class="form-control"
              placeholder="Digite descrição ou ID do produto"
            />
          </div>

          <!-- Lista de produtos filtrados -->
          <ul class="list-group mb-3" v-if="produtosFiltrados.length">
            <li
              v-for="produto in produtosFiltrados"
              :key="produto.IDPRODUTO"
              class="list-group-item d-flex justify-content-between align-items-center"
            >
              <span>{{ produto.IDPRODUTO }} - {{ produto.DESCRICAO }}</span>
              <button class="btn btn-sm btn-primary" @click.prevent="adicionarProduto(produto)">
                Adicionar
              </button>
            </li>
          </ul>

          <!-- Produtos selecionados -->
          <div v-if="orcamento.produtos.length">
            <h6>Produtos Selecionados:</h6>
            <ul class="list-group">
              <li
                v-for="(item, index) in orcamento.produtos"
                :key="item.IDPRODUTO"
                class="list-group-item"
              >
                <div class="d-flex justify-content-between align-items-center">
                  <span>
                    {{ item.IDPRODUTO }} - {{ item.DESCRICAO }}
                    <span class="text-danger">({{ item.UNCOMPRA }})</span>
                  </span>
                  <button class="btn btn-sm btn-danger" @click.prevent="removerProduto(index)">
                    Remover
                  </button>
                </div>
                <div class="d-flex align-items-center mt-2">
                  <label class="form-label mb-0 me-2">Quantidade:</label>
                  <input
                    type="number"
                    min="1"
                    v-model.number="item.quantidade"
                    class="form-control form-control-sm"
                    style="max-width: 100px;"
                  />
                </div>
              </li>
            </ul>
          </div>

          <!-- Botão -->
         <!-- Botão -->
<div class="d-grid mt-4">
  <button
    type="button"
    class="btn text-white fw-semibold py-3"
    style="background:#04A5D1;"
    @click="confirmarESalvarOrcamento"
  >
    Salvar Orçamento
  </button>
</div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const API_URL = 'https://conexao.novaonlyne.com.br:31405/api/'
const logoPath = new URL('@/assets/logo.png', import.meta.url).href
const orcamento = ref({
  cliente: { IDCLIENTE: '', FANTASIA: '' },
  descricao: '',
  produtos: []
})

const produtos = ref([])
const clientes = ref([])
const filtroProduto = ref('')
const filtroCliente = ref('')
const produtosFiltrados = ref([])
const clientesFiltrados = ref([])

const clienteInput = ref(null)
const produtoInput = ref(null)

onMounted(async () => {
  try {
    const responseProdutos = await axios.get(`${API_URL}produtos_ativos.php`)
    produtos.value = responseProdutos.data.map(p => ({
      ...p,
      PRECOVENDA: parseFloat(p.PRECOVENDA) || 0,
      quantidade: 1
    }))
    const responseClientes = await axios.get(`${API_URL}clientes_ativos.php`)
    clientes.value = responseClientes.data
  } catch (error) {
    console.error('Erro ao carregar dados:', error)
    alert('Erro ao carregar dados.')
  }
})

function filtrarClientes() {
  const filtro = filtroCliente.value.trim().toLowerCase()
  if (!filtro) {
    clientesFiltrados.value = []
    return
  }

  clientesFiltrados.value = clientes.value.filter(c =>
    (c.FANTASIA && c.FANTASIA.toLowerCase().includes(filtro)) ||
    (c.IDCLIENTE && String(c.IDCLIENTE).includes(filtro))
  )
}

function selecionarCliente(cliente) {
  orcamento.value.cliente = cliente
  filtroCliente.value = cliente.FANTASIA
  clientesFiltrados.value = []
}

function filtrarProdutos() {
  const filtro = filtroProduto.value.trim().toLowerCase()
  if (!filtro) {
    produtosFiltrados.value = []
    return
  }

  produtosFiltrados.value = produtos.value.filter(p =>
    (p.DESCRICAO && p.DESCRICAO.toLowerCase().includes(filtro)) ||
    (p.IDPRODUTO && String(p.IDPRODUTO).includes(filtro))
  )
}

function adicionarProduto(produto) {
  if (!orcamento.value.produtos.find(p => p.IDPRODUTO === produto.IDPRODUTO)) {
    orcamento.value.produtos.push({ ...produto, quantidade: 1 })
  }
  filtroProduto.value = ''
  produtosFiltrados.value = []
  if (produtoInput.value) {
    produtoInput.value.focus()
  }
}

function confirmarESalvarOrcamento() {
  if (confirm('Deseja finalizar o orçamento?')) {
    salvarOrcamento()
  }
}

function removerProduto(index) {
  orcamento.value.produtos.splice(index, 1)
}

async function salvarOrcamento() {
  try {
    const idVendedor = localStorage.getItem('idFuncionario')
    const nomeVendedor = localStorage.getItem('nomeUsuario')

    await axios.post(`${API_URL}orcamento_salvar.php`, {
      cliente: orcamento.value.cliente,
      descricao: orcamento.value.descricao,
      produtos: orcamento.value.produtos,
      idVendedor,
      nomeVendedor
    })

    alert('Orçamento salvo com sucesso!')
    router.back()
  } catch (error) {
    console.error('Erro ao salvar orçamento:', error)
    alert('Erro ao salvar orçamento.')
  }
}
</script>
