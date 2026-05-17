// =============================================================================
// Mock data — substituirá o banco SQL Server na fase 1.
// Estrutura espelha o modelo de dados final (ver src/types/index.ts).
// =============================================================================

import type {
  AprovacaoSolicitacao,
  AuditoriaSistema,
  HistoricoLicenca,
  Licenca,
  SetorLimite,
  Setor,
  SolicitacaoLicenca,
  TipoLicenca,
  Usuario,
} from "@/types";

// -----------------------------------------------------------------------------
// Setores
// -----------------------------------------------------------------------------
export const setores: Setor[] = [
  { setor_id: 1, nome: "Tecnologia da Informação", sigla: "TI", gestor_id: 2, diretor_id: 7, exige_aprovacao_diretor: false, gestor_ve_dashboard: true, ativo: true },
  { setor_id: 2, nome: "Financeiro", sigla: "FIN", gestor_id: 3, diretor_id: 8, exige_aprovacao_diretor: true, gestor_ve_dashboard: true, ativo: true },
  { setor_id: 3, nome: "Compras", sigla: "COM", gestor_id: 4, diretor_id: 8, exige_aprovacao_diretor: false, gestor_ve_dashboard: true, ativo: true },
  // Gestor de Vendas não enxerga Dashboard (regra de negócio).
  { setor_id: 4, nome: "Vendas", sigla: "VEN", gestor_id: 5, diretor_id: 9, exige_aprovacao_diretor: true, gestor_ve_dashboard: false, ativo: true },
  { setor_id: 5, nome: "Recursos Humanos", sigla: "RH", gestor_id: 6, diretor_id: 9, exige_aprovacao_diretor: false, gestor_ve_dashboard: true, ativo: true },
  { setor_id: 6, nome: "Operações", sigla: "OPE", gestor_id: 10, diretor_id: 9, exige_aprovacao_diretor: true, gestor_ve_dashboard: true, ativo: true },
];

