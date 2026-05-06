<template>
  <div class="auth-wrapper">
    <div class="card shadow-lg border-0 rounded-4 animate-in overflow-hidden" style="max-width: 400px; width: 100%;">
      <div class="bg-primary py-1 w-100" style="opacity: 0.8;"></div>
      
      <div class="card-body p-4 p-md-5 text-center">
        <div class="mb-4">
          <img :src="logoPath" alt="Logo" class="logo-80 mb-2" />
          <h5 class="header-title-clean m-0">Acesso Restrito</h5>
          <div class="subtitle-clean">Sistema de Gestão de Chamados</div>
        </div>

        <div v-if="erroMsg" class="alert-premium-danger mb-4 animate-shake">
          <i class="bi bi-exclamation-octagon-fill me-2"></i> {{ erroMsg }}
        </div>

        <form @submit.prevent="login">
          <div class="mb-3 text-start">
            <label class="label-tiny">USUÁRIO DE ACESSO</label>
            <div class="input-group-premium">
              <span class="prefix"><i class="bi bi-person"></i></span>
              <input v-model="ctx.usuario" type="text" class="input-clean" placeholder="Digite seu usuário" />
            </div>
          </div>

          <div class="mb-3 text-start">
            <label class="label-tiny">SENHA DE SEGURANÇA</label>
            <div class="input-group-premium">
              <span class="prefix"><i class="bi bi-lock"></i></span>
              <input :type="verSenha ? 'text' : 'password'" v-model="ctx.senha" class="input-clean" placeholder="••••••••" />
              <button type="button" class="btn-eye" @click="verSenha = !verSenha">
                <i :class="verSenha ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-center mb-4 px-1">
            <div class="form-check">
              <input v-model="ctx.salvarCredenciais" class="form-check-input" type="checkbox" id="salvar" />
              <label class="form-check-label ultra-small text-muted fw-bold" for="salvar">Lembrar acesso</label>
            </div>
            <router-link to="/recuperar-senha" class="ultra-small text-primary fw-bold text-decoration-none">Esqueci a senha</router-link>
          </div>

          <button type="submit" class="btn btn-premium-blue w-100 py-3 shadow-sm" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            AUTENTICAR E ENTRAR
          </button>
        </form>

        <div class="mt-4 pt-3 border-top">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div class="ultra-small text-success fw-bold"><i class="bi bi-shield-lock-fill"></i> CONEXÃO SEGURA</div>
            <div class="ultra-small text-muted fw-bold opacity-50">v2.6.8</div>
          </div>
          <p class="copyright-text">
            ©1991-2026 Todos os direitos reservados. Nova Onlyne Telecomunicações. <br>
            É marca registrada da NovaOnlyne Group.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const logoPath = new URL('@/assets/logo.png', import.meta.url).href
const router = useRouter()
const loading = ref(false)
const verSenha = ref(false)
const erroMsg = ref('')

const API_INT = 'http://192.168.8.1:31405/api/'
const API_EXT = 'https://conexao.novaonlyne.com.br:31405/api/'

const ctx = reactive({ usuario: '', senha: '', salvarCredenciais: false })

async function resolveApiBase() {
  const cached = localStorage.getItem('apiBase')
  if (cached) return cached
  try {
    await axios.get(API_INT + 'ping.php', { timeout: 1200 })
    localStorage.setItem('apiBase', API_INT); return API_INT
  } catch {
    localStorage.setItem('apiBase', API_EXT); return API_EXT
  }
}

onMounted(() => {
  const savedUser = localStorage.getItem('savedUsuario')
  const savedPass = localStorage.getItem('savedSenha')
  if (savedUser) { ctx.usuario = savedUser; ctx.senha = savedPass; ctx.salvarCredenciais = true; }
})

const login = async () => {
  erroMsg.value = ''
  if (!ctx.usuario || !ctx.senha) { erroMsg.value = 'Preencha todos os campos.'; return; }
  loading.value = true
  try {
    const API_URL = await resolveApiBase()
    const { data } = await axios.post(`${API_URL}login.php`, { usuario: ctx.usuario, senha: ctx.senha }, { timeout: 8000 })
    if (data?.success && data?.idfuncionario) {
      localStorage.setItem('logado', 'true')
      localStorage.setItem('idFuncionario', data.idfuncionario)
      localStorage.setItem('nomeUsuario', data.nome)
      if (ctx.salvarCredenciais) {
        localStorage.setItem('savedUsuario', ctx.usuario); localStorage.setItem('savedSenha', ctx.senha)
      } else {
        localStorage.removeItem('savedUsuario'); localStorage.removeItem('savedSenha')
      }
      router.push('/chamados')
    } else { erroMsg.value = data?.message || 'Acesso negado.' }
  } catch (err) { erroMsg.value = 'Falha de conexão.' }
  finally { loading.value = false }
}
</script>

<style scoped>
/* FIX: Trava o ecrã e esconde rolagem */
.auth-wrapper {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  overflow: hidden;
  z-index: 9999;
}
.logo-80 { height: 80px; width: auto; display: block; margin: 0 auto; }
.header-title-clean { font-size: 0.85rem; font-weight: 600; color: #1e293b; }
.subtitle-clean { font-size: 0.55rem; color: #94a3b8; letter-spacing: 1px; }
.label-tiny { font-size: 0.52rem; font-weight: 700; color: #94a3b8; margin-bottom: 4px; display: block; }
.input-group-premium { display: flex; align-items: center; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0 12px; }
.input-group-premium:focus-within { border-color: #04A5D1; box-shadow: 0 0 0 3px rgba(4, 165, 209, 0.1); }
.input-clean { border: none; flex-grow: 1; padding: 10px 5px; font-size: 0.85rem; outline: none; background: transparent; }
.prefix { color: #cbd5e1; margin-right: 8px; }
.btn-eye { background: transparent; border: none; color: #94a3b8; }
.btn-premium-blue { background: #04A5D1; color: white; border: none; border-radius: 10px; font-size: 0.75rem; font-weight: 700; }
.copyright-text { font-size: 0.48rem; line-height: 1.4; color: #94a3b8; margin-top: 10px; }
.alert-premium-danger { background: #fef2f2; color: #b91c1c; padding: 10px; border-radius: 10px; font-size: 0.7rem; font-weight: 600; }
.ultra-small { font-size: 0.62rem; }
.animate-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
.animate-shake { animation: shake 0.2s ease-in-out 2; }
</style>