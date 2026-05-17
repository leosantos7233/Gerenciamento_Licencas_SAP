import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ChevronLeft, AlertCircle, Ban, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fakeApi } from "@/mocks/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Modal } from "@/components/shared/Modal";
import { formatarDataHora } from "@/lib/utils";
import type { EtapaAprovacao, SolicitacaoLicenca, TipoEventoLicenca } from "@/types";

const rotuloEvento: Record<TipoEventoLicenca, string> = {
  Atribuicao: "Atribuição",
  Transferencia: "Transferência",
  Ativacao: "Ativação",
  Desativacao: "Desativação",
  Revogacao: "Revogação",
};

const corEvento: Record<TipoEventoLicenca, string> = {
  Atribuicao: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Transferencia: "bg-blue-100 text-blue-800 border-blue-200",
  Ativacao: "bg-teal-100 text-teal-800 border-teal-200",
  Desativacao: "bg-slate-100 text-slate-700 border-slate-200",
  Revogacao: "bg-red-100 text-red-800 border-red-200",
};

function etapaAtual(status: SolicitacaoLicenca["status"]): EtapaAprovacao | null {
  if (status === "PendenteGestor") return "Gestor";
  if (status === "PendenteDiretor") return "Diretor";
  if (status === "PendenteTI") return "TI";
  return null;
}