// -----------------------------------------------------------------------------
// Usuários
// -----------------------------------------------------------------------------
export const usuarios: Usuario[] = [
  // Admin / TI
  { usuario_id: 1, nome: "Admin Sistema", email: "admin@empresa.com.br", matricula: "ADM001", cargo: "Administrador do Sistema", setor_id: 1, perfis: ["Administrador"], ativo: true },
  { usuario_id: 2, nome: "Carlos Mendes", email: "carlos.mendes@empresa.com.br", matricula: "TI001", cargo: "Gerente de TI", setor_id: 1, perfis: ["GerenteTI", "Gestor"], ativo: true },
  // Gestores
  { usuario_id: 3, nome: "Ana Silva", email: "ana.silva@empresa.com.br", matricula: "FIN001", cargo: "Gerente Financeiro", setor_id: 2, perfis: ["Gestor"], ativo: true },
  { usuario_id: 4, nome: "Bruno Costa", email: "bruno.costa@empresa.com.br", matricula: "COM001", cargo: "Gerente de Compras", setor_id: 3, perfis: ["Gestor"], ativo: true },
  { usuario_id: 5, nome: "Daniela Souza", email: "daniela.souza@empresa.com.br", matricula: "VEN001", cargo: "Gerente de Vendas", setor_id: 4, perfis: ["Gestor"], ativo: true },
  { usuario_id: 6, nome: "Eduardo Lima", email: "eduardo.lima@empresa.com.br", matricula: "RH001", cargo: "Gerente de RH", setor_id: 5, perfis: ["Gestor"], ativo: true },
  // Diretores
  { usuario_id: 7, nome: "Fernanda Rocha", email: "fernanda.rocha@empresa.com.br", matricula: "DIR001", cargo: "Diretora de TI", setor_id: 1, perfis: ["Diretor"], ativo: true },
  { usuario_id: 8, nome: "Gustavo Pereira", email: "gustavo.pereira@empresa.com.br", matricula: "DIR002", cargo: "Diretor Financeiro", setor_id: 2, perfis: ["Diretor"], ativo: true },
  { usuario_id: 9, nome: "Helena Martins", email: "helena.martins@empresa.com.br", matricula: "DIR003", cargo: "Diretora Comercial", setor_id: 4, perfis: ["Diretor"], ativo: true },
  // Mais gestores
  { usuario_id: 10, nome: "Igor Santos", email: "igor.santos@empresa.com.br", matricula: "OPE001", cargo: "Gerente de Operações", setor_id: 6, perfis: ["Gestor"], ativo: true },
  // Solicitantes / colaboradores
  { usuario_id: 11, nome: "Juliana Alves", email: "juliana.alves@empresa.com.br", matricula: "FIN010", cargo: "Analista Financeiro", setor_id: 2, perfis: ["Solicitante"], ativo: true },
  { usuario_id: 12, nome: "Lucas Ferreira", email: "lucas.ferreira@empresa.com.br", matricula: "FIN011", cargo: "Analista Financeiro Pleno", setor_id: 2, perfis: ["Solicitante"], ativo: true },
  { usuario_id: 13, nome: "Mariana Castro", email: "mariana.castro@empresa.com.br", matricula: "COM010", cargo: "Compradora", setor_id: 3, perfis: ["Solicitante"], ativo: true },
  { usuario_id: 14, nome: "Nicolas Ribeiro", email: "nicolas.ribeiro@empresa.com.br", matricula: "COM011", cargo: "Analista de Compras", setor_id: 3, perfis: ["Solicitante"], ativo: true },
  { usuario_id: 15, nome: "Olivia Cardoso", email: "olivia.cardoso@empresa.com.br", matricula: "VEN010", cargo: "Consultora de Vendas", setor_id: 4, perfis: ["Solicitante"], ativo: true },
  { usuario_id: 16, nome: "Paulo Mendonça", email: "paulo.mendonca@empresa.com.br", matricula: "VEN011", cargo: "Executivo de Contas", setor_id: 4, perfis: ["Solicitante"], ativo: true },
  { usuario_id: 17, nome: "Quintino Barros", email: "quintino.barros@empresa.com.br", matricula: "RH010", cargo: "Analista de RH", setor_id: 5, perfis: ["Solicitante"], ativo: true },
  { usuario_id: 18, nome: "Renata Dias", email: "renata.dias@empresa.com.br", matricula: "OPE010", cargo: "Coordenadora de Operações", setor_id: 6, perfis: ["Solicitante"], ativo: true },
  { usuario_id: 19, nome: "Sergio Tavares", email: "sergio.tavares@empresa.com.br", matricula: "OPE011", cargo: "Operador de Produção", setor_id: 6, perfis: ["Solicitante"], ativo: true },
  { usuario_id: 20, nome: "Tatiana Moreira", email: "tatiana.moreira@empresa.com.br", matricula: "AUD001", cargo: "Auditora Sênior", setor_id: 1, perfis: ["Auditor"], ativo: true },
];

// -----------------------------------------------------------------------------
// Tipos de licença
// -----------------------------------------------------------------------------
export const tiposLicenca: TipoLicenca[] = [
  { tipo_id: 1, nome: "SAP Professional", descricao: "Acesso completo a todos os módulos SAP", custo_mensal: 850, ativo: true },
  { tipo_id: 2, nome: "SAP Limited", descricao: "Acesso restrito a módulos específicos", custo_mensal: 420, ativo: true },
  { tipo_id: 3, nome: "SAP Developer", descricao: "Licença de desenvolvimento e ABAP", custo_mensal: 1200, ativo: true },
  { tipo_id: 4, nome: "SAP Worker", descricao: "Operacional — chão de fábrica e self-service", custo_mensal: 180, ativo: true },
];

