import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, MoreVertical, Search } from "lucide-react";
import { fakeApi } from "@/mocks/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Modal } from "@/components/shared/Modal";
import { formatarData, formatarMoeda } from "@/lib/utils";
import { exportarCsv } from "@/lib/exportar";
import type { Licenca } from "@/types";

type Acao = "transferir" | "revogar" | "ativar" | "desativar";

interface Modal {
  acao: Acao;
  licenca: Licenca;
}

export function LicencasPage() {
  const { usuario, temPermissao } = useAuth();
  const qc = useQueryClient();
  const podeTransferir = temPermissao("licencas:transferir");
  const podeAtivarDesativar = temPermissao("licencas:ativar_desativar");

  const [filtro, setFiltro] = useState("");
  const [setorFiltro, setSetorFiltro] = useState<number | "">("");
  const [statusFiltro, setStatusFiltro] = useState<string>("");
  const [tipoFiltro, setTipoFiltro] = useState<number | "">("");
  const [menuAberto, setMenuAberto] = useState<number | null>(null);
  const [modal, setModal] = useState<Modal | null>(null);
  const [destinoId, setDestinoId] = useState<number | "">("");
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const { data: licencas = [] } = useQuery({ queryKey: ["licencas"], queryFn: () => fakeApi.listarLicencas() });
  const { data: usuarios = [] } = useQuery({ queryKey: ["usuarios"], queryFn: () => fakeApi.listarUsuarios() });
  const { data: tipos = [] } = useQuery({ queryKey: ["tipos"], queryFn: () => fakeApi.listarTipos() });
  const { data: setores = [] } = useQuery({ queryKey: ["setores"], queryFn: () => fakeApi.listarSetores() });

  const filtradas = useMemo(() => {
    return licencas.filter((l) => {
      if (setorFiltro !== "" && l.setor_id !== setorFiltro) return false;
      if (tipoFiltro !== "" && l.tipo_id !== tipoFiltro) return false;
      if (statusFiltro && l.status !== statusFiltro) return false;
      if (filtro) {
        const t = filtro.toLowerCase();
        const usuario = usuarios.find((u) => u.usuario_id === l.usuario_atual_id);
        if (
          !l.codigo_sap.toLowerCase().includes(t) &&
          !usuario?.nome.toLowerCase().includes(t)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [licencas, usuarios, filtro, setorFiltro, statusFiltro, tipoFiltro]);

  function abrirAcao(acao: Acao, licenca: Licenca) {
    setModal({ acao, licenca });
    setDestinoId("");
    setObservacao("");
    setErro(null);
    setMenuAberto(null);
  }

  async function executar() {
    if (!modal) return;
    setErro(null);
    setSalvando(true);
    try {
      const { acao, licenca } = modal;
      if (acao === "transferir") {
        if (destinoId === "") throw new Error("Selecione o usuário destino.");
        await fakeApi.transferirLicenca({
          licenca_id: licenca.licenca_id,
          novo_usuario_id: destinoId as number,
          executado_por: usuario!.usuario_id,
          observacao: observacao.trim(),
        });
      } else if (acao === "revogar") {
        if (!observacao.trim()) throw new Error("Informe um motivo para a revogação.");
        await fakeApi.revogarLicenca({
          licenca_id: licenca.licenca_id,
          executado_por: usuario!.usuario_id,
          observacao: observacao.trim(),
        });
      } else if (acao === "ativar") {
        await fakeApi.alterarStatusLicenca({
          licenca_id: licenca.licenca_id,
          novo_status: "Ativacao",
          executado_por: usuario!.usuario_id,
          observacao: observacao.trim(),
        });
      } else if (acao === "desativar") {
        if (!observacao.trim()) throw new Error("Informe um motivo para a desativação.");
        await fakeApi.alterarStatusLicenca({
          licenca_id: licenca.licenca_id,
          novo_status: "Desativacao",
          executado_por: usuario!.usuario_id,
          observacao: observacao.trim(),
        });
      }
      qc.invalidateQueries();
      setModal(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao executar.");
    } finally {
      setSalvando(false);
    }
  }

  function exportar() {
    const linhas = filtradas.map((l) => {
      const usuarioAtual = usuarios.find((u) => u.usuario_id === l.usuario_atual_id);
      const tipo = tipos.find((t) => t.tipo_id === l.tipo_id);
      const setor = setores.find((s) => s.setor_id === l.setor_id);
      return { l, usuarioAtual, tipo, setor };
    });
    exportarCsv({
      nomeArquivo: `licencas-sap-${new Date().toISOString().slice(0, 10)}.csv`,
      colunas: [
        { cabecalho: "Código SAP", valor: (x) => x.l.codigo_sap },
        { cabecalho: "Tipo", valor: (x) => x.tipo?.nome ?? "" },
        { cabecalho: "Setor", valor: (x) => x.setor?.nome ?? "" },
        { cabecalho: "Status", valor: (x) => x.l.status },
        { cabecalho: "Usuário atual", valor: (x) => x.usuarioAtual?.nome ?? "" },
        { cabecalho: "E-mail usuário", valor: (x) => x.usuarioAtual?.email ?? "" },
        { cabecalho: "Matrícula", valor: (x) => x.usuarioAtual?.matricula ?? "" },
        { cabecalho: "Custo mensal", valor: (x) => x.tipo?.custo_mensal ?? 0 },
        { cabecalho: "Data expiração", valor: (x) => formatarData(x.l.data_expiracao) },
        { cabecalho: "Criado em", valor: (x) => formatarData(x.l.criado_em) },
      ],
      linhas,
    });
  }

  return (
    <div>
      <PageHeader
        titulo="Licenças"
        descricao={`${filtradas.length} de ${licencas.length} licenças exibidas.`}
        acoes={
          <button className="btn-secondary" onClick={exportar} disabled={filtradas.length === 0}>
            <Download size={16} /> Exportar Excel
          </button>
        }
      />

      <div className="card p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[220px]">
            <label className="label">Buscar</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9"
                placeholder="Código SAP ou nome do usuário…"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Setor</label>
            <select className="input" value={setorFiltro} onChange={(e) => setSetorFiltro(e.target.value === "" ? "" : Number(e.target.value))}>
              <option value="">Todos</option>
              {setores.map((s) => <option key={s.setor_id} value={s.setor_id}>{s.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tipo</label>
            <select className="input" value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value === "" ? "" : Number(e.target.value))}>
              <option value="">Todos</option>
              {tipos.map((t) => <option key={t.tipo_id} value={t.tipo_id}>{t.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
              <option value="">Todos</option>
              <option value="EmUso">Em uso</option>
              <option value="Livre">Livre</option>
              <option value="Inativa">Inativa</option>
              <option value="Reservada">Reservada</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Código SAP</th>
              <th>Tipo</th>
              <th>Setor</th>
              <th>Usuário atual</th>
              <th>Status</th>
              <th>Custo/mês</th>
              <th>Expira em</th>
              {(podeTransferir || podeAtivarDesativar) && <th></th>}
            </tr>
          </thead>
          <tbody>
            {filtradas.map((l) => {
              const usuarioAtual = usuarios.find((u) => u.usuario_id === l.usuario_atual_id);
              const tipo = tipos.find((t) => t.tipo_id === l.tipo_id);
              const setor = setores.find((s) => s.setor_id === l.setor_id);
              const acoesDisponiveis = (podeTransferir || podeAtivarDesativar);

              return (
                <tr key={l.licenca_id}>
                  <td>
                    <Link
                      to={`/licencas/${l.licenca_id}`}
                      className="font-mono text-xs text-brand-600 hover:underline"
                    >
                      {l.codigo_sap}
                    </Link>
                  </td>
                  <td>{tipo?.nome ?? "—"}</td>
                  <td>{setor?.nome ?? "—"}</td>
                  <td>
                    {usuarioAtual ? (
                      <div>
                        <div>{usuarioAtual.nome}</div>
                        <div className="text-xs text-slate-500">{usuarioAtual.matricula}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td><StatusBadge status={l.status} /></td>
                  <td className="text-xs">{tipo ? formatarMoeda(tipo.custo_mensal) : "—"}</td>
                  <td className="text-xs text-slate-500">{formatarData(l.data_expiracao)}</td>
                  {acoesDisponiveis && (
                    <td className="text-right relative">
                      <button
                        className="btn-ghost p-1"
                        onClick={() => setMenuAberto(menuAberto === l.licenca_id ? null : l.licenca_id)}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {menuAberto === l.licenca_id && (
                        <div className="absolute right-2 mt-1 w-52 card p-1 z-10 text-left">
                          {podeTransferir && l.status !== "Inativa" && (
                            <button className="w-full px-3 py-2 text-sm rounded hover:bg-slate-100 text-left" onClick={() => abrirAcao("transferir", l)}>
                              Transferir / atribuir
                            </button>
                          )}
                          {podeTransferir && l.status === "EmUso" && (
                            <button className="w-full px-3 py-2 text-sm rounded hover:bg-slate-100 text-left text-amber-700" onClick={() => abrirAcao("revogar", l)}>
                              Revogar do usuário
                            </button>
                          )}
                          {podeAtivarDesativar && l.status === "Inativa" && (
                            <button className="w-full px-3 py-2 text-sm rounded hover:bg-slate-100 text-left text-emerald-700" onClick={() => abrirAcao("ativar", l)}>
                              Ativar licença
                            </button>
                          )}
                          {podeAtivarDesativar && l.status !== "Inativa" && (
                            <button className="w-full px-3 py-2 text-sm rounded hover:bg-slate-100 text-left text-red-700" onClick={() => abrirAcao("desativar", l)}>
                              Desativar licença
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            {filtradas.length === 0 && (
              <tr><td colSpan={8} className="text-center text-slate-500 py-8">Nenhuma licença encontrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        aberto={!!modal}
        onFechar={() => setModal(null)}
        titulo={
          modal?.acao === "transferir" ? "Transferir / atribuir licença" :
          modal?.acao === "revogar" ? "Revogar licença do usuário" :
          modal?.acao === "ativar" ? "Ativar licença" :
          modal?.acao === "desativar" ? "Desativar licença" : ""
        }
        descricao={modal ? `Licença ${modal.licenca.codigo_sap}` : ""}
      >
        {modal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 p-3 rounded">
              <div><span className="text-slate-500">Tipo:</span> <strong>{tipos.find((t) => t.tipo_id === modal.licenca.tipo_id)?.nome}</strong></div>
              <div><span className="text-slate-500">Setor:</span> <strong>{setores.find((s) => s.setor_id === modal.licenca.setor_id)?.nome}</strong></div>
              <div><span className="text-slate-500">Status atual:</span> <StatusBadge status={modal.licenca.status} /></div>
              <div><span className="text-slate-500">Usuário atual:</span> <strong>{usuarios.find((u) => u.usuario_id === modal.licenca.usuario_atual_id)?.nome ?? "—"}</strong></div>
            </div>

            {modal.acao === "transferir" && (
              <div>
                <label className="label">Novo usuário (mesmo setor)</label>
                <select
                  className="input"
                  value={destinoId}
                  onChange={(e) => setDestinoId(e.target.value === "" ? "" : Number(e.target.value))}
                >
                  <option value="">Selecione…</option>
                  {usuarios
                    .filter((u) => u.setor_id === modal.licenca.setor_id && u.ativo && u.usuario_id !== modal.licenca.usuario_atual_id)
                    .map((u) => (
                      <option key={u.usuario_id} value={u.usuario_id}>{u.nome} · {u.matricula}</option>
                    ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Apenas usuários ativos do mesmo setor são exibidos.
                </p>
              </div>
            )}

            <div>
              <label className="label">
                Observação {modal.acao === "ativar" ? "(opcional)" : "(obrigatória)"}
              </label>
              <textarea
                rows={3}
                className="input"
                placeholder="Registre o motivo da ação…"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </div>

            {erro && <div className="p-2 rounded bg-red-50 text-red-700 text-xs">{erro}</div>}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button className="btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button
                className={modal.acao === "desativar" || modal.acao === "revogar" ? "btn-danger" : "btn-primary"}
                disabled={salvando}
                onClick={executar}
              >
                {salvando ? "Processando…" : "Confirmar"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