export function SolicitacaoDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { usuario, temPermissao } = useAuth();
  const solicitacaoId = Number(id);

  const [comentario, setComentario] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [modalCancelar, setModalCancelar] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [erroCancelamento, setErroCancelamento] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState(false);

  const { data: solicitacao } = useQuery({
    queryKey: ["solicitacao", solicitacaoId],
    queryFn: () => fakeApi.obterSolicitacao(solicitacaoId),
  });
  const { data: aprovacoes = [] } = useQuery({
    queryKey: ["aprovacoes", solicitacaoId],
    queryFn: () => fakeApi.listarAprovacoesDa(solicitacaoId),
  });
  const { data: usuarios = [] } = useQuery({ queryKey: ["usuarios"], queryFn: () => fakeApi.listarUsuarios() });
  const { data: tipos = [] } = useQuery({ queryKey: ["tipos"], queryFn: () => fakeApi.listarTipos() });
  const { data: setores = [] } = useQuery({ queryKey: ["setores"], queryFn: () => fakeApi.listarSetores() });
  const { data: licencas = [] } = useQuery({ queryKey: ["licencas"], queryFn: () => fakeApi.listarLicencas() });

  const { data: historicoLicenca = [] } = useQuery({
    queryKey: ["historico-licenca-solicitacao", solicitacaoId],
    queryFn: async () => {
      const sol = await fakeApi.obterSolicitacao(solicitacaoId);
      const id = sol?.licenca_concedida_id ?? sol?.licenca_origem_id;
      if (!id) return [];
      return fakeApi.historicoDaLicenca(id);
    },
  });

  if (!solicitacao) {
    return <div className="text-slate-500">Carregando…</div>;
  }

  const etapa = etapaAtual(solicitacao.status);
  const solicitante = usuarios.find((u) => u.usuario_id === solicitacao.solicitante_id);
  const tipo = tipos.find((t) => t.tipo_id === solicitacao.tipo_id);
  const setor = setores.find((s) => s.setor_id === solicitacao.setor_id);

  const podeDecidir =
    !!etapa &&
    ((etapa === "Gestor" && (temPermissao("licencas:aprovar_gestor") &&
        (usuario?.perfis.includes("Administrador") || setor?.gestor_id === usuario?.usuario_id))) ||
      (etapa === "Diretor" && (temPermissao("licencas:aprovar_diretor") &&
        (usuario?.perfis.includes("Administrador") || setor?.diretor_id === usuario?.usuario_id))) ||
      (etapa === "TI" && temPermissao("licencas:aprovar_ti")));

  const podeCancelar =
    solicitacao.solicitante_id === usuario?.usuario_id &&
    ["Rascunho", "PendenteGestor", "PendenteDiretor", "PendenteTI"].includes(solicitacao.status);

  async function decidir(decisao: "Aprovado" | "Rejeitado") {
    if (!etapa) return;
    setErro(null);
    setEnviando(true);
    try {
      await fakeApi.decidirAprovacao({
        solicitacao_id: solicitacaoId,
        etapa,
        aprovador_id: usuario!.usuario_id,
        decisao,
        comentario: comentario.trim(),
      });
      qc.invalidateQueries();
      navigate("/aprovacoes");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao processar.");
    } finally {
      setEnviando(false);
    }
  }

  async function cancelar() {
    setErroCancelamento(null);
    if (!motivoCancelamento.trim() || motivoCancelamento.trim().length < 5) {
      setErroCancelamento("Informe um motivo (mínimo 5 caracteres).");
      return;
    }
    setCancelando(true);
    try {
      await fakeApi.cancelarSolicitacao({
        solicitacao_id: solicitacaoId,
        cancelado_por: usuario!.usuario_id,
        motivo: motivoCancelamento.trim(),
      });
      qc.invalidateQueries();
      setModalCancelar(false);
      navigate("/minhas-solicitacoes");
    } catch (e) {
      setErroCancelamento(e instanceof Error ? e.message : "Erro ao cancelar.");
    } finally {
      setCancelando(false);
    }
  }

  return (
    <div>
      <Link to="/minhas-solicitacoes" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-2">
        <ChevronLeft size={16} /> Voltar
      </Link>
      <PageHeader
        titulo={`Solicitação #${solicitacao.solicitacao_id}`}
        descricao={`Criada em ${formatarDataHora(solicitacao.criado_em)}`}
        acoes={
          <div className="flex items-center gap-2">
            <StatusBadge status={solicitacao.status} />
            {podeCancelar && (
              <button className="btn-danger text-xs" onClick={() => setModalCancelar(true)}>
                <Ban size={14} /> Cancelar solicitação
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Detalhes</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-slate-500 text-xs">Solicitante</dt>
                <dd className="font-medium text-slate-900">{solicitante?.nome ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Setor</dt>
                <dd className="font-medium text-slate-900">{setor?.nome ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Tipo de licença</dt>
                <dd className="font-medium text-slate-900">{tipo?.nome ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Modalidade</dt>
                <dd className="font-medium text-slate-900">{solicitacao.modalidade === "Nova" ? "Nova licença" : "Transferência"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500 text-xs">Justificativa</dt>
                <dd className="text-slate-700 mt-1 whitespace-pre-wrap">{solicitacao.justificativa || <em className="text-slate-400">(em branco)</em>}</dd>
              </div>
            </dl>
          </div>

          {(solicitacao.licenca_concedida_id || solicitacao.licenca_origem_id) && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold text-slate-900">Histórico da licença relacionada</h2>
                {(() => {
                  const idLic = solicitacao.licenca_concedida_id ?? solicitacao.licenca_origem_id;
                  const lic = licencas.find((l) => l.licenca_id === idLic);
                  return lic ? (
                    <Link to={`/licencas/${lic.licenca_id}`} className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1">
                      Página completa da licença <ExternalLink size={11} />
                    </Link>
                  ) : null;
                })()}
              </div>
              {(() => {
                const idLic = solicitacao.licenca_concedida_id ?? solicitacao.licenca_origem_id;
                const lic = licencas.find((l) => l.licenca_id === idLic);
                if (!lic) return null;
                return (
                  <p className="text-xs text-slate-500 mb-3">
                    <Link to={`/licencas/${lic.licenca_id}`} className="font-mono text-brand-700 hover:underline">{lic.codigo_sap}</Link>
                    {" · "}{historicoLicenca.length} movimentação{historicoLicenca.length === 1 ? "" : "ões"}
                  </p>
                );
              })()}

              {historicoLicenca.length === 0 ? (
                <div className="text-sm text-slate-500 italic py-3">Nenhuma movimentação ainda — a licença foi recém-vinculada.</div>
              ) : (
                <ol className="relative space-y-3 pl-5 border-l-2 border-slate-100">
                  {historicoLicenca.map((h) => {
                    const de = usuarios.find((u) => u.usuario_id === h.usuario_anterior_id);
                    const para = usuarios.find((u) => u.usuario_id === h.usuario_novo_id);
                    return (
                      <li key={h.historico_id} className="relative">
                        <div className={`absolute -left-[1.55rem] top-1.5 w-2.5 h-2.5 rounded-full border-2 ${corEvento[h.tipo_evento]}`}></div>
                        <div className="text-xs text-slate-500">{formatarDataHora(h.executado_em)}</div>
                        <div className="flex items-center gap-2 text-sm flex-wrap">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${corEvento[h.tipo_evento]}`}>
                            {rotuloEvento[h.tipo_evento]}
                          </span>
                          {(de || para) && (
                            <span className="flex items-center gap-1">
                              <strong>{de?.nome ?? "(livre)"}</strong>
                              <ArrowRight size={12} className="text-slate-400" />
                              <strong>{para?.nome ?? "(livre)"}</strong>
                            </span>
                          )}
                        </div>
                        {h.observacao && (
                          <p className="text-xs text-slate-600 italic mt-1">"{h.observacao}"</p>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          )}

          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Histórico de aprovações</h2>
            <ol className="space-y-3">
              {aprovacoes.map((a) => {
                const aprovador = usuarios.find((u) => u.usuario_id === a.aprovador_id);
                const cor =
                  a.decisao === "Aprovado" ? "border-emerald-500 bg-emerald-50" :
                  a.decisao === "Rejeitado" ? "border-red-500 bg-red-50" :
                  "border-slate-300 bg-slate-50";
                return (
                  <li key={a.aprovacao_id} className={`border-l-4 ${cor} p-3 rounded-r-md`}>
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-slate-900">Etapa: {a.etapa}</div>
                      <span className="text-xs text-slate-500">{a.decidido_em ? formatarDataHora(a.decidido_em) : "—"}</span>
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      Decisão: <strong>{a.decisao}</strong>
                      {aprovador && <> · por {aprovador.nome}</>}
                    </div>
                    {a.comentario && <p className="text-sm text-slate-700 mt-1 italic">"{a.comentario}"</p>}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        <div className="space-y-6">
          {podeDecidir && (
            <div className="card p-5">
              <h2 className="font-semibold text-slate-900 mb-3">Sua decisão · etapa {etapa}</h2>
              <label className="label">Comentário (obrigatório em rejeição)</label>
              <textarea
                rows={4}
                className="input"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Justifique sua decisão…"
              />
              {erro && (
                <div className="mt-3 flex items-start gap-2 p-2 rounded-md bg-red-50 text-red-700 text-xs">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" /> <span>{erro}</span>
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <button disabled={enviando} className="btn-primary flex-1" onClick={() => decidir("Aprovado")}>
                  Aprovar
                </button>
                <button disabled={enviando} className="btn-danger flex-1" onClick={() => decidir("Rejeitado")}>
                  Rejeitar
                </button>
              </div>
            </div>
          )}

          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Resumo</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd><StatusBadge status={solicitacao.status} /></dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Criado em</dt><dd>{formatarDataHora(solicitacao.criado_em)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Última atualização</dt><dd>{formatarDataHora(solicitacao.atualizado_em)}</dd></div>
              {solicitacao.licenca_concedida_id && (
                <div className="flex justify-between"><dt className="text-slate-500">Licença concedida</dt><dd className="font-mono">#{solicitacao.licenca_concedida_id}</dd></div>
              )}
            </dl>
          </div>
        </div>
      </div>

      <Modal
        aberto={modalCancelar}
        onFechar={() => setModalCancelar(false)}
        titulo="Cancelar solicitação"
        descricao={`Solicitação #${solicitacao.solicitacao_id} · ${tipo?.nome ?? ""}`}
      >
        <div className="space-y-4">
          <div className="p-3 rounded bg-amber-50 border border-amber-200 text-sm text-amber-800">
            <strong>Atenção:</strong> o cancelamento é definitivo. Você pode criar uma nova solicitação depois,
            mas o histórico desta permanecerá registrado.
          </div>
          <div>
            <label className="label">Motivo do cancelamento</label>
            <textarea
              rows={3}
              className="input"
              placeholder="Por que está cancelando? (será registrado na auditoria)"
              value={motivoCancelamento}
              onChange={(e) => setMotivoCancelamento(e.target.value)}
            />
          </div>
          {erroCancelamento && (
            <div className="p-2 rounded bg-red-50 text-red-700 text-xs">{erroCancelamento}</div>
          )}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button className="btn-secondary" onClick={() => setModalCancelar(false)}>Voltar</button>
            <button className="btn-danger" disabled={cancelando} onClick={cancelar}>
              {cancelando ? "Cancelando…" : "Confirmar cancelamento"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
