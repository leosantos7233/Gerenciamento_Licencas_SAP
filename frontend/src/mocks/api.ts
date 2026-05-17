// =============================================================================
// "Fake API" — simula chamadas HTTP retornando dados do mock com pequeno delay.
// Quando o backend real existir, basta substituir esses corpos por axios.get().
// =============================================================================

import type {
  AprovacaoSolicitacao,
  AuditoriaSistema,
  DashboardResumo,
  HistoricoLicenca,
  Licenca,
  PerfilNome,
  PermissaoChave,
  SetorLimite,
  Setor,
  SolicitacaoLicenca,
  StatusSolicitacao,
  TipoLicenca,
  Usuario,
} from "@/types";
import {
  aprovacoes as mockAprovacoes,
  auditoria as mockAuditoria,
  historicoLicencas as mockHistorico,
  licencas as mockLicencas,
  permissoesPorPerfil,
  setorLimites as mockSetorLimites,
  setores as mockSetores,
  solicitacoes as mockSolicitacoes,
  tiposLicenca as mockTiposLicenca,
  usuarios as mockUsuarios,
} from "./dados";

// Memória mutável — mantém estado durante a sessão (até refresh do navegador).
let usuarios = [...mockUsuarios];
let setores = [...mockSetores];
let tiposLicenca = [...mockTiposLicenca];
let setorLimites = [...mockSetorLimites];
let licencas = [...mockLicencas];
let solicitacoes = [...mockSolicitacoes];
let aprovacoes = [...mockAprovacoes];
let historicoLicencas = [...mockHistorico];
let auditoria = [...mockAuditoria];

function delay<T>(valor: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(valor), ms));
}

function proximoId(arr: { [k: string]: any }[], chave: string): number {
  return arr.length === 0 ? 1 : Math.max(...arr.map((x) => x[chave] as number)) + 1;
}

// -----------------------------------------------------------------------------
// Autenticação
// -----------------------------------------------------------------------------
export async function fakeLogin(email: string, senha: string): Promise<Usuario> {
  await delay(null, 400);
  const user = usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !user.ativo) {
    throw new Error("Usuário ou senha inválidos.");
  }
  // No mock, qualquer senha não-vazia funciona.
  if (!senha || senha.length < 3) {
    throw new Error("Usuário ou senha inválidos.");
  }
  auditoria = [
    {
      auditoria_id: proximoId(auditoria, "auditoria_id"),
      usuario_id: user.usuario_id,
      acao: "Login",
      entidade: "Sessao",
      entidade_id: null,
      ip_origem: "127.0.0.1",
      executado_em: new Date().toISOString(),
      detalhe: "Login (mock).",
    },
    ...auditoria,
  ];
  return user;
}

export function permissoesDoUsuario(user: Usuario): PermissaoChave[] {
  const set = new Set<PermissaoChave>();
  for (const p of user.perfis as PerfilNome[]) {
    for (const k of permissoesPorPerfil[p] ?? []) {
      set.add(k as PermissaoChave);
    }
  }
  return Array.from(set);
}

