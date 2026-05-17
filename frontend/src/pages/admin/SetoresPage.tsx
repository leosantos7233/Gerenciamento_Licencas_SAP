import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fakeApi } from "@/mocks/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Modal } from "@/components/shared/Modal";

interface AlvoLimite {
  setor_id: number;
  tipo_id: number;
  limite_atual: number;
  setor_nome: string;
  tipo_nome: string;
  em_uso: number;
}

export function SetoresAdminPage() {
  const { usuario, temPermissao } = useAuth();
  const qc = useQueryClient();
  const podeEditar = temPermissao("setor:editar_limite");

  const { data: setores = [] } = useQuery({ queryKey: ["setores"], queryFn: () => fakeApi.listarSetores() });
  const { data: usuarios = [] } = useQuery({ queryKey: ["usuarios"], queryFn: () => fakeApi.listarUsuarios() });
  const { data: tipos = [] } = useQuery({ queryKey: ["tipos"], queryFn: () => fakeApi.listarTipos() });
  const { data: limites = [] } = useQuery({ queryKey: ["limites"], queryFn: () => fakeApi.listarLimites() });
  const { data: licencas = [] } = useQuery({ queryKey: ["licencas"], queryFn: () => fakeApi.listarLicencas() });

  const [alvo, setAlvo] = useState<AlvoLimite | null>(null);
  const [novoLimite, setNovoLimite] = useState<number>(0);
  const [justificativa, setJustificativa] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const tiposNaoCadastrados = (setorId: number) =>
    tipos.filter((t) => !limites.some((l) => l.setor_id === setorId && l.tipo_id === t.tipo_id));

  function abrir(setor_id: number, tipo_id: number, limite_atual: number) {
    const s = setores.find((x) => x.setor_id === setor_id)!;
    const t = tipos.find((x) => x.tipo_id === tipo_id)!;
    const em_uso = licencas.filter(
      (l) => l.setor_id === setor_id && l.tipo_id === tipo_id && l.status === "EmUso"
    ).length;
    setAlvo({ setor_id, tipo_id, limite_atual, setor_nome: s.nome, tipo_nome: t.nome, em_uso });
    setNovoLimite(limite_atual);
    setJustificativa("");
    setErro(null);
  }

  async function salvar() {
    if (!alvo) return;
    setErro(null);
    if (!justificativa.trim() || justificativa.trim().length < 10) {
      setErro("Justificativa obrigatória (mínimo 10 caracteres).");
      return;
    }
    setSalvando(true);
    try {
      await fakeApi.atualizarLimiteSetor({
        setor_id: alvo.setor_id,
        tipo_id: alvo.tipo_id,
        limite_novo: novoLimite,
        alterado_por: usuario!.usuario_id,
        justificativa: justificativa.trim(),
      });
      qc.invalidateQueries({ queryKey: ["limites"] });
      qc.invalidateQueries({ queryKey: ["auditoria"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setAlvo(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <PageHeader
        titulo="Gestão de setores"
        descricao={
          podeEditar
            ? "Configure limites de licenças por tipo. Alterações são auditadas."
            : "Visualização. Apenas administradores podem editar limites."
        }
      />
      <div className="space-y-4">
        {setores.map((s) => {
          const gestor = usuarios.find((u) => u.usuario_id === s.gestor_id);
          const diretor = usuarios.find((u) => u.usuario_id === s.diretor_id);
          const limitesDoSetor = limites.filter((l) => l.setor_id === s.setor_id);
          const tiposDisponiveis = tiposNaoCadastrados(s.setor_id);

          return (
            <div key={s.setor_id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {s.nome} <span className="text-slate-400 font-normal text-sm">· {s.sigla}</span>
                  </h3>
                  <div className="text-xs text-slate-500 mt-1">
                    Gestor: <strong>{gestor?.nome ?? "—"}</strong> · Diretor:{" "}
                    <strong>{diretor?.nome ?? "—"}</strong>
                  </div>
                </div>
                {s.exige_aprovacao_diretor && (
                  <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800">
                    Exige aprovação diretor
                  </span>
                )}
              </div>

              <table className="table-base">
                <thead>
                  <tr>
                    <th>Tipo de licença</th>
                    <th>Em uso</th>
                    <th>Limite máximo</th>
                    <th>Utilização</th>
                    {podeEditar && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {limitesDoSetor.map((l) => {
                    const tipo = tipos.find((t) => t.tipo_id === l.tipo_id);
                    const emUso = licencas.filter(
                      (lic) => lic.setor_id === s.setor_id && lic.tipo_id === l.tipo_id && lic.status === "EmUso"
                    ).length;
                    const pct = l.limite_maximo > 0 ? Math.round((emUso / l.limite_maximo) * 100) : 0;
                    return (
                      <tr key={`${l.setor_id}-${l.tipo_id}`}>
                        <td>{tipo?.nome ?? "—"}</td>
                        <td>{emUso}</td>
                        <td className="font-medium">{l.limite_maximo}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-slate-100 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-600">{pct}%</span>
                          </div>
                        </td>
                        {podeEditar && (
                          <td className="text-right">
                            <button
                              className="btn-ghost text-xs"
                              onClick={() => abrir(l.setor_id, l.tipo_id, l.limite_maximo)}
                            >
                              <Pencil size={14} /> Editar
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {limitesDoSetor.length === 0 && (
                    <tr>
                      <td colSpan={podeEditar ? 5 : 4} className="text-center text-slate-500 py-4">
                        Nenhum tipo de licença configurado para este setor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {podeEditar && tiposDisponiveis.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                  <span className="text-xs text-slate-500 self-center">Adicionar tipo:</span>
                  {tiposDisponiveis.map((t) => (
                    <button
                      key={t.tipo_id}
                      className="btn-secondary text-xs"
                      onClick={() => abrir(s.setor_id, t.tipo_id, 0)}
                    >
                      <Plus size={12} /> {t.nome}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal
        aberto={!!alvo}
        onFechar={() => setAlvo(null)}
        titulo="Alterar limite de licenças"
        descricao={alvo ? `${alvo.setor_nome} · ${alvo.tipo_nome}` : ""}
      >
        {alvo && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded">
                <div className="text-xs text-slate-500">Em uso atualmente</div>
                <div className="font-semibold text-lg text-slate-900">{alvo.em_uso}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded">
                <div className="text-xs text-slate-500">Limite atual</div>
                <div className="font-semibold text-lg text-slate-900">{alvo.limite_atual}</div>
              </div>
              <div className="p-3 bg-brand-50 rounded">
                <div className="text-xs text-brand-700">Novo limite</div>
                <div className="font-semibold text-lg text-brand-900">{novoLimite}</div>
              </div>
            </div>

            <div>
              <label className="label">Novo limite máximo</label>
              <input
                type="number"
                min={0}
                className="input"
                value={novoLimite}
                onChange={(e) => setNovoLimite(Math.max(0, Number(e.target.value)))}
              />
              <p className="text-xs text-slate-500 mt-1">
                O novo limite não pode ser menor que {alvo.em_uso} (licenças em uso).
              </p>
            </div>

            <div>
              <label className="label">Justificativa (obrigatória)</label>
              <textarea
                rows={3}
                className="input"
                placeholder="Explique o motivo da alteração (será registrado na auditoria)…"
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
              />
            </div>

            {erro && (
              <div className="p-2 rounded bg-red-50 text-red-700 text-xs">{erro}</div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button className="btn-secondary" onClick={() => setAlvo(null)}>Cancelar</button>
              <button className="btn-primary" disabled={salvando} onClick={salvar}>
                {salvando ? "Salvando…" : "Salvar alteração"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
