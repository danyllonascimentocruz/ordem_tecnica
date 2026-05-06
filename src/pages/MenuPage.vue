<template>
  <div class="main-container min-vh-100 py-5 px-3">
    <div class="mx-auto" style="max-width: 480px">
      
      <div class="text-center mb-5 mt-2 animate-in">
        <img src="@/assets/logo.png" alt="Logo" class="main-logo mb-3" />
        <h1 class="h5 fw-bold text-dark mb-1">Portal de Serviços</h1>
        <p class="text-muted small">Bem-vindo, <span class="fw-bold text-primary">{{ nomeUsuario }}</span></p>
      </div>

      <div class="row g-3">
        
        <div class="col-12">
          <div class="premium-card flex-column align-items-stretch shadow-sm" :class="{ open: ordOpen }">
            <div class="d-flex align-items-center justify-content-between" @click="ordOpen = !ordOpen">
              <div class="d-flex align-items-center">
                <div class="icon-sq bg-primary-soft text-primary shadow-sm">
                  <i class="bi bi-briefcase-fill"></i>
                </div>
                <div class="ms-3 text-start">
                  <div class="fw-bold text-dark text-uppercase small" style="letter-spacing: 1px;">Ordens de Serviço</div>
                  <div class="text-muted small">Agendamentos e histórico</div>
                </div>
              </div>
              <i class="bi bi-chevron-down arrow" :class="{ rotate: ordOpen }"></i>
            </div>
            
            <div v-if="ordOpen" class="expand-content mt-3 d-flex gap-2">
              <button class="btn btn-primary w-100 py-2 fw-bold shadow-sm" @click="router.push('/chamados')">
                ABERTOS
              </button>
              <button class="btn btn-outline-primary w-100 py-2 fw-bold" @click="router.push('/historico')">
                HISTÓRICO
              </button>
            </div>
          </div>
        </div>

        <div class="col-6">
          <button class="premium-card sq shadow-sm" @click="router.push('/periodos')">
            <div class="icon-circle bg-info-soft text-info mb-2 shadow-sm">
              <i class="bi bi-stopwatch-fill"></i>
            </div>
            <span class="fw-bold text-dark small text-uppercase">Horas</span>
          </button>
        </div>

        <div class="col-6">
          <button class="premium-card sq shadow-sm" @click="router.push('/despesas-periodo')">
            <div class="icon-circle bg-danger-soft text-danger mb-2 shadow-sm">
              <i class="bi bi-receipt-cutoff"></i>
            </div>
            <span class="fw-bold text-dark small text-uppercase">Despesas</span>
          </button>
        </div>

        <div class="col-12">
          <div class="premium-card flex-column align-items-stretch shadow-sm" :class="{ open: orcOpen }">
            <div class="d-flex align-items-center justify-content-between" @click="orcOpen = !orcOpen">
              <div class="d-flex align-items-center">
                <div class="icon-circle bg-success-soft text-success me-3 shadow-sm">
                  <i class="bi bi-file-earmark-text-fill"></i>
                </div>
                <span class="fw-bold text-dark text-uppercase small" style="letter-spacing: 1px;">Orçamentos</span>
              </div>
              <i class="bi bi-chevron-down arrow" :class="{ rotate: orcOpen }"></i>
            </div>
            <div v-if="orcOpen" class="expand-content mt-3 d-flex gap-2">
              <button class="btn btn-success w-100 py-2 fw-bold shadow-sm" @click="router.push('/orcamento')">+ NOVO</button>
              <button class="btn btn-outline-secondary w-100 py-2 fw-bold" @click="router.push('/EdicaoOrca')">LISTA</button>
            </div>
          </div>
        </div>

        <template v-if="canSeeDashboard">
          <div class="col-12 mt-4 mb-1 ps-2">
            <span class="text-muted fw-bold text-uppercase" style="font-size: 0.65rem; letter-spacing: 1px;">Gestão Administrativa</span>
          </div>
          <div class="col-6">
            <button class="premium-card sq admin shadow-sm" @click="router.push('/dashboard-agendados')">
              <i class="bi bi-speedometer2 mb-1"></i>
              <span>Dashboard</span>
            </button>
          </div>
          <div class="col-6">
            <button class="premium-card sq admin shadow-sm" @click="router.push('/admin-pagamentos')">
              <i class="bi bi-shield-lock mb-1"></i>
              <span>Financeiro</span>
            </button>
          </div>
        </template>
      </div>

      <div class="text-center mt-5">
        <button class="btn text-danger fw-bold small opacity-75" @click="logout">
          <i class="bi bi-power me-1"></i> SAIR DO SISTEMA
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const orcOpen = ref(false);
const ordOpen = ref(false); // 🔹 Novo controle para a gaveta de Ordens

const nomeUsuario = computed(() => localStorage.getItem('nomeUsuario')?.split(' ')[0] || 'Técnico');
const idFuncionario = computed(() => parseInt(localStorage.getItem('idFuncionario') || '0', 10));

// IDs com permissão de admin
const canSeeDashboard = computed(() => [29, 30, 14, 1].includes(idFuncionario.value));

function logout() { 
  if(confirm('Deseja realmente sair?')) {
    localStorage.clear(); 
    router.push('/login'); 
  }
}
</script>

<style scoped>
.main-container { background-color: #f0f7f9; }
.main-logo { height: 46px; object-fit: contain; }

.premium-card {
  width: 100%; background: #fff; border: none; border-radius: 20px;
  padding: 18px; display: flex; align-items: center; justify-content: space-between;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}
.premium-card:active { transform: scale(0.98); }

.premium-card.sq { aspect-ratio: 1/0.85; flex-direction: column; justify-content: center; }

/* Estilo Admin - Azul Principal do App */
.premium-card.admin { background-color: #00A7CF; color: #fff; border: none; }
.premium-card.admin span { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-top: 5px; }
.premium-card.admin i { font-size: 1.5rem; }

.icon-sq {
  width: 48px; height: 48px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center; font-size: 1.4rem;
}
.icon-circle {
  width: 42px; height: 42px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
}

/* Cores Suaves (Soft UI) */
.bg-primary-soft { background: #e0f2fe; }
.bg-info-soft { background: #e0faff; }
.bg-danger-soft { background: #fee2e2; }
.bg-success-soft { background: #dcfce7; }

.arrow { transition: transform 0.3s; color: #cbd5e1; }
.rotate { transform: rotate(180deg); }
.expand-content { animation: fadeIn 0.3s ease; }

@keyframes fadeIn { 
  from { opacity: 0; transform: translateY(-10px); } 
  to { opacity: 1; transform: translateY(0); } 
}
.animate-in { animation: fadeIn 0.5s ease-out; }
</style>