import { createRouter, createWebHistory } from 'vue-router'

import LoginPage           from '@/pages/LoginPage.vue'
import MenuPage            from '@/pages/MenuPage.vue'
import ChamadosPage        from '@/pages/ChamadosPage.vue'
import OrcamentoPage       from '@/pages/OrcamentoPage.vue'
import OrdemPage           from '@/pages/OrdemPage.vue'
import EdicaoOrca          from '@/pages/EdicaoOrca.vue'
import DashboardAgendados  from '@/pages/DashboardAgendados.vue'
import CalendarioAgendados from '@/pages/CalendarioAgendados.vue'
import PeriodosTecnico     from '@/pages/PeriodosTecnico.vue'
import HistoricoPage       from '@/pages/HistoricoPage.vue'
import RecuperarSenha      from '@/pages/RecuperarSenha.vue'
// ✅ TELA NOVA
import DespesasTecnicosPeriodo from '@/pages/DespesasTecnicosPeriodo.vue'

const DocsPage      = { template: '<h2 class="text-center mt-5">Docs</h2>' }
const Transparencia = { template: '<h2 class="text-center mt-5">Transparência</h2>' }
const DacPage       = { template: '<h2 class="text-center mt-5">DAC</h2>' }

// Base do seu app (você acessa por /osonlyne)
const APP_BASE = '/osonlyne/'

// Permissão do dashboard/calendário
const ALLOWED_DASH_IDS = [29, 30, 14]

// helpers
function getIdFuncionario () {
  return parseInt(localStorage.getItem('idFuncionario') || '0', 10)
}

function guardAuth (to, from, next) {
  const id = getIdFuncionario()
  if (id > 0) return next()
  return next({ name: 'login' })
}

function guardDash (to, from, next) {
  const id = getIdFuncionario()
  if (!(id > 0)) return next({ name: 'login' })
  if (!ALLOWED_DASH_IDS.includes(id)) return next({ name: 'menu' })
  return next()
}

const routes = [
  // raiz do app ( /osonlyne/ ) manda para login
  { path: '/', redirect: { name: 'login' } },

  // Rotas públicas
  { path: '/login', name: 'login', component: LoginPage },

  // Rotas autenticadas
  { path: '/menu',      name: 'menu',      component: MenuPage,      beforeEnter: guardAuth },
  { path: '/chamados',  name: 'chamados',  component: ChamadosPage,  beforeEnter: guardAuth },
  { path: '/historico', name: 'historico', component: HistoricoPage, beforeEnter: guardAuth },
  { path: '/orcamento', name: 'orcamento', component: OrcamentoPage, beforeEnter: guardAuth },
  { path: '/docs',      name: 'docs',      component: DocsPage,      beforeEnter: guardAuth },
  { path: '/transp',    name: 'transp',    component: Transparencia, beforeEnter: guardAuth },
  { path: '/EdicaoOrca',name: 'EdicaoOrca',component: EdicaoOrca,     beforeEnter: guardAuth },
  { path: '/dac',       name: 'dac',       component: DacPage,       beforeEnter: guardAuth },
  { path: '/recuperar-senha', name: 'recuperar-senha', component: RecuperarSenha },
  
  // Lançamentos
  { path: '/periodos', name: 'PeriodosTecnico', component: PeriodosTecnico, beforeEnter: guardAuth },

  // ✅ NOVA ROTA (Despesas por período)
  { path: '/despesas-periodo', name: 'despesas-periodo', component: DespesasTecnicosPeriodo, beforeEnter: guardAuth },

  {
    path: '/ordem/:id',
    name: 'ordem',
    component: OrdemPage,
    props: true,
    beforeEnter: (to, from, next) => {
      const idFunc = getIdFuncionario()
      if (!(idFunc > 0)) return next({ name: 'login' })
      if (!to.params.id) return next({ name: 'chamados' })
      return next()
    }
  },

  // Rotas restritas (29/30)
  {
    path: '/dashboard-agendados',
    name: 'dashboard-agendados',
    component: DashboardAgendados,
    beforeEnter: guardDash
  },
  {
    path: '/calendario-agendados',
    name: 'calendario-agendados',
    component: CalendarioAgendados,
    beforeEnter: guardDash
  },

  {
    path: '/calendario-horas',
    name: 'calendario-horas',
    component: () => import('../pages/CalendarioHorasLancadas.vue'),
    beforeEnter: guardDash,
  },
  {
    path: '/admin-pagamentos',
    name: 'admin-pagamentos',
    component: () => import('../pages/AdminPagamentosDespesas.vue'),
    beforeEnter: guardDash,
  },

  // fallback
  { path: '/:pathMatch(.*)*', redirect: { name: 'login' } }
]

const router = createRouter({
  history: createWebHistory(APP_BASE),
  routes
})

// Guarda global
router.beforeEach((to, from, next) => {
  // 🔵 AJUSTE: Liberado acesso para Login E Recuperar Senha
  if (to.name === 'login' || to.name === 'recuperar-senha') {
    return next()
  }

  const id = getIdFuncionario()
  if (!(id > 0)) return next({ name: 'login' })

  next()
})

export default router