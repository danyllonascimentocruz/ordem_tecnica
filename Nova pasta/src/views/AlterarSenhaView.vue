<template>
  <div class="p-4 max-w-md mx-auto">
    <h1 class="text-xl font-bold mb-4">Alterar Senha</h1>
    <input v-model="usuario" placeholder="Usuário" class="w-full p-2 border rounded mb-2" />
    <input v-model="novaSenha" type="password" placeholder="Nova senha" class="w-full p-2 border rounded mb-2" />
    <input v-model="palavraSecreta" type="password" placeholder="Palavra secreta" class="w-full p-2 border rounded mb-4" />
    <button @click="alterarSenha" class="bg-yellow-500 text-white px-4 py-2 rounded w-full">Alterar</button>
    <router-link to="/" class="text-blue-600 underline text-sm block mt-4 text-center">Voltar ao login</router-link>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const usuario = ref('')
const novaSenha = ref('')
const palavraSecreta = ref('')

async function alterarSenha() {
  try {
    const res = await axios.post('http://localhost/alterar_senha.php', {
      usuario: usuario.value,
      nova_senha: novaSenha.value,
      palavra_secreta: palavraSecreta.value
    })
    alert(res.data.message)
  } catch (e) {
    alert('Erro ao alterar senha')
  }
}
</script>