// -----------------------------------------------------------------------------
// Limites por setor (estado atual)
// -----------------------------------------------------------------------------
export const setorLimites: SetorLimite[] = [
  // TI
  { setor_id: 1, tipo_id: 1, limite_maximo: 5 },
  { setor_id: 1, tipo_id: 3, limite_maximo: 8 },
  // Financeiro
  { setor_id: 2, tipo_id: 1, limite_maximo: 10 },
  { setor_id: 2, tipo_id: 2, limite_maximo: 5 },
  // Compras
  { setor_id: 3, tipo_id: 1, limite_maximo: 6 },
  { setor_id: 3, tipo_id: 2, limite_maximo: 4 },
  // Vendas
  { setor_id: 4, tipo_id: 1, limite_maximo: 8 },
  { setor_id: 4, tipo_id: 2, limite_maximo: 6 },
  // RH
  { setor_id: 5, tipo_id: 2, limite_maximo: 4 },
  // Operações
  { setor_id: 6, tipo_id: 2, limite_maximo: 3 },
  { setor_id: 6, tipo_id: 4, limite_maximo: 15 },
];

// -----------------------------------------------------------------------------
// Licenças (slots de fato)
// -----------------------------------------------------------------------------
export const licencas: Licenca[] = [
  // TI - Professional
  { licenca_id: 1, codigo_sap: "SAPUSR0001", tipo_id: 1, setor_id: 1, usuario_atual_id: 2, status: "EmUso", data_expiracao: "2026-12-31", criado_em: "2024-01-10" },
  { licenca_id: 2, codigo_sap: "SAPUSR0002", tipo_id: 1, setor_id: 1, usuario_atual_id: 1, status: "EmUso", data_expiracao: "2026-12-31", criado_em: "2024-01-10" },
  { licenca_id: 3, codigo_sap: "SAPUSR0003", tipo_id: 1, setor_id: 1, usuario_atual_id: null, status: "Livre", data_expiracao: "2026-12-31", criado_em: "2024-01-10" },
  // TI - Developer
  { licenca_id: 4, codigo_sap: "SAPDEV0001", tipo_id: 3, setor_id: 1, usuario_atual_id: 2, status: "EmUso", data_expiracao: "2026-12-31", criado_em: "2024-01-10" },
  { licenca_id: 5, codigo_sap: "SAPDEV0002", tipo_id: 3, setor_id: 1, usuario_atual_id: null, status: "Livre", data_expiracao: "2026-12-31", criado_em: "2024-01-10" },
  { licenca_id: 6, codigo_sap: "SAPDEV0003", tipo_id: 3, setor_id: 1, usuario_atual_id: null, status: "Inativa", data_expiracao: "2026-12-31", criado_em: "2024-01-10" },
  // Financeiro - Professional
  { licenca_id: 7, codigo_sap: "SAPUSR0010", tipo_id: 1, setor_id: 2, usuario_atual_id: 3, status: "EmUso", data_expiracao: "2026-12-31", criado_em: "2024-01-15" },
  { licenca_id: 8, codigo_sap: "SAPUSR0011", tipo_id: 1, setor_id: 2, usuario_atual_id: 11, status: "EmUso", data_expiracao: "2026-12-31", criado_em: "2024-01-15" },
  { licenca_id: 9, codigo_sap: "SAPUSR0012", tipo_id: 1, setor_id: 2, usuario_atual_id: 12, status: "EmUso", data_expiracao: "2026-12-31", criado_em: "2024-01-15" },
  { licenca_id: 10, codigo_sap: "SAPUSR0013", tipo_id: 1, setor_id: 2, usuario_atual_id: null, status: "Livre", data_expiracao: "2026-12-31", criado_em: "2024-01-15" },
  // Financeiro - Limited
  { licenca_id: 11, codigo_sap: "SAPLIM0001", tipo_id: 2, setor_id: 2, usuario_atual_id: null, status: "Livre", data_expiracao: "2026-12-31", criado_em: "2024-01-15" },
  { licenca_id: 12, codigo_sap: "SAPLIM0002", tipo_id: 2, setor_id: 2, usuario_atual_id: null, status: "Livre", data_expiracao: "2026-12-31", criado_em: "2024-01-15" },
  // Compras
  { licenca_id: 13, codigo_sap: "SAPUSR0020", tipo_id: 1, setor_id: 3, usuario_atual_id: 4, status: "EmUso", data_expiracao: "2026-12-31", criado_em: "2024-02-01" },
  { licenca_id: 14, codigo_sap: "SAPUSR0021", tipo_id: 1, setor_id: 3, usuario_atual_id: 13, status: "EmUso", data_expiracao: "2026-12-31", criado_em: "2024-02-01" },
  { licenca_id: 15, codigo_sap: "SAPLIM0010", tipo_id: 2, setor_id: 3, usuario_atual_id: 14, status: "EmUso", data_expiracao: "2026-12-31", criado_em: "2024-02-01" },
  // Vendas
  { licenca_id: 16, codigo_sap: "SAPUSR0030", tipo_id: 1, setor_id: 4, usuario_atual_id: 5, status: "EmUso", data_expiracao: "2026-12-31", criado_em: "2024-02-15" },
  { licenca_id: 17, codigo_sap: "SAPUSR0031", tipo_id: 1, setor_id: 4, usuario_atual_id: 15, status: "EmUso", data_expiracao: "2026-12-31", criado_em: "2024-02-15" },
  { licenca_id: 18, codigo_sap: "SAPUSR0032", tipo_id: 1, setor_id: 4, usuario_atual_id: null, status: "Livre", data_expiracao: "2026-12-31", criado_em: "2024-02-15" },
  { licenca_id: 19, codigo_sap: "SAPLIM0020", tipo_id: 2, setor_id: 4, usuario_atual_id: 16, status: "EmUso", data_expiracao: "2026-12-31", criado_em: "2024-02-15" },
  // RH
  { licenca_id: 20, codigo_sap: "SAPLIM0030", tipo_id: 2, setor_id: 5, usuario_atual_id: 6, status: "EmUso", data_expiracao: "2026-12-31", criado_em: "2024-03-01" },
  { licenca_id: 21, codigo_sap: "SAPLIM0031", tipo_id: 2, setor_id: 5, usuario_atual_id: 17, status: "EmUso", data_expiracao: "2026-12-31", criado_em: "2024-03-01" },
  // Operações
  { licenca_id: 22, codigo_sap: "SAPLIM0040", tipo_id: 2, setor_id: 6, usuario_atual_id: 10, status: "EmUso", data_expiracao: "2026-12-31", criado_em: "2024-03-15" },
  { licenca_id: 23, codigo_sap: "SAPWRK0001", tipo_id: 4, setor_id: 6, usuario_atual_id: 18, status: "EmUso", data_expiracao: "2026-12-31", criado_em: "2024-03-15" },
  { licenca_id: 24, codigo_sap: "SAPWRK0002", tipo_id: 4, setor_id: 6, usuario_atual_id: 19, status: "EmUso", data_expiracao: "2026-12-31", criado_em: "2024-03-15" },
  { licenca_id: 25, codigo_sap: "SAPWRK0003", tipo_id: 4, setor_id: 6, usuario_atual_id: null, status: "Livre", data_expiracao: "2026-12-31", criado_em: "2024-03-15" },
];

