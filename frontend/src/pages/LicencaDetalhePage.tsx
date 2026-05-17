import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronLeft, ExternalLink } from "lucide-react";
import { fakeApi } from "@/mocks/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatarData, formatarDataHora, formatarMoeda } from "@/lib/utils";
import type { TipoEventoLicenca } from "@/types";

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

export function LicencaDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const licencaId = Number(id);

  const { data: licenca, isLoading } = useQuery({
    queryKey: ["licenca", licencaId],
    queryFn: () => fakeApi.obterLicenca(licencaId),
  });
  const { data: historico = [] } = useQuery({
    queryKey: ["historico-licenca", licencaId],
    queryFn: () => fakeApi.historicoDaLicenca(licencaId),
  });
  const { data: solicitacoesRelacionadas = [] } = useQuery({
    queryKey: ["solicitacoes-licenca", licencaId],
    queryFn: () => fakeApi.solicitacoesDaLicenca(licencaId),
  });
  const { data: usuarios = [] } = useQuery({ queryKey: ["usuarios"], queryFn: () => fakeApi.listarUsuarios() });
  const { data: tipos = [] } = useQuery({ queryKey: ["tipos"], queryFn: () => fakeApi.listarTipos() });
  const { data: setores = [] } = useQuery({ queryKey: ["setores"], queryFn: () => fakeApi.listarSetores() });

  if (isLoading) return <div className="text-slate-500">Carregando…</div>;
  if (!licenca) {
    return (
      <div className="card p-6 max-w-md">
        <h2 className="text-lg font-semibold">Licença não encontrada</h2>
        <p className="text-sm text-slate-500 mt-2">Verifique se o ID está correto.</p>
        <button className="btn-secondary mt-4" onClick={() => navigate(-1)}>Voltar</button>
      </div>
    );
  }

  const tipo = tipos.find((t) => t.tipo_id === licenca.tipo_id);
  const setor = setores.find((s) => s.setor_id === licenca.setor_id);
  const usuarioAtual = usuarios.find((u) => u.usuario_id === licenca.usuario_atual_id);

  // Lista única de usuários que já passaram pela licença
  const usuariosQuePossuiram = Array.from(
    new Set(
      historico
        .flatMap((h) => [h.usuario_anterior_id, h.usuario_novo_id])
        .filter((id): id is number => id !== null)
    )
  );

  return (
    <div>
      <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-2">
        <ChevronLeft size={16} /> Voltar
      </button>
      <PageHeader
        titulo={`Licença ${licenca.codigo_sap}`}
        descricao={`#${licenca.licenca_id} · ${tipo?.nome ?? "—"} · ${setor?.nome ?? "—"}`}
        acoes={<StatusBadge status={licenca.status} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA ESQUERDA — Detalhes + Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card "Dados da licença" */}
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Dados da licença</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-slate-500 text-xs">ID interno</dt>
                <dd className="font-mono text-slate-900">#{licenca.licenca_id}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Código SAP</dt>
                <dd className="font-mono font-medium text-slate-900">{licenca.codigo_sap}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Tipo</dt>
                <dd className="text-slate-900">{tipo?.nome ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Custo mensal</dt>
                <dd className="text-slate-900">{tipo ? formatarMoeda(tipo.custo_mensal) : "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Setor atual</dt>
                <dd className="text-slate-900">{setor?.nome ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Status</dt>
                <dd><StatusBadge status={licenca.status} /></dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Usuário atual</dt>
                <dd>
                  {usuarioAtual ? (
                    <div>
                      <div className="font-medium">{usuarioAtual.nome}</div>
                      <div className="text-xs text-slate-500">{usuarioAtual.cargo} · {usuarioAtual.matricula}</div>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">— sem usuário —</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Data de criação</dt>
                <dd className="text-slate-900">{formatarData(licenca.criado_em)}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Expira em</dt>
                <dd className="text-slate-900">{formatarData(licenca.data_expiracao)}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Usuários que já possuíram</dt>
                <dd className="text-slate-900">{usuariosQuePossuiram.length}</dd>
              </div>
            </dl>
          </div>

          {/* Linha do tempo */}
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 mb-1">Trajetória da licença</h2>
            <p className="text-xs text-slate-500 mb-4">
              {historico.length} movimentação{historico.length === 1 ? "" : "ões"} registrada{historico.length === 1 ? "" : "s"} · ordem cronológica
            </p>

            {historico.length === 0 ? (
              <div className="text-center text-slate-500 py-6 text-sm">Nenhuma movimentação registrada.</div>
            ) : (
              <ol className="relative space-y-4 pl-6 border-l-2 border-slate-100">
                {historico.map((h, idx) => {
                  const de = usuarios.find((u) => u.usuario_id === h.usuario_anterior_id);
                  const para = usuarios.find((u) => u.usuario_id === h.usuario_novo_id);
                  const executor = usuarios.find((u) => u.usuario_id === h.executado_por);
                  return (
                    <li key={h.historico_id} className="relative">
                      <div className={`absolute -left-[1.85rem] top-2 w-3 h-3 rounded-full border-2 ${corEvento[h.tipo_evento]}`}></div>
                      <div className="bg-slate-50 rounded-md p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-slate-400 font-mono">#{idx + 1}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${corEvento[h.tipo_evento]}`}>
                              {rotuloEvento[h.tipo_evento]}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 whitespace-nowrap">{formatarDataHora(h.executado_em)}</div>
                        </div>

                        {(de || para) && (
                          <div className="flex items-center gap-2 text-sm py-1">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-slate-500">De</div>
                              <div className={de ? "font-medium text-slate-900 truncate" : "text-slate-400 italic"}>
                                {de?.nome ?? "(pool livre)"}
                                {de && <span className="block text-xs text-slate-500 font-normal">{de.cargo} · {de.matricula}</span>}
                              </div>
                            </div>
                            <ArrowRight size={16} className="text-slate-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-slate-500">Para</div>
                              <div className={para ? "font-medium text-slate-900 truncate" : "text-slate-400 italic"}>
                                {para?.nome ?? "(pool livre)"}
                                {para && <span className="block text-xs text-slate-500 font-normal">{para.cargo} · {para.matricula}</span>}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mt-2 pt-2 border-t border-slate-200/60 text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                          <div>
                            <span className="text-slate-400">Executado por:</span>{" "}
                            <strong>{executor?.nome ?? "—"}</strong>
                          </div>
                          {h.solicitacao_id && (
                            <div>
                              <span className="text-slate-400">Solicitação:</span>{" "}
                              <Link to={`/solicitacoes/${h.solicitacao_id}`} className="text-brand-600 hover:underline">
                                #{h.solicitacao_id}
                              </Link>
                            </div>
                          )}
                        </div>

                        {h.observacao && (
                          <p className="mt-2 text-sm text-slate-700 italic bg-white p-2 rounded border border-slate-200">
                            "{h.observacao}"
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA — Solicitações relacionadas */}
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 mb-1">Solicitações relacionadas</h2>
            <p className="text-xs text-slate-500 mb-4">
              Solicitações que originaram (origem) ou foram concedidas (destino) usando esta licença.
            </p>

            {solicitacoesRelacionadas.length === 0 ? (
              <div className="text-center text-slate-500 py-4 text-sm">Nenhuma solicitação vinculada.</div>
            ) : (
              <ul className="space-y-3">
                {solicitacoesRelacionadas.map((s) => {
                  const benef = usuarios.find((u) => u.usuario_id === s.beneficiario_id);
                  const ehOrigem = s.licenca_origem_id === licenca.licenca_id;
                  return (
                    <li key={s.solicitacao_id}>
                      <Link
                        to={`/solicitacoes/${s.solicitacao_id}`}
                        className="block border border-slate-200 rounded-md p-3 hover:border-brand-300 hover:bg-brand-50/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-xs font-mono text-slate-500">#{s.solicitacao_id}</span>
                          <StatusBadge status={s.status} />
                        </div>
                        <div className="text-sm font-medium text-slate-900">
                          {ehOrigem ? "Origem: licença saiu" : "Destino: licença recebida"}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {benef?.nome ?? "—"} · {formatarData(s.criado_em)}
                        </div>
                        <div className="text-xs text-brand-600 mt-1 inline-flex items-center gap-1">
                          Abrir detalhe <ExternalLink size={11} />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Resumo rápido</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Status atual</dt>
                <dd><StatusBadge status={licenca.status} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Total de movimentações</dt>
                <dd className="font-semibold">{historico.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Solicitações vinculadas</dt>
                <dd className="font-semibold">{solicitacoesRelacionadas.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Usuários distintos</dt>
                <dd className="font-semibold">{usuariosQuePossuiram.length}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
