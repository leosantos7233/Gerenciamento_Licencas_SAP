// =============================================================================
// Tipos de domínio do sistema de gestão de licenças SAP.
// Espelham (em TypeScript) o que iremos ter como tabelas no SQL Server.
// =============================================================================

export type PerfilNome =
  | "Solicitante"
  | "Gestor"
  | "Diretor"
  | "GerenteTI"
  | "Administrador"
  | "Auditor";

export type PermissaoChave =
  | "dashboard:visualizar"
  | "licencas:visualizar_lista"
  | "licencas:visualizar_historico"
  | "licencas:solicitar"
  | "licencas:aprovar_gestor"
  | "licencas:aprovar_diretor"
  | "licencas:aprovar_ti"
  | "licencas:transferir"
  | "licencas:ativar_desativar"
  | "setor:editar_limite"
  | "setor:gerenciar"
  | "usuarios:gerenciar"
  | "perfis:gerenciar"
  | "auditoria:visualizar";

export interface Setor {
  setor_id: number;
  nome: string;
  sigla: string;
  gestor_id: number | null;
  diretor_id: number | null;
  exige_aprovacao_diretor: boolean;
  // Se false, o(s) Gestor(es) deste setor não enxergam a aba Dashboard.
  // Útil para setores onde Gestor não tem visão estratégica (ex.: Vendas operacional).
  gestor_ve_dashboard: boolean;
  ativo: boolean;
}

export interface Usuario {
  usuario_id: number;
  nome: string;
  email: string;
  matricula: string;
  cargo: string;
  setor_id: number;
  perfis: PerfilNome[];
  ativo: boolean;
}

export interface TipoLicenca {
  tipo_id: number;
  nome: string;
  descricao: string;
  custo_mensal: number;
  ativo: boolean;
}

export interface SetorLimite {
  setor_id: number;
  tipo_id: number;
  limite_maximo: number;
}

export type StatusLicenca = "Livre" | "EmUso" | "Inativa" | "Reservada";

export interface Licenca {
  licenca_id: number;
  codigo_sap: string;
  tipo_id: number;
  setor_id: number;
  usuario_atual_id: number | null;
  status: StatusLicenca;
  data_expiracao: string | null;
  criado_em: string;
}

export type ModalidadeSolicitacao = "Nova" | "Transferencia";

export type StatusSolicitacao =
  | "Rascunho"
  | "PendenteGestor"
  | "PendenteDiretor"
  | "PendenteTI"
  | "Aprovado"
  | "Rejeitado"
  | "Cancelado"
  | "Concluido";

export interface SolicitacaoLicenca {
  solicitacao_id: number;
  solicitante_id: number;
  beneficiario_id: number;
  setor_id: number;
  tipo_id: number;
  modalidade: ModalidadeSolicitacao;
  licenca_origem_id: number | null;
  justificativa: string;
  status: StatusSolicitacao;
  criado_em: string;
  atualizado_em: string;
  licenca_concedida_id: number | null;
}

export type EtapaAprovacao = "Gestor" | "Diretor" | "TI";
export type DecisaoAprovacao = "Pendente" | "Aprovado" | "Rejeitado";

export interface AprovacaoSolicitacao {
  aprovacao_id: number;
  solicitacao_id: number;
  etapa: EtapaAprovacao;
  aprovador_id: number | null;
  decisao: DecisaoAprovacao;
  comentario: string | null;
  decidido_em: string | null;
  criado_em: string;
}

export type TipoEventoLicenca =
  | "Atribuicao"
  | "Transferencia"
  | "Ativacao"
  | "Desativacao"
  | "Revogacao";

export interface HistoricoLicenca {
  historico_id: number;
  licenca_id: number;
  tipo_evento: TipoEventoLicenca;
  usuario_anterior_id: number | null;
  usuario_novo_id: number | null;
  solicitacao_id: number | null;
  executado_por: number;
  executado_em: string;
  observacao: string | null;
}

export interface AuditoriaSistema {
  auditoria_id: number;
  usuario_id: number | null;
  acao: string;
  entidade: string;
  entidade_id: number | null;
  ip_origem: string;
  executado_em: string;
  detalhe: string;
}

// Visões agregadas (montadas pelo "fake API" — no real, viriam de uma view SQL).
export interface DashboardResumo {
  total_licencas: number;
  em_uso: number;
  disponiveis: number;
  inativas: number;
  pendentes_aprovacao: number;
  por_setor: Array<{
    setor_id: number;
    setor_nome: string;
    total: number;
    em_uso: number;
    disponiveis: number;
    limite_total: number;
  }>;
  por_tipo: Array<{
    tipo_id: number;
    tipo_nome: string;
    em_uso: number;
    disponiveis: number;
    custo_total_mensal: number;
  }>;
}
