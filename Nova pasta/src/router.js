import { createRouter, createWebHistory } from 'vue-router'
import LoginView from './views/LoginView.vue'
import AlterarSenhaView from './views/AlterarSenhaView.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: LoginView },
    { path: '/alterar-senha', component: AlterarSenhaView }
  ]
})
