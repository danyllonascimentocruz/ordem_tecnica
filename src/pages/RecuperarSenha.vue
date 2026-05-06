<template>
  <div class="auth-wrapper">
    <div class="card shadow-lg border-0 rounded-4 animate-in my-4" style="max-width: 400px; width: 100%;">
      <div class="bg-primary py-1 w-100" style="opacity: 0.8;"></div>

      <div class="card-body p-4 p-md-5 text-center">
        <div class="mb-4">
          <img :src="logoPath" alt="Logo" class="logo-compact mb-2" />
          <h5 class="header-title-clean m-0">Segurança da Conta</h5>
          <div class="subtitle-clean text-uppercase">Recuperação de Acesso</div>
        </div>

        <div v-if="erroMsg" class="alert-premium-danger mb-4 animate-shake">
          <i class="bi bi-exclamation-triangle-fill me-2"></i> {{ erroMsg }}
        </div>

        <div v-if="passo === 1" class="animate-in">
          <p class="small text-muted mb-4 px-2">Informe o e-mail associado à sua conta para receber o código de validação.</p>
          <div class="mb-4 text-start">
            <label class="label-tiny text-uppercase">Endereço de E-mail</label>
            <div class="input-group-premium">
              <span class="prefix"><i class="bi bi-envelope"></i></span>
              <input v-model="email" type="email" class="input-clean" placeholder="nome@empresa.com.br" autocomplete="off" />
            </div>
          </div>
          <button @click="solicitarCodigo" class="btn btn-premium-blue w-100 py-3 mb-4 shadow-sm" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            ENVIAR CÓDIGO
          </button>
        </div>

        <div v-if="passo === 2" class="animate-in text-start">
          <div class="alert-success-premium mb-4 text-center small">Código enviado! Verifique seu e-mail.</div>
          
          <div class="mb-3">
            <label class="label-tiny">CÓDIGO RECEBIDO</label>
            <input v-model="codigo" type="text" maxlength="6" class="input-premium-slim text-center fw-bold fs-4" placeholder="000 000" />
          </div>

          <div class="mb-3">
            <label class="label-tiny">DEFINIR NOVA SENHA</label>
            <div class="input-group-premium">
              <span class="prefix"><i class="bi bi-shield-lock"></i></span>
              <input :type="verNova ? 'text' : 'password'" v-model="novaSenha" class="input-clean" placeholder="Senha segura" autocomplete="new-password" />
              <button type="button" class="btn-eye" @click="verNova = !verNova">
                <i :class="verNova ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
            </div>
            
            <div class="strength-meter mt-2">
              <div class="strength-bar-container">
                <div class="strength-bar-fill" :style="{ width: forcaPorcentagem + '%', backgroundColor: forcaCor }"></div>
              </div>
              <div class="strength-label" :style="{ color: forcaCor }">{{ forcaTexto }}</div>
            </div>

            <div class="password-check-list mt-3">
              <p class="instruction-text mb-2">A senha deve conter:</p>
              <div class="check-item" :class="{ 'check-success': temMaiuscula }">
                <i class="bi" :class="temMaiuscula ? 'bi-check2-circle' : 'bi-circle'"></i>
                <span>Uma letra <strong>maiúscula</strong></span>
              </div>
              <div class="check-item" :class="{ 'check-success': temNumero }">
                <i class="bi" :class="temNumero ? 'bi-check2-circle' : 'bi-circle'"></i>
                <span>Ao menos um <strong>número</strong></span>
              </div>
              <div class="check-item" :class="{ 'check-success': temEspecial }">
                <i class="bi" :class="temEspecial ? 'bi-check2-circle' : 'bi-circle'"></i>
                <span>Um <strong>símbolo especial</strong> (@, #, $)</span>
              </div>
            </div>
          </div>

          <button @click="confirmarTroca" class="btn btn-premium-blue w-100 py-3 mb-4 shadow-sm" :disabled="loading || !senhaValida">
            ATUALIZAR ACESSO
          </button>
        </div>

        <div class="pt-3 border-top mt-4">
          <router-link to="/login" class="link-voltar">
            <i class="bi bi-chevron-left me-1"></i> VOLTAR AO LOGIN
          </router-link>
          <div class="copyright-container">
            <p class="copyright-text">©1992-2026 NOVA ONLYNE TELECOMUNICAÇÕES</p>
            <p class="copyright-subtext">Segurança de Dados • Acesso Restrito</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const logoPath = new URL('@/assets/logo.png', import.meta.url).href
const router = useRouter()

const email = ref(''), codigo = ref(''), novaSenha = ref(''), confirmarSenha = ref('')
const passo = ref(1), loading = ref(false), erroMsg = ref(''), verNova = ref(false), verConf = ref(false)

const getApiBase = () => localStorage.getItem('apiBase') || 'https://conexao.novaonlyne.com.br:31405/api/'

const temMaiuscula = computed(() => /[A-Z]/.test(novaSenha.value))
const temNumero = computed(() => /[0-9]/.test(novaSenha.value))
const temEspecial = computed(() => /[!@#$%^&*(),.?":{}|<>]/.test(novaSenha.value))
const temTamanho = computed(() => novaSenha.value.length >= 6)

const pontosForca = computed(() => {
  let p = 0
  if (temMaiuscula.value) p++
  if (temNumero.value) p++
  if (temEspecial.value) p++
  if (temTamanho.value) p++
  return p
})

const forcaPorcentagem = computed(() => (pontosForca.value / 4) * 100)
const forcaCor = computed(() => pontosForca.value <= 1 ? '#ef4444' : pontosForca.value <= 3 ? '#f59e0b' : '#10b981')
const forcaTexto = computed(() => novaSenha.value.length === 0 ? '' : pontosForca.value <= 1 ? 'Fraca' : pontosForca.value <= 3 ? 'Média' : 'Forte')
const senhaValida = computed(() => pontosForca.value === 4)

async function solicitarCodigo() {
  erroMsg.value = ''
  if (!email.value) { erroMsg.value = 'E-mail obrigatório.'; return; }
  loading.value = true
  try {
    const { data } = await axios.post(`${getApiBase()}solicitar_reset.php`, { email: email.value })
    if (data.success) { passo.value = 2 } else { erroMsg.value = data.message }
  } catch (e) { erroMsg.value = 'Erro de rede.' } finally { loading.value = false }
}

async function confirmarTroca() {
  if (!senhaValida.value) return
  loading.value = true
  try {
    const { data } = await axios.post(`${getApiBase()}confirmar_reset.php`, { email: email.value, codigo: codigo.value, nova_senha: novaSenha.value })
    if (data.success) { alert('Sucesso!'); router.push('/login') } else { erroMsg.value = data.message }
  } catch (e) { erroMsg.value = 'Erro ao processar.' } finally { loading.value = false }
}
</script>

<style scoped>
/* ESCONDE MENU GLOBAL */

.auth-wrapper { 
  position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; 
  background: #f8fafc; overflow-y: auto; padding: 15px;
}

.logo-compact { height: 55px; width: auto; }
.header-title-clean { font-size: 0.85rem; font-weight: 700; color: #0f172a; }
.subtitle-clean { font-size: 0.52rem; color: #94a3b8; font-weight: 600; }

/* BARRA DE FORÇA */
.strength-bar-container { height: 4px; background: #e2e8f0; border-radius: 10px; overflow: hidden; }
.strength-bar-fill { height: 100%; transition: 0.4s; }
.strength-label { font-size: 0.5rem; font-weight: 700; text-transform: uppercase; margin-top: 4px; text-align: right; }

.password-check-list { background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #f1f5f9; text-align: left; }
.instruction-text { font-size: 0.58rem; color: #64748b; font-weight: 600; }
.check-item { display: flex; align-items: center; gap: 8px; font-size: 0.6rem; color: #94a3b8; margin-bottom: 4px; }
.check-success { color: #059669; }

.label-tiny { font-size: 0.52rem; font-weight: 700; color: #64748b; margin-bottom: 5px; display: block; }
.input-group-premium { display: flex; align-items: center; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0 12px; }
.input-clean { border: none; flex-grow: 1; padding: 10px 0; font-size: 0.8rem; outline: none; background: transparent; }

.btn-premium-blue { background: #04A5D1; color: white; border: none; border-radius: 10px; font-size: 0.7rem; font-weight: 700; }
.btn-premium-blue:disabled { background: #cbd5e1; }

.link-voltar { font-size: 0.6rem; font-weight: 700; color: #64748b; text-decoration: none; transition: 0.2s; }
.link-voltar:hover { color: #04A5D1; }

/* 🔵 CSS DO RODAPÉ (ESTILIZADO) */
.copyright-container { margin-top: 15px; }
.copyright-text { 
  font-size: 0.52rem; 
  color: #94a3b8; 
  font-weight: 700; 
  margin-bottom: 2px;
  letter-spacing: 0.5px;
}
.copyright-subtext { 
  font-size: 0.45rem; 
  color: #cbd5e1; 
  font-weight: 500; 
  text-transform: uppercase;
}

.animate-in { animation: slideUp 0.4s ease-out; }
@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>