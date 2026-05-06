<template>
  <div class="d-flex justify-content-center align-items-center min-vh-100 bg-light">
    <div class="card shadow-lg border-0" style="max-width: 400px; width: 100%;">
      <div class="card-body">

        <div class="text-center mb-3">
          <img
            :src="logoPath"
            alt="Logo Nova Onlyne"
            class="img-fluid"
            style="max-width: 350px; max-height: 200px; object-fit: contain;"
          />
        </div>

        <form @submit.prevent="login">
          <!-- Usuário -->
          <div class="mb-3">
            <input
              v-model="ctx.usuario"
              type="text"
              class="form-control"
              placeholder="Usuário"
              autocomplete="username"
            />
          </div>

          <!-- Senha -->
          <div class="mb-3">
            <input
              type="password"
              v-model="ctx.senha"
              class="form-control"
              placeholder="Senha"
              autocomplete="current-password"
            />
          </div>

          <!-- Checkbox -->
          <div class="form-check mb-4">
            <input
              v-model="ctx.salvarCredenciais"
              class="form-check-input"
              type="checkbox"
              id="salvarCredenciais"
            />
            <label class="form-check-label" for="salvarCredenciais">
              Salvar login e senha
            </label>
          </div>

          <div class="d-flex justify-content-center">
            <button
              type="submit"
              class="btn text-white px-4"
              style="background:#04A5D1; border-color:#04A5D1;"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-2" />
              Entrar
            </button>
          </div>
        </form>

      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

/* ========= CONFIG =========
 * Troque API_INT pelo IP do servidor na sua LAN.
 * Ex.: 'http://192.168.8.50:31405/api/'
 */
const API_INT = 'http://192.168.8.1:31405/api/'                 // 👈 AJUSTE AQUI (IP interno)
const API_EXT = 'https://conexao.novaonlyne.com.br:31405/api/'   // domínio externo
const PING    = 'ping.php'                                      // health check simples

const logoPath = new URL('@/assets/logo.png', import.meta.url).href

const ctx = reactive({
  usuario: '',
  senha: '',
  salvarCredenciais: false
})

const loading = ref(false)
const senhaRecuperada = ref(false)
const router = useRouter()

/* ------- Resolvedor de base URL (interno → externo) ------- */
function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}
async function resolveApiBase() {
  const cached = localStorage.getItem('apiBase')
  if (cached) return cached

  // Tenta interno rápido
  try {
    await Promise.race([
      axios.get(API_INT + PING, { timeout: 1200 }),
      delay(1500)
    ])
    localStorage.setItem('apiBase', API_INT)
    return API_INT
  } catch {}

  // Cai para externo
  localStorage.setItem('apiBase', API_EXT)
  return API_EXT
}

onMounted(async () => {
  // Pré-resolve para deixar o login mais rápido
  try { await resolveApiBase() } catch {}

  const savedUser = localStorage.getItem('savedUsuario')
  const savedPass = localStorage.getItem('savedSenha')

  if (savedUser) ctx.usuario = savedUser
  if (savedPass) {
    ctx.senha = savedPass
    senhaRecuperada.value = true
  }
  if (savedUser && savedPass) ctx.salvarCredenciais = true
})

const login = async () => {
  if (!ctx.usuario || !ctx.senha) {
    alert('Informe usuário e senha.')
    return
  }

  loading.value = true
  try {
    const API_URL = await resolveApiBase()
    const { data } = await axios.post(`${API_URL}login.php`, {
      usuario: ctx.usuario,
      senha: ctx.senha
    }, { timeout: 8000 })

    if (data?.success && data?.idfuncionario) {
      localStorage.setItem('logado', 'true')
      localStorage.setItem('idFuncionario', data.idfuncionario)
      localStorage.setItem('nomeUsuario', data.nome)

      if (ctx.salvarCredenciais) {
        localStorage.setItem('savedUsuario', ctx.usuario)
        localStorage.setItem('savedSenha', ctx.senha)
      } else {
        localStorage.removeItem('savedUsuario')
        localStorage.removeItem('savedSenha')
      }

      router.push('/chamados')
    } else {
      alert(data?.message || 'Usuário ou senha inválidos.')
    }
  } catch (err) {
    console.error('❌ Erro ao logar:', err)
    // Se falhou com a base interna, troca para externa e tenta 1x
    try {
      localStorage.setItem('apiBase', API_EXT)
      const { data } = await axios.post(`${API_EXT}login.php`, {
        usuario: ctx.usuario,
        senha: ctx.senha
      }, { timeout: 8000 })

      if (data?.success && data?.idfuncionario) {
        localStorage.setItem('logado', 'true')
        localStorage.setItem('idFuncionario', data.idfuncionario)
        localStorage.setItem('nomeUsuario', data.nome)

        if (ctx.salvarCredenciais) {
          localStorage.setItem('savedUsuario', ctx.usuario)
          localStorage.setItem('savedSenha', ctx.senha)
        } else {
          localStorage.removeItem('savedUsuario')
          localStorage.removeItem('savedSenha')
        }

        router.push('/chamados')
        return
      }
      alert(data?.message || 'Usuário ou senha inválidos.')
    } catch (e2) {
      console.error('❌ Erro ao logar (fallback):', e2)
      alert('Erro ao logar. Verifique a rede e tente novamente.')
    }
  } finally {
    loading.value = false
  }
}
</script>
