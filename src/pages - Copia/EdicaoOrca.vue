<template>
  <div class="container py-4">
     <!-- Logo centralizado -->
        <div class="text-center mb-3">
          <img
  :src="logoPath"
  alt="Logo Nova Onlyne"
  class="img-fluid"
  style="max-width: 350px; max-height: 200px; object-fit: contain;"
/>
        </div>
 <h2 class="mb-3 text-center">Orçamentos Abertos</h2>

    <div v-if="carregando">Carregando orçamentos...</div>

    <div v-else>
      <div v-if="orcamentos.length">
        <div v-for="orc in orcamentos" :key="orc.NORCAMENTO" class="mb-5 border rounded p-3 shadow-sm">
          <h5>{{ orc.NORCAMENTO }} - {{ orc.NOMECLI }}</h5>
          <p><strong>Data:</strong> {{ formatarData(orc.DATA) }} | <strong>Validade:</strong> {{ orc.VALIDADE }}</p>
          <p><strong>Descrição:</strong> {{ orc.INTRO }}</p>

          <table class="table table-sm table-bordered">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Descrição</th>
                <th>Un</th>
                <th>Qtde</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in orc.ITENS" :key="item.IDIORCAMENTO">
                <td>{{ item.NPROD }}</td>
                <td>{{ item.DESCRICAO }}</td>
                <td>{{ item.UN }}</td>
                <td>{{ item.QTDE }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else class="alert alert-info text-center">Nenhum orçamento encontrado.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
const logoPath = new URL('@/assets/logocinza.png', import.meta.url).href
const API_URL = 'https://conexao.novaonlyne.com.br:31405/api/'   // domínio externo

const orcamentos = ref([])
const carregando = ref(true)
const idVendedor = localStorage.getItem('idFuncionario')

onMounted(async () => {
  try {
    const { data } = await axios.get(`${API_URL}orcamento_listar_com_itens.php`, {
      params: { idVendedor }
    })

    if (data.error) {
      alert(data.error)
      return
    }

    orcamentos.value = data
  } catch (err) {
    console.error(err)
    alert('Erro ao carregar orçamentos.')
  } finally {
    carregando.value = false
  }
})

function formatarData(data) {
  return new Date(data).toLocaleDateString('pt-BR')
}
</script>
