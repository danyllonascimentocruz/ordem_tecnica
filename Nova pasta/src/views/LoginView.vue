<template>
  <div class="p-4 max-w-md mx-auto">
    <h1 class="text-xl font-bold mb-4">Login</h1>
    <input v-model="usuario" placeholder="Usuário" class="w-full p-2 border rounded mb-2" />
    <input v-model="senha" type="password" placeholder="Senha" class="w-full p-2 border rounded mb-4" />
    <button @click="login" class="bg-blue-500 text-white px-4 py-2 rounded w-full mb-4">Entrar</button>
    <router-link to="/alterar-senha" class="text-blue-600 underline text-sm">Alterar senha</router-link>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const usuario = ref('')
const senha = ref('')
const router = useRouter()

async function login() {
  try {
    const res = await axios.post('http://localhost/login.php', {
      usuario: usuario.value,
      senha: senha.value
    })
    if (res.data.success) {
      alert('Login efetuado!')
      // redirecionar para outra página se desejar
    } else {
      alert('Usuário ou senha inválidos')
    }
  } catch (e) {
    alert('Erro ao fazer login')
  }
}
</script>