// -----------------------------------------------------------------------------
// Solicitações
// -----------------------------------------------------------------------------
export const solicitacoes: SolicitacaoLicenca[] = [
  // Pendente gestor — solicitante da Juliana (Financeiro) quer uma SAP Limited
  {
    solicitacao_id: 101,
    solicitante_id: 11,
    beneficiario_id: 11,
    setor_id: 2,
    tipo_id: 2,
    modalidade: "Nova",
    licenca_origem_id: null,
    justificativa: "Necessito de acesso ao módulo FI para reconciliação bancária diária.",
    status: "PendenteGestor",
    criado_em: "2026-05-08T10:30:00",
    atualizado_em: "2026-05-08T10:30:00",
    licenca_concedida_id: null,
  },
  // Pendente diretor — Vendas pediu, gestor aprovou, agora aguarda diretor (exige_aprovacao_diretor=true)
  {
    solicitacao_id: 102,
    solicitante_id: 15,
    beneficiario_id: 15,
    setor_id: 4,
    tipo_id: 1,
    modalidade: "Nova",
    licenca_origem_id: null,
    justificativa: "Substituir colaborador desligado — necessário para gestão de pedidos.",
    status: "PendenteDiretor",
    criado_em: "2026-05-06T14:15:00",
    atualizado_em: "2026-05-07T09:00:00",
    licenca_concedida_id: null,
  },
  // Pendente TI — passou pelo gestor e diretor, aguarda concessão final
  {
    solicitacao_id: 103,
    solicitante_id: 13,
    beneficiario_id: 13,
    setor_id: 3,
    tipo_id: 2,
    modalidade: "Nova",
    licenca_origem_id: null,
    justificativa: "Sou novo colaborador, precisarei acessar PR/PO no SAP MM.",
    status: "PendenteTI",
    criado_em: "2026-05-04T11:00:00",
    atualizado_em: "2026-05-06T16:30:00",
    licenca_concedida_id: null,
  },
  // Aprovada e concluída (já vinculou a licença)
  {
    solicitacao_id: 104,
    solicitante_id: 14,
    beneficiario_id: 14,
    setor_id: 3,
    tipo_id: 2,
    modalidade: "Nova",
    licenca_origem_id: null,
    justificativa: "Acesso requerido para análise de cotações.",
    status: "Concluido",
    criado_em: "2026-04-22T09:00:00",
    atualizado_em: "2026-04-28T15:00:00",
    licenca_concedida_id: 15,
  },
  // Rejeitada
  {
    solicitacao_id: 105,
    solicitante_id: 17,
    beneficiario_id: 17,
    setor_id: 5,
    tipo_id: 1,
    modalidade: "Nova",
    licenca_origem_id: null,
    justificativa: "Quero acessar SAP completo.",
    status: "Rejeitado",
    criado_em: "2026-05-02T08:30:00",
    atualizado_em: "2026-05-02T18:00:00",
    licenca_concedida_id: null,
  },
  // Transferência pendente — Lucas quer pegar a licença da Juliana (mesmo setor)
  {
    solicitacao_id: 106,
    solicitante_id: 12,
    beneficiario_id: 12,
    setor_id: 2,
    tipo_id: 1,
    modalidade: "Transferencia",
    licenca_origem_id: 8,
    justificativa: "Juliana foi promovida e cederá a licença atual conforme alinhamento.",
    status: "PendenteGestor",
    criado_em: "2026-05-10T11:00:00",
    atualizado_em: "2026-05-10T11:00:00",
    licenca_concedida_id: null,
  },
  // Rascunho do Sergio
  {
    solicitacao_id: 107,
    solicitante_id: 19,
    beneficiario_id: 19,
    setor_id: 6,
    tipo_id: 4,
    modalidade: "Nova",
    licenca_origem_id: null,
    justificativa: "",
    status: "Rascunho",
    criado_em: "2026-05-12T16:00:00",
    atualizado_em: "2026-05-12T16:00:00",
    licenca_concedida_id: null,
  },
];

