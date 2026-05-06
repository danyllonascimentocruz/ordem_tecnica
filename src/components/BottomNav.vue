<template>
  <nav v-if="!['login', 'recuperar-senha'].includes($route.name)" class="modern-nav fixed-bottom shadow-lg">
    <div class="d-flex justify-content-between align-items-center h-100">

      <div class="nav-item-container drop-left">
        <button class="nav-btn" :class="{ active: isActivePath('/chamados') || isActivePath('/historico') || menus.ord }" @click="toggleMenu('ord')">
          <i class="bi bi-briefcase"></i>
          <span>Ordens</span>
        </button>
        <div v-if="menus.ord" class="glass-dropup animate-pop">
          <button @click="go('/chamados')"><i class="bi bi-list-task me-2 text-primary"></i>Abertos</button>
          <button @click="go('/historico')"><i class="bi bi-clock-history me-2 text-success"></i>Histórico</button>
        </div>
      </div>

      <div class="nav-item-container" v-if="canSeeDashboard">
        <RouterLink to="/dashboard-agendados" class="nav-btn" :class="{ active: isActivePath('/dashboard-agendados') }" @click="closeAll">
          <i class="bi bi-grid-1x2"></i>
          <span>Painel</span>
        </RouterLink>
      </div>

      <div class="nav-item-container" v-if="canSeeDashboard">
        <button class="nav-btn" :class="{ active: isActivePath('/calendario-agendados') || isActivePath('/calendario-horas') || menus.cal }" @click="toggleMenu('cal')">
          <i class="bi bi-calendar3"></i>
          <span>Agenda</span>
        </button>
        <div v-if="menus.cal" class="glass-dropup animate-pop">
          <button @click="go('/calendario-agendados')"><i class="bi bi-clock-history me-2 text-primary"></i>Agendados</button>
          <button @click="go('/calendario-horas')"><i class="bi bi-check2-all me-2 text-success"></i>Lançadas</button>
        </div>
      </div>

      <div class="nav-item-container">
        <button class="nav-btn" :class="{ active: isActivePath('/orcamento') || isActivePath('/EdicaoOrca') || menus.orc }" @click="toggleMenu('orc')">
          <i class="bi bi-file-earmark-text"></i>
          <span>Orçamentos</span>
        </button>
        <div v-if="menus.orc" class="glass-dropup animate-pop">
          <button @click="go('/orcamento')"><i class="bi bi-plus-circle me-2 text-info"></i>Novo</button>
          <button @click="go('/EdicaoOrca')"><i class="bi bi-journal-text me-2 text-warning"></i>Histórico</button>
        </div>
      </div>

      <div class="nav-item-container drop-right">
        <button class="nav-btn" :class="{ active: isActivePath('/periodos') || isActivePath('/despesas-periodo') || isActivePath('/admin-pagamentos') || menus.more }" @click="toggleMenu('more')">
          <i class="bi bi-cash-coin"></i>
          <span>Lançamentos</span>
        </button>
        <div v-if="menus.more" class="glass-dropup animate-pop">
          <button @click="go('/periodos')"><i class="bi bi-stopwatch me-2 text-primary"></i>Horas</button>
          <button @click="go('/despesas-periodo')"><i class="bi bi-receipt me-2 text-danger"></i>Despesas</button>
          <div v-if="canSeeDashboard" class="border-top mt-1 pt-1">
            <button class="fw-bold text-dark" @click="go('/admin-pagamentos')"><i class="bi bi-shield-lock me-2 text-secondary"></i>Admin</button>
          </div>
        </div>
      </div>

    </div>
  </nav>

  <Transition name="fade">
    <div v-if="anyMenuOpen && !['login', 'recuperar-senha'].includes($route.name)" class="nav-overlay" @click="closeAll"></div>
  </Transition>
</template>

<script setup>
import { reactive, computed } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';

const route = useRoute();
const router = useRouter();

const menus = reactive({ ord: false, cal: false, orc: false, more: false });

const idFuncionario = computed(() => parseInt(localStorage.getItem('idFuncionario') || '0', 10));
const canSeeDashboard = computed(() => [29, 30, 14, 1].includes(idFuncionario.value));
const anyMenuOpen = computed(() => menus.ord || menus.cal || menus.orc || menus.more);
const isActivePath = (p) => route.path === p;

const toggleMenu = (m) => { 
  const st = menus[m]; 
  closeAll(); 
  menus[m] = !st; 
};

const closeAll = () => { 
  menus.ord = false; menus.cal = false; menus.orc = false; menus.more = false; 
};

const go = (p) => { 
  closeAll(); 
  router.push(p); 
};
</script>

<style scoped>
.modern-nav { height: 56px; background-color: #00A7CF !important; z-index: 2000; }
.nav-item-container { flex: 1; height: 100%; position: relative; display: flex; justify-content: center; }

.nav-btn {
  width: 100%; height: 100%; border: none; background: transparent;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: rgba(255, 255, 255, 0.8) !important; text-decoration: none !important;
  transition: all 0.2s ease;
}
.nav-btn.active { background-color: rgba(255, 255, 255, 0.2); color: #FFFFFF !important; }
.nav-btn i { font-size: 1.2rem; }
.nav-btn span { font-size: 0.52rem; font-weight: 700; text-transform: uppercase; margin-top: 2px; }

/* 🔵 DROPUP PADRÃO (CENTRALIZADO) */
.glass-dropup {
  position: absolute; bottom: 65px; left: 50%; transform: translateX(-50%);
  width: 175px; background: #FFFFFF; border-radius: 12px; padding: 6px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.25); z-index: 2100; border: 1px solid #f0f0f0;
}

/* 🔵 CORREÇÃO PARA O CANTO ESQUERDO */
.drop-left .glass-dropup { left: 5px; transform: none; }
.drop-left .animate-pop { animation: popInSide 0.2s ease-out; }

/* 🔵 CORREÇÃO PARA O CANTO DIREITO */
.drop-right .glass-dropup { left: auto; right: 5px; transform: none; }
.drop-right .animate-pop { animation: popInSide 0.2s ease-out; }

.glass-dropup button {
  width: 100%; border: none; background: transparent; text-align: left;
  padding: 10px 14px; font-size: 0.82rem; font-weight: 700; color: #333;
  border-radius: 8px; display: flex; align-items: center;
}

.animate-pop { animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }

@keyframes popIn { 
  from { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.95); } 
  to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } 
}

/* Animação para quando não está centralizado */
@keyframes popInSide { 
  from { opacity: 0; transform: translateY(10px) scale(0.95); } 
  to { opacity: 1; transform: translateY(0) scale(1); } 
}

.nav-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.1); backdrop-filter: blur(4px); z-index: 1990; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>