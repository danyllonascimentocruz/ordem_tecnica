// src/services/api.js
import axios from "axios";

/**
 * Base dinâmica corrigida para HTTPS:
 * O window.location.origin já traz o protocolo e a porta corretos
 * evitando o erro de "Mixed Content" (HTTPS chamando HTTP).
 */
function buildApiBase() {
  const host = window.location.hostname || "";
  const origin = window.location.origin; // Ex: https://conexao.novaonlyne.com.br:31405

  // Se o usuário estiver acessando pelo domínio oficial ou IP da rede
  if (host.includes("conexao.novaonlyne.com.br") || /^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    // Retorna a URL completa baseada no que está na barra de endereços
    return `${origin}/api`;
  }

  // Caso especial para desenvolvimento local (localhost)
  // Aponta para o servidor de produção sempre via HTTPS para garantir segurança
  if (host === "localhost" || host === "127.0.0.1") {
    return "https://conexao.novaonlyne.com.br:31405/api";
  }

  // Padrão: usa a origem atual do navegador
  return `${origin}/api`;
}

export const API_URL = buildApiBase();

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

/**
 * Interceptor para gerenciar parâmetros de funcionário/viewer
 * via query params para evitar problemas de Preflight CORS.
 */
api.interceptors.request.use((config) => {
  const idFuncionario = localStorage.getItem("idFuncionario");

  if (idFuncionario) {
    config.params = config.params || {};
    // Garante que o idFuncionario seja enviado se não houver um definido
    if (config.params.viewer == null) config.params.viewer = idFuncionario;
    if (config.params.idFuncionario == null) config.params.idFuncionario = idFuncionario;
  }
  return config;
});

export default api;