// -----------------------------------------------------------------------------
// Aprovações (linhas geradas em cada etapa do fluxo)
// -----------------------------------------------------------------------------
export const aprovacoes: AprovacaoSolicitacao[] = [
  // 101 — pendente gestor
  { aprovacao_id: 1, solicitacao_id: 101, etapa: "Gestor", aprovador_id: null, decisao: "Pendente", comentario: null, decidido_em: null, criado_em: "2026-05-08T10:30:00" },

  // 102 — gestor aprovou, aguarda diretor
  { aprovacao_id: 2, solicitacao_id: 102, etapa: "Gestor", aprovador_id: 5, decisao: "Aprovado", comentario: "Substituição necessária, ok.", decidido_em: "2026-05-07T09:00:00", criado_em: "2026-05-06T14:15:00" },
  { aprovacao_id: 3, solicitacao_id: 102, etapa: "Diretor", aprovador_id: null, decisao: "Pendente", comentario: null, decidido_em: null, criado_em: "2026-05-07T09:00:00" },

  // 103 — gestor aprovou, sem diretor (Compras não exige), aguarda TI
  { aprovacao_id: 4, solicitacao_id: 103, etapa: "Gestor", aprovador_id: 4, decisao: "Aprovado", comentario: "Necessidade comprovada.", decidido_em: "2026-05-05T10:30:00", criado_em: "2026-05-04T11:00:00" },
  { aprovacao_id: 5, solicitacao_id: 103, etapa: "TI", aprovador_id: null, decisao: "Pendente", comentario: null, decidido_em: null, criado_em: "2026-05-05T10:30:00" },

  // 104 — fluxo completo
  { aprovacao_id: 6, solicitacao_id: 104, etapa: "Gestor", aprovador_id: 4, decisao: "Aprovado", comentario: "OK.", decidido_em: "2026-04-23T10:00:00", criado_em: "2026-04-22T09:00:00" },
  { aprovacao_id: 7, solicitacao_id: 104, etapa: "TI", aprovador_id: 2, decisao: "Aprovado", comentario: "Licença SAPLIM0010 atribuída.", decidido_em: "2026-04-28T15:00:00", criado_em: "2026-04-23T10:00:00" },

  // 105 — rejeitada pelo gestor
  { aprovacao_id: 8, solicitacao_id: 105, etapa: "Gestor", aprovador_id: 6, decisao: "Rejeitado", comentario: "Justificativa insuficiente. Detalhar quais módulos serão usados e por quanto tempo.", decidido_em: "2026-05-02T18:00:00", criado_em: "2026-05-02T08:30:00" },

  // 106 — transferência pendente gestor
  { aprovacao_id: 9, solicitacao_id: 106, etapa: "Gestor", aprovador_id: null, decisao: "Pendente", comentario: null, decidido_em: null, criado_em: "2026-05-10T11:00:00" },
];

