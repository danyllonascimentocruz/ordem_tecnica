<template>
  <div class="main-bg min-vh-100 pb-5">
    
    <div class="header-fixed d-flex justify-content-between align-items-center px-3 px-md-5 py-2 shadow-sm">
      <img :src="logoPath" alt="Logo" class="header-logo" />
      
      <div class="user-info-header text-center flex-grow-1">
        <span class="user-label-tiny">Histórico de Orçamentos</span> 
      </div>

      <button @click="confirmarSair" class="btn-logout-header" title="Sair do Sistema">
        <i class="bi bi-box-arrow-right"></i>
      </button>
    </div>

    <div class="container animate-in mt-header pt-4" style="max-width: 800px;">
      
      <div v-if="carregando" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2 text-muted small fw-medium text-uppercase ls-1">Carregando orçamentos...</p>
      </div>

      <div v-else>
        <div v-if="orcamentos.length">
          <div 
            v-for="orc in orcamentos" 
            :key="orc.NORCAMENTO" 
            class="card shadow-sm border-0 rounded-4 bg-white mb-5 border-start border-4 border-primary overflow-hidden animate-in"
          >
            <div class="card-body p-4 text-start">
              <div class="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <span class="label-tiny text-muted">CLIENTE</span>
                  <h5 class="fw-bold text-dark mb-0">{{ orc.NOMECLI }}</h5>
                  <div class="small text-primary fw-semibold mt-1">#{{ orc.NORCAMENTO }}</div>
                </div>
                <div class="text-end">
                  <span class="label-tiny text-muted">DATA / VALIDADE</span>
                  <div class="small fw-medium text-dark">{{ formatarData(orc.DATA) }}</div>
                  <div class="ultra-small text-muted text-uppercase fw-bold">Val: {{ orc.VALIDADE }}</div>
                </div>
              </div>

              <div class="bg-light-subtle rounded-3 p-3 mb-4 border shadow-sm">
                <span class="label-tiny text-muted mb-1">INTRODUÇÃO / DESCRIÇÃO</span>
                <p class="small text-dark mb-0 fw-medium" style="line-height: 1.5;">{{ orc.INTRO || 'Nenhuma descrição informada.' }}</p>
              </div>

              <span class="label-tiny text-muted mb-2 d-block">PRODUTOS E MATERIAIS</span>
              <div class="table-responsive rounded-3 border">
                <table class="table table-clean table-zebra align-middle mb-0">
                  <thead class="bg-light">
                    <tr class="small text-muted uppercase">
                      <th class="ps-3 py-2">ID</th>
                      <th>DESCRIÇÃO</th>
                      <th class="text-center">UN</th>
                      <th class="text-end pe-3">QTDE</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in orc.ITENS" :key="item.IDIORCAMENTO">
                      <td class="ps-3 small text-muted fw-bold">{{ item.NPROD }}</td>
                      <td class="small fw-medium text-dark">{{ item.DESCRICAO }}</td>
                      <td class="text-center small text-muted">{{ item.UN }}</td>
                      <td class="text-end pe-3 fw-bold text-primary">{{ item.QTDE }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state py-5 bg-white shadow-sm rounded-4">
          <i class="bi bi-folder-x fs-1 opacity-25 mb-3"></i>
          <p class="m-0 fw-medium">Nenhum orçamento aberto encontrado.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router' // 🔵 Adicionado
import axios from 'axios'
import { API_URL } from '@/services/api'

const router = useRouter() // 🔵 Inicializado
const logoPath = new URL('@/assets/logo.png', import.meta.url).href
const nomeUsuario = ref(localStorage.getItem('nomeUsuario') || 'Vendedor') // 🔵 Adicionado

const orcamentos = ref([])
const carregando = ref(true)
const idVendedor = localStorage.getItem('idFuncionario')

// 🔵 LOGICA DE SAÍDA
const sair = () => { localStorage.clear(); router.push('/') }
const confirmarSair = () => {
  if (confirm("Deseja realmente sair do sistema?")) {
    sair();
  }
}

onMounted(async () => {
  try {
    const { data } = await axios.get(`${API_URL}/orcamento_listar_com_itens.php`, {
      params: { idVendedor }
    })
    if (data.error) { console.error(data.error); return; }
    orcamentos.value = data
  } catch (err) { console.error(err) } finally { carregando.value = false }
})

function formatarData(data) {
  if (!data) return ""
  return new Date(data).toLocaleDateString('pt-BR')
}
</script>

<style scoped>
.main-bg { background-color: #f8fafc; font-family: 'Inter', sans-serif; }

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
.table-clean th { font-size: 0.6rem; color: #94a3b8; padding: 10px 8px; border-bottom: 1px solid #f1f5f9; }
.table-clean td { padding: 12px 8px; border-bottom: 1px solid #f8fafc; }
.table-zebra tbody tr:nth-child(even) { background-color: #fcfdfe; }
.empty-state { text-align: center; color: #cbd5e1; font-size: 0.8rem; text-transform: uppercase; font-weight: 500; }
.ultra-small { font-size: 0.55rem; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-in { animation: fadeIn 0.3s ease-out; }
</style>