// -----------------------------------------------------------------------------
// Listagens simples
// -----------------------------------------------------------------------------
export const fakeApi = {
  async listarUsuarios(): Promise<Usuario[]> { return delay([...usuarios]); },
  async obterUsuario(id: number): Promise<Usuario | undefined> { return delay(usuarios.find((u) => u.usuario_id === id)); },
  async listarSetores(): Promise<Setor[]> { return delay([...setores]); },
  async listarTipos(): Promise<TipoLicenca[]> { return delay([...tiposLicenca]); },
  async listarLimites(): Promise<SetorLimite[]> { return delay([...setorLimites]); },
  async listarLicencas(): Promise<Licenca[]> { return delay([...licencas]); },
  async obterLicenca(id: number): Promise<Licenca | undefined> {
    return delay(licencas.find((l) => l.licenca_id === id));
  },
  async historicoDaLicenca(licencaId: number): Promise<HistoricoLicenca[]> {
    return delay(
      historicoLicencas
        .filter((h) => h.licenca_id === licencaId)
        .sort((a, b) => a.executado_em.localeCompare(b.executado_em)) // cronológico ASC
    );
  },
  async solicitacoesDaLicenca(licencaId: number): Promise<SolicitacaoLicenca[]> {
    return delay(
      solicitacoes.filter(
        (s) => s.licenca_origem_id === licencaId || s.licenca_concedida_id === licencaId
      )
    );
  },
  async listarHistorico(): Promise<HistoricoLicenca[]> { return delay([...historicoLicencas]); },
  async listarAuditoria(): Promise<AuditoriaSistema[]> {
    return delay([...auditoria].sort((a, b) => b.executado_em.localeCompare(a.executado_em)));
  },

  // -----------------------------------------------------------------------
  // Solicitações
  // -----------------------------------------------------------------------
  async listarSolicitacoes(): Promise<SolicitacaoLicenca[]> { return delay([...solicitacoes]); },

  async listarMinhasSolicitacoes(usuarioId: number): Promise<SolicitacaoLicenca[]> {
    return delay(solicitacoes.filter((s) => s.solicitante_id === usuarioId || s.beneficiario_id === usuarioId));
  },

  async listarAprovacoesPendentesPara(usuario: Usuario): Promise<SolicitacaoLicenca[]> {
    const ehGestor = usuario.perfis.includes("Gestor") || usuario.perfis.includes("Administrador");
    const ehDiretor = usuario.perfis.includes("Diretor") || usuario.perfis.includes("Administrador");
    const ehTI = usuario.perfis.includes("GerenteTI") || usuario.perfis.includes("Administrador");
    const setoresGeridos = setores.filter((s) => s.gestor_id === usuario.usuario_id).map((s) => s.setor_id);
    const setoresDirigidos = setores.filter((s) => s.diretor_id === usuario.usuario_id).map((s) => s.setor_id);

    return delay(
      solicitacoes.filter((s) => {
        if (s.status === "PendenteGestor" && ehGestor) {
          if (usuario.perfis.includes("Administrador")) return true;
          return setoresGeridos.includes(s.setor_id);
        }
        if (s.status === "PendenteDiretor" && ehDiretor) {
          if (usuario.perfis.includes("Administrador")) return true;
          return setoresDirigidos.includes(s.setor_id);
        }
        if (s.status === "PendenteTI" && ehTI) return true;
        return false;
      })
    );
  },

  async obterSolicitacao(id: number): Promise<SolicitacaoLicenca | undefined> {
    return delay(solicitacoes.find((s) => s.solicitacao_id === id));
  },

  async listarAprovacoesDa(solicitacaoId: number): Promise<AprovacaoSolicitacao[]> {
    return delay(aprovacoes.filter((a) => a.solicitacao_id === solicitacaoId));
  },

  async criarSolicitacao(input: {
    solicitante_id: number;
    beneficiario_id: number;
    setor_id: number;
    tipo_id: number;
    modalidade: "Nova" | "Transferencia";
    licenca_origem_id: number | null;
    justificativa: string;
    enviar: boolean; // true = vai pra PendenteGestor, false = Rascunho
  }): Promise<SolicitacaoLicenca> {
    const id = proximoId(solicitacoes, "solicitacao_id");
    const agora = new Date().toISOString();
    const nova: SolicitacaoLicenca = {
      solicitacao_id: id,
      solicitante_id: input.solicitante_id,
      beneficiario_id: input.beneficiario_id,
      setor_id: input.setor_id,
      tipo_id: input.tipo_id,
      modalidade: input.modalidade,
      licenca_origem_id: input.licenca_origem_id,
      justificativa: input.justificativa,
      status: input.enviar ? "PendenteGestor" : "Rascunho",
      criado_em: agora,
      atualizado_em: agora,
      licenca_concedida_id: null,
    };
    solicitacoes = [nova, ...solicitacoes];
    if (input.enviar) {
      aprovacoes = [
        ...aprovacoes,
        {
          aprovacao_id: proximoId(aprovacoes, "aprovacao_id"),
          solicitacao_id: id,
          etapa: "Gestor",
          aprovador_id: null,
          decisao: "Pendente",
          comentario: null,
          decidido_em: null,
          criado_em: agora,
        },
      ];
    }
    return delay(nova);
  },

  async decidirAprovacao(input: {
    solicitacao_id: number;
    etapa: "Gestor" | "Diretor" | "TI";
    aprovador_id: number;
    decisao: "Aprovado" | "Rejeitado";
    comentario: string;
  }): Promise<SolicitacaoLicenca> {
    const sol = solicitacoes.find((s) => s.solicitacao_id === input.solicitacao_id);
    if (!sol) throw new Error("Solicitação não encontrada.");
    if (input.decisao === "Rejeitado" && !input.comentario.trim()) {
      throw new Error("Comentário obrigatório em rejeição.");
    }
    const agora = new Date().toISOString();

    // Atualiza a linha de aprovação correspondente
    aprovacoes = aprovacoes.map((a) =>
      a.solicitacao_id === input.solicitacao_id && a.etapa === input.etapa && a.decisao === "Pendente"
        ? {
            ...a,
            aprovador_id: input.aprovador_id,
            decisao: input.decisao,
            comentario: input.comentario,
            decidido_em: agora,
          }
        : a
    );

    // Determina próximo status
    let novoStatus: StatusSolicitacao = sol.status;
    let licencaConcedidaId: number | null = sol.licenca_concedida_id;
    if (input.decisao === "Rejeitado") {
      novoStatus = "Rejeitado";
    } else if (input.etapa === "Gestor") {
      const setor = setores.find((s) => s.setor_id === sol.setor_id);
      const exigeDiretor = setor?.exige_aprovacao_diretor && sol.modalidade === "Nova";
      novoStatus = exigeDiretor ? "PendenteDiretor" : "PendenteTI";
      // Cria a próxima linha de aprovação
      aprovacoes = [
        ...aprovacoes,
        {
          aprovacao_id: proximoId(aprovacoes, "aprovacao_id"),
          solicitacao_id: input.solicitacao_id,
          etapa: exigeDiretor ? "Diretor" : "TI",
          aprovador_id: null,
          decisao: "Pendente",
          comentario: null,
          decidido_em: null,
          criado_em: agora,
        },
      ];
    } else if (input.etapa === "Diretor") {
      novoStatus = "PendenteTI";
      aprovacoes = [
        ...aprovacoes,
        {
          aprovacao_id: proximoId(aprovacoes, "aprovacao_id"),
          solicitacao_id: input.solicitacao_id,
          etapa: "TI",
          aprovador_id: null,
          decisao: "Pendente",
          comentario: null,
          decidido_em: null,
          criado_em: agora,
        },
      ];
    } else if (input.etapa === "TI") {
      // Vincula licença (regra #5 da Etapa 1: aprovação final concede automaticamente)
      const licencaLivre = licencas.find(
        (l) => l.setor_id === sol.setor_id && l.tipo_id === sol.tipo_id && l.status === "Livre"
      );
      if (!licencaLivre) {
        throw new Error("Não há licença disponível no setor para concessão automática.");
      }
      licencas = licencas.map((l) =>
        l.licenca_id === licencaLivre.licenca_id
          ? { ...l, status: "EmUso", usuario_atual_id: sol.beneficiario_id }
          : l
      );
      licencaConcedidaId = licencaLivre.licenca_id;
      novoStatus = "Concluido";
      historicoLicencas = [
        {
          historico_id: proximoId(historicoLicencas, "historico_id"),
          licenca_id: licencaLivre.licenca_id,
          tipo_evento: "Atribuicao",
          usuario_anterior_id: null,
          usuario_novo_id: sol.beneficiario_id,
          solicitacao_id: sol.solicitacao_id,
          executado_por: input.aprovador_id,
          executado_em: agora,
          observacao: "Concessão automática pós-aprovação final.",
        },
        ...historicoLicencas,
      ];
    }

    solicitacoes = solicitacoes.map((s) =>
      s.solicitacao_id === input.solicitacao_id
        ? { ...s, status: novoStatus, atualizado_em: agora, licenca_concedida_id: licencaConcedidaId }
        : s
    );

    auditoria = [
      {
        auditoria_id: proximoId(auditoria, "auditoria_id"),
        usuario_id: input.aprovador_id,
        acao: input.decisao === "Aprovado" ? "AprovacaoSolicitacao" : "RejeicaoSolicitacao",
        entidade: "Solicitacao",
        entidade_id: input.solicitacao_id,
        ip_origem: "127.0.0.1",
        executado_em: agora,
        detalhe: `${input.decisao} na etapa ${input.etapa}.`,
      },
      ...auditoria,
    ];

    return delay(solicitacoes.find((s) => s.solicitacao_id === input.solicitacao_id)!);
  },

  async cancelarSolicitacao(input: { solicitacao_id: number; cancelado_por: number; motivo: string }): Promise<SolicitacaoLicenca> {
    const sol = solicitacoes.find((s) => s.solicitacao_id === input.solicitacao_id);
    if (!sol) throw new Error("Solicitação não encontrada.");
    if (sol.solicitante_id !== input.cancelado_por) {
      throw new Error("Apenas o solicitante pode cancelar a própria solicitação.");
    }
    if (!["Rascunho", "PendenteGestor", "PendenteDiretor", "PendenteTI"].includes(sol.status)) {
      throw new Error(`Solicitação no status "${sol.status}" não pode ser cancelada.`);
    }
    const agora = new Date().toISOString();
    solicitacoes = solicitacoes.map((s) =>
      s.solicitacao_id === input.solicitacao_id ? { ...s, status: "Cancelado", atualizado_em: agora } : s
    );
    // Marca aprovações pendentes como canceladas (no real seria um soft-delete; aqui registramos comentário)
    aprovacoes = aprovacoes.map((a) =>
      a.solicitacao_id === input.solicitacao_id && a.decisao === "Pendente"
        ? { ...a, comentario: `[Cancelado pelo solicitante] ${input.motivo}`.trim(), decidido_em: agora }
        : a
    );
    auditoria = [
      {
        auditoria_id: proximoId(auditoria, "auditoria_id"),
        usuario_id: input.cancelado_por,
        acao: "CancelamentoSolicitacao",
        entidade: "Solicitacao",
        entidade_id: input.solicitacao_id,
        ip_origem: "127.0.0.1",
        executado_em: agora,
        detalhe: `Solicitação cancelada pelo solicitante. Motivo: ${input.motivo || "(não informado)"}`,
      },
      ...auditoria,
    ];
    return delay(solicitacoes.find((s) => s.solicitacao_id === input.solicitacao_id)!);
  },

  // -----------------------------------------------------------------------
  // Ações em licenças individuais (Admin / Gerente TI)
  // -----------------------------------------------------------------------
  async transferirLicenca(input: {
    licenca_id: number;
    novo_usuario_id: number;
    executado_por: number;
    observacao: string;
  }): Promise<Licenca> {
    const lic = licencas.find((l) => l.licenca_id === input.licenca_id);
    if (!lic) throw new Error("Licença não encontrada.");
    if (lic.status === "Inativa") throw new Error("Não é possível transferir uma licença inativa.");

    const novoUsuario = usuarios.find((u) => u.usuario_id === input.novo_usuario_id);
    if (!novoUsuario) throw new Error("Usuário destino não encontrado.");
    if (!novoUsuario.ativo) throw new Error("Usuário destino está inativo.");
    if (novoUsuario.setor_id !== lic.setor_id) {
      throw new Error("Licença só pode ser atribuída a usuário do mesmo setor (regra geral).");
    }
    // Verifica se o usuário já tem licença do mesmo tipo
    const jaTem = licencas.some(
      (l) => l.usuario_atual_id === input.novo_usuario_id && l.tipo_id === lic.tipo_id && l.status === "EmUso" && l.licenca_id !== lic.licenca_id
    );
    if (jaTem) throw new Error("Usuário destino já possui uma licença ativa do mesmo tipo.");

    const agora = new Date().toISOString();
    const usuarioAnterior = lic.usuario_atual_id;
    licencas = licencas.map((l) =>
      l.licenca_id === input.licenca_id
        ? { ...l, usuario_atual_id: input.novo_usuario_id, status: "EmUso" }
        : l
    );
    historicoLicencas = [
      {
        historico_id: proximoId(historicoLicencas, "historico_id"),
        licenca_id: input.licenca_id,
        tipo_evento: usuarioAnterior ? "Transferencia" : "Atribuicao",
        usuario_anterior_id: usuarioAnterior,
        usuario_novo_id: input.novo_usuario_id,
        solicitacao_id: null,
        executado_por: input.executado_por,
        executado_em: agora,
        observacao: input.observacao || "Transferência manual.",
      },
      ...historicoLicencas,
    ];
    auditoria = [
      {
        auditoria_id: proximoId(auditoria, "auditoria_id"),
        usuario_id: input.executado_por,
        acao: "LicencaTransferida",
        entidade: "Licenca",
        entidade_id: input.licenca_id,
        ip_origem: "127.0.0.1",
        executado_em: agora,
        detalhe: `Licença ${lic.codigo_sap} transferida de #${usuarioAnterior ?? "—"} para #${input.novo_usuario_id}.`,
      },
      ...auditoria,
    ];
    return delay(licencas.find((l) => l.licenca_id === input.licenca_id)!);
  },

  async revogarLicenca(input: { licenca_id: number; executado_por: number; observacao: string }): Promise<Licenca> {
    const lic = licencas.find((l) => l.licenca_id === input.licenca_id);
    if (!lic) throw new Error("Licença não encontrada.");
    if (lic.status !== "EmUso") throw new Error("Apenas licenças em uso podem ser revogadas.");
    const agora = new Date().toISOString();
    const usuarioAnterior = lic.usuario_atual_id;
    licencas = licencas.map((l) =>
      l.licenca_id === input.licenca_id ? { ...l, usuario_atual_id: null, status: "Livre" } : l
    );
    historicoLicencas = [
      {
        historico_id: proximoId(historicoLicencas, "historico_id"),
        licenca_id: input.licenca_id,
        tipo_evento: "Revogacao",
        usuario_anterior_id: usuarioAnterior,
        usuario_novo_id: null,
        solicitacao_id: null,
        executado_por: input.executado_por,
        executado_em: agora,
        observacao: input.observacao || "Revogação manual.",
      },
      ...historicoLicencas,
    ];
    auditoria = [
      {
        auditoria_id: proximoId(auditoria, "auditoria_id"),
        usuario_id: input.executado_por,
        acao: "LicencaRevogada",
        entidade: "Licenca",
        entidade_id: input.licenca_id,
        ip_origem: "127.0.0.1",
        executado_em: agora,
        detalhe: `Licença ${lic.codigo_sap} revogada de #${usuarioAnterior ?? "—"}.`,
      },
      ...auditoria,
    ];
    return delay(licencas.find((l) => l.licenca_id === input.licenca_id)!);
  },

  async alterarStatusLicenca(input: {
    licenca_id: number;
    novo_status: "Ativacao" | "Desativacao";
    executado_por: number;
    observacao: string;
  }): Promise<Licenca> {
    const lic = licencas.find((l) => l.licenca_id === input.licenca_id);
    if (!lic) throw new Error("Licença não encontrada.");
    if (input.novo_status === "Ativacao" && lic.status !== "Inativa") {
      throw new Error("Só é possível ativar uma licença que esteja inativa.");
    }
    if (input.novo_status === "Desativacao" && lic.status === "Inativa") {
      throw new Error("Licença já está inativa.");
    }
    const agora = new Date().toISOString();
    const usuarioAnterior = lic.usuario_atual_id;
    licencas = licencas.map((l) => {
      if (l.licenca_id !== input.licenca_id) return l;
      if (input.novo_status === "Ativacao") {
        return { ...l, status: "Livre", usuario_atual_id: null };
      }
      return { ...l, status: "Inativa", usuario_atual_id: null };
    });
    historicoLicencas = [
      {
        historico_id: proximoId(historicoLicencas, "historico_id"),
        licenca_id: input.licenca_id,
        tipo_evento: input.novo_status,
        usuario_anterior_id: input.novo_status === "Desativacao" ? usuarioAnterior : null,
        usuario_novo_id: null,
        solicitacao_id: null,
        executado_por: input.executado_por,
        executado_em: agora,
        observacao: input.observacao || (input.novo_status === "Ativacao" ? "Ativação manual." : "Desativação manual."),
      },
      ...historicoLicencas,
    ];
    auditoria = [
      {
        auditoria_id: proximoId(auditoria, "auditoria_id"),
        usuario_id: input.executado_por,
        acao: input.novo_status === "Ativacao" ? "LicencaAtivada" : "LicencaDesativada",
        entidade: "Licenca",
        entidade_id: input.licenca_id,
        ip_origem: "127.0.0.1",
        executado_em: agora,
        detalhe: `Licença ${lic.codigo_sap}: ${input.novo_status === "Ativacao" ? "ativada" : "desativada"}.`,
      },
      ...auditoria,
    ];
    return delay(licencas.find((l) => l.licenca_id === input.licenca_id)!);
  },

  // -----------------------------------------------------------------------
  // Limites de setor (Admin)
  // -----------------------------------------------------------------------
  async atualizarLimiteSetor(input: {
    setor_id: number;
    tipo_id: number;
    limite_novo: number;
    alterado_por: number;
    justificativa: string;
  }): Promise<SetorLimite> {
    if (input.limite_novo < 0) throw new Error("Limite não pode ser negativo.");
    const setor = setores.find((s) => s.setor_id === input.setor_id);
    const tipo = tiposLicenca.find((t) => t.tipo_id === input.tipo_id);
    if (!setor || !tipo) throw new Error("Setor ou tipo não encontrado.");

    // Não pode reduzir abaixo do que já está em uso
    const emUso = licencas.filter(
      (l) => l.setor_id === input.setor_id && l.tipo_id === input.tipo_id && l.status === "EmUso"
    ).length;
    if (input.limite_novo < emUso) {
      throw new Error(`Limite não pode ser menor que ${emUso} (licenças atualmente em uso).`);
    }

    const existente = setorLimites.find(
      (l) => l.setor_id === input.setor_id && l.tipo_id === input.tipo_id
    );
    const anterior = existente?.limite_maximo ?? 0;

    if (existente) {
      setorLimites = setorLimites.map((l) =>
        l.setor_id === input.setor_id && l.tipo_id === input.tipo_id
          ? { ...l, limite_maximo: input.limite_novo }
          : l
      );
    } else {
      setorLimites = [...setorLimites, { setor_id: input.setor_id, tipo_id: input.tipo_id, limite_maximo: input.limite_novo }];
    }

    const agora = new Date().toISOString();
    auditoria = [
      {
        auditoria_id: proximoId(auditoria, "auditoria_id"),
        usuario_id: input.alterado_por,
        acao: "LimiteAlterado",
        entidade: "SetorLimite",
        entidade_id: input.setor_id,
        ip_origem: "127.0.0.1",
        executado_em: agora,
        detalhe: `Limite de ${tipo.nome} no setor ${setor.nome} alterado de ${anterior} para ${input.limite_novo}. Motivo: ${input.justificativa}`,
      },
      ...auditoria,
    ];
    return delay({ setor_id: input.setor_id, tipo_id: input.tipo_id, limite_maximo: input.limite_novo });
  },

  // -----------------------------------------------------------------------
  // Usuários (Admin)
  // -----------------------------------------------------------------------
  async criarUsuario(input: Omit<Usuario, "usuario_id"> & { criado_por: number }): Promise<Usuario> {
    if (usuarios.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
      throw new Error("Já existe um usuário com este e-mail.");
    }
    if (usuarios.some((u) => u.matricula === input.matricula)) {
      throw new Error("Já existe um usuário com esta matrícula.");
    }
    if (input.perfis.length === 0) throw new Error("Selecione ao menos um perfil.");

    const novo: Usuario = {
      usuario_id: proximoId(usuarios, "usuario_id"),
      nome: input.nome,
      email: input.email,
      matricula: input.matricula,
      cargo: input.cargo,
      setor_id: input.setor_id,
      perfis: input.perfis,
      ativo: input.ativo,
    };
    usuarios = [...usuarios, novo];
    auditoria = [
      {
        auditoria_id: proximoId(auditoria, "auditoria_id"),
        usuario_id: input.criado_por,
        acao: "UsuarioCriado",
        entidade: "Usuario",
        entidade_id: novo.usuario_id,
        ip_origem: "127.0.0.1",
        executado_em: new Date().toISOString(),
        detalhe: `Usuário criado: ${novo.nome} (${novo.email}) com perfis ${novo.perfis.join(", ")}.`,
      },
      ...auditoria,
    ];
    return delay(novo);
  },

  async atualizarUsuario(input: Partial<Usuario> & { usuario_id: number; alterado_por: number }): Promise<Usuario> {
    const idx = usuarios.findIndex((u) => u.usuario_id === input.usuario_id);
    if (idx < 0) throw new Error("Usuário não encontrado.");
    if (input.perfis !== undefined && input.perfis.length === 0) {
      throw new Error("Usuário precisa ter ao menos um perfil.");
    }
    const anterior = usuarios[idx];
    const atualizado: Usuario = {
      ...anterior,
      nome: input.nome ?? anterior.nome,
      email: input.email ?? anterior.email,
      matricula: input.matricula ?? anterior.matricula,
      cargo: input.cargo ?? anterior.cargo,
      setor_id: input.setor_id ?? anterior.setor_id,
      perfis: input.perfis ?? anterior.perfis,
      ativo: input.ativo ?? anterior.ativo,
    };
    usuarios = usuarios.map((u) => (u.usuario_id === input.usuario_id ? atualizado : u));
    auditoria = [
      {
        auditoria_id: proximoId(auditoria, "auditoria_id"),
        usuario_id: input.alterado_por,
        acao: "UsuarioAtualizado",
        entidade: "Usuario",
        entidade_id: input.usuario_id,
        ip_origem: "127.0.0.1",
        executado_em: new Date().toISOString(),
        detalhe: `Usuário atualizado: ${atualizado.nome}. Perfis: ${atualizado.perfis.join(", ")}. Status: ${atualizado.ativo ? "ativo" : "inativo"}.`,
      },
      ...auditoria,
    ];
    return delay(atualizado);
  },

  // -----------------------------------------------------------------------
  // Dashboard
  // -----------------------------------------------------------------------
  async dashboard(): Promise<DashboardResumo> {
    const total = licencas.length;
    const em_uso = licencas.filter((l) => l.status === "EmUso").length;
    const disponiveis = licencas.filter((l) => l.status === "Livre").length;
    const inativas = licencas.filter((l) => l.status === "Inativa").length;
    const pendentes = solicitacoes.filter((s) =>
      ["PendenteGestor", "PendenteDiretor", "PendenteTI"].includes(s.status)
    ).length;

    const por_setor = setores.map((s) => {
      const lic = licencas.filter((l) => l.setor_id === s.setor_id);
      const limite = setorLimites
        .filter((l) => l.setor_id === s.setor_id)
        .reduce((acc, l) => acc + l.limite_maximo, 0);
      return {
        setor_id: s.setor_id,
        setor_nome: s.nome,
        total: lic.length,
        em_uso: lic.filter((l) => l.status === "EmUso").length,
        disponiveis: lic.filter((l) => l.status === "Livre").length,
        limite_total: limite,
      };
    });

    const por_tipo = tiposLicenca.map((t) => {
      const lic = licencas.filter((l) => l.tipo_id === t.tipo_id);
      const em = lic.filter((l) => l.status === "EmUso").length;
      return {
        tipo_id: t.tipo_id,
        tipo_nome: t.nome,
        em_uso: em,
        disponiveis: lic.filter((l) => l.status === "Livre").length,
        custo_total_mensal: em * t.custo_mensal,
      };
    });

    return delay({
      total_licencas: total,
      em_uso,
      disponiveis,
      inativas,
      pendentes_aprovacao: pendentes,
      por_setor,
      por_tipo,
    });
  },
};