// -----------------------------------------------------------------------------
// Histórico de licenças (movimentação)
// -----------------------------------------------------------------------------
export const historicoLicencas: HistoricoLicenca[] = [
  { historico_id: 1, licenca_id: 1, tipo_evento: "Atribuicao", usuario_anterior_id: null, usuario_novo_id: 2, solicitacao_id: null, executado_por: 1, executado_em: "2024-01-10T09:00:00", observacao: "Carga inicial do sistema." },
  { historico_id: 2, licenca_id: 7, tipo_evento: "Atribuicao", usuario_anterior_id: null, usuario_novo_id: 3, solicitacao_id: null, executado_por: 1, executado_em: "2024-01-15T09:00:00", observacao: "Carga inicial." },
  { historico_id: 3, licenca_id: 15, tipo_evento: "Atribuicao", usuario_anterior_id: null, usuario_novo_id: 14, solicitacao_id: 104, executado_por: 2, executado_em: "2026-04-28T15:00:00", observacao: "Concessão pós-aprovação final." },
  { historico_id: 4, licenca_id: 6, tipo_evento: "Desativacao", usuario_anterior_id: null, usuario_novo_id: null, solicitacao_id: null, executado_por: 1, executado_em: "2026-03-20T14:00:00", observacao: "Licença desativada por economia de custo (sem usuário ativo há 60 dias)." },
  { historico_id: 5, licenca_id: 22, tipo_evento: "Transferencia", usuario_anterior_id: 18, usuario_novo_id: 10, solicitacao_id: null, executado_por: 1, executado_em: "2026-02-15T11:00:00", observacao: "Transferência aprovada pelo administrador." },
];

// -----------------------------------------------------------------------------
// Auditoria
// -----------------------------------------------------------------------------
export const auditoria: AuditoriaSistema[] = [
  { auditoria_id: 1, usuario_id: 1, acao: "Login", entidade: "Sessao", entidade_id: null, ip_origem: "10.0.0.15", executado_em: "2026-05-13T08:30:00", detalhe: "Login bem-sucedido." },
  { auditoria_id: 2, usuario_id: 2, acao: "Login", entidade: "Sessao", entidade_id: null, ip_origem: "10.0.0.22", executado_em: "2026-05-13T08:45:00", detalhe: "Login bem-sucedido." },
  { auditoria_id: 3, usuario_id: 1, acao: "LimiteAlterado", entidade: "SetorLimite", entidade_id: 2, ip_origem: "10.0.0.15", executado_em: "2026-05-10T16:20:00", detalhe: "Limite SAP Professional do Financeiro alterado de 8 para 10." },
  { auditoria_id: 4, usuario_id: 5, acao: "AprovacaoSolicitacao", entidade: "Solicitacao", entidade_id: 102, ip_origem: "10.0.0.31", executado_em: "2026-05-07T09:00:00", detalhe: "Aprovação na etapa Gestor." },
  { auditoria_id: 5, usuario_id: 6, acao: "RejeicaoSolicitacao", entidade: "Solicitacao", entidade_id: 105, ip_origem: "10.0.0.40", executado_em: "2026-05-02T18:00:00", detalhe: "Rejeição na etapa Gestor — justificativa insuficiente." },
  { auditoria_id: 6, usuario_id: null, acao: "LoginFalhou", entidade: "Sessao", entidade_id: null, ip_origem: "10.0.0.99", executado_em: "2026-05-12T03:14:00", detalhe: "Tentativa de login com email inexistente: hacker@externo.com." },
];

// Mapa de permissões por perfil — espelha o que estará nas tabelas PerfilPermissao.
// Decisão: "visualizar" foi separado em duas permissões granulares —
//   - licencas:visualizar_lista       → inventário completo (aba "Licenças")
//   - licencas:visualizar_historico   → linha do tempo (aba "Histórico")
// Solicitante e Diretor não têm acesso à aba "Licenças" (inventário),
// mas continuam podendo solicitar e visualizar o histórico.
export const permissoesPorPerfil = {
  Solicitante: [
    "licencas:solicitar",
  ],
  Gestor: [
    "dashboard:visualizar",
    "licencas:visualizar_lista",
    "licencas:visualizar_historico",
    "licencas:solicitar",
    "licencas:aprovar_gestor",
  ],
  Diretor: [
    "dashboard:visualizar",
    "licencas:visualizar_historico",
    "licencas:solicitar",
    "licencas:aprovar_diretor",
  ],
  GerenteTI: [
    "dashboard:visualizar",
    "licencas:visualizar_lista",
    "licencas:visualizar_historico",
    "licencas:aprovar_ti",
    "licencas:transferir",
    "licencas:ativar_desativar",
  ],
  Administrador: [
    "dashboard:visualizar",
    "licencas:visualizar_lista",
    "licencas:visualizar_historico",
    "licencas:solicitar",
    "licencas:aprovar_gestor",
    "licencas:aprovar_diretor",
    "licencas:aprovar_ti",
    "licencas:transferir",
    "licencas:ativar_desativar",
    "setor:editar_limite",
    "setor:gerenciar",
    "usuarios:gerenciar",
    "perfis:gerenciar",
    "auditoria:visualizar",
  ],
  Auditor: [
    "dashboard:visualizar",
    "licencas:visualizar_lista",
    "licencas:visualizar_historico",
    "auditoria:visualizar",
  ],
} as const;
