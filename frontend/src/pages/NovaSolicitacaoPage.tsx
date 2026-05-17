import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fakeApi } from "@/mocks/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { UserPicker } from "@/components/shared/UserPicker";

type Modalidade = "Nova" | "Transferencia";

export function NovaSolicitacaoPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isAdmin = !!usuario?.perfis.includes("Administrador");

  const { data: tipos = [] } = useQuery({ queryKey: ["tipos"], queryFn: () => fakeApi.listarTipos() });
  const { data: licencas = [] } = useQuery({ queryKey: ["licencas"], queryFn: () => fakeApi.listarLicencas() });
  const { data: setores = [] } = useQuery({ queryKey: ["setores"], queryFn: () => fakeApi.listarSetores() });
  const { data: usuarios = [] } = useQuery({ queryKey: ["usuarios"], queryFn: () => fakeApi.listarUsuarios() });

  const [modalidade, setModalidade] = useState<Modalidade>("Nova");
  const [tipoId, setTipoId] = useState<number | null>(null);
  const [licencaOrigemId, setLicencaOrigemId] = useState<number | null>(null);
  const [beneficiarioId, setBeneficiarioId] = useState<number | null>(null);
  const [origemUsuarioId, setOrigemUsuarioId] = useState<number | null>(null);
  const [justificativa, setJustificativa] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroSubmit, setErroSubmit] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // ---------- DERIVADOS ----------

  // Beneficiário efetivo: no fluxo padrão = solicitante; admin escolhe
  const beneficiario = useMemo(() => {
    const id = isAdmin ? beneficiarioId : usuario?.usuario_id ?? null;
    return id !== null ? usuarios.find((u) => u.usuario_id === id) : null;
  }, [isAdmin, beneficiarioId, usuario, usuarios]);

  const origem = useMemo(
    () => (origemUsuarioId !== null ? usuarios.find((u) => u.usuario_id === origemUsuarioId) : null),
    [origemUsuarioId, usuarios]
  );

  // Lista de licenças do origem (admin) ou do mesmo setor do solicitante (não-admin)
  const licencasDisponiveisParaTransferencia = useMemo(() => {
    if (modalidade !== "Transferencia") return [];
    if (isAdmin) {
      if (!origemUsuarioId) return [];
      return licencas.filter((l) => l.usuario_atual_id === origemUsuarioId && l.status === "EmUso");
    }
    // Não-admin: licenças do próprio setor, mesmo tipo selecionado
    if (!usuario || !tipoId) return [];
    return licencas.filter(
      (l) => l.setor_id === usuario.setor_id && l.status === "EmUso" && l.tipo_id === tipoId
    );
  }, [modalidade, isAdmin, origemUsuarioId, licencas, usuario, tipoId]);

  // Tipo derivado da licença (em transferência admin) ou do form (nova)
  const tipoEfetivo = useMemo(() => {
    if (modalidade === "Transferencia" && licencaOrigemId !== null) {
      const lic = licencas.find((l) => l.licenca_id === licencaOrigemId);
      return lic?.tipo_id ?? null;
    }
    return tipoId;
  }, [modalidade, licencaOrigemId, licencas, tipoId]);

  // Setor da solicitação = setor do beneficiário (ou setor do solicitante no não-admin)
  const setorEfetivoId = beneficiario?.setor_id ?? usuario?.setor_id ?? null;
  const setorEfetivo = setores.find((s) => s.setor_id === setorEfetivoId);

  // ---------- HANDLERS ----------

  // Quando admin troca modalidade, limpa estado
  function trocarModalidade(m: Modalidade) {
    setModalidade(m);
    setTipoId(null);
    setLicencaOrigemId(null);
    setBeneficiarioId(null);
    setOrigemUsuarioId(null);
    setErros({});
    setErroSubmit(null);
  }

  // Quando admin escolhe a licença origem, e ainda não escolheu destino, sugere automaticamente
  // que o destino seja do mesmo setor da licença. Filtro do UserPicker já cuida disso.
  const setorLicencaOrigem = useMemo(() => {
    if (!licencaOrigemId) return null;
    return licencas.find((l) => l.licenca_id === licencaOrigemId)?.setor_id ?? null;
  }, [licencaOrigemId, licencas]);

  function validar(): boolean {
    const erros: Record<string, string> = {};

    if (modalidade === "Nova") {
      if (isAdmin && !beneficiarioId) erros.beneficiario = "Selecione o usuário que receberá a licença.";
      if (!tipoId) erros.tipo = "Selecione o tipo de licença.";
    } else {
      if (isAdmin && !origemUsuarioId) erros.origem = "Selecione o usuário que terá a licença removida.";
      if (!licencaOrigemId) erros.licencaOrigem = "Selecione a licença a transferir.";
      if (isAdmin && !beneficiarioId) erros.beneficiario = "Selecione o usuário destino.";
      // Validação de setor (mesmo setor)
      if (isAdmin && beneficiario && setorLicencaOrigem && beneficiario.setor_id !== setorLicencaOrigem) {
        erros.beneficiario = "Usuário destino precisa ser do mesmo setor da licença.";
      }
    }

    if (justificativa.trim().length < 20) {
      erros.justificativa = "Justificativa deve ter no mínimo 20 caracteres.";
    }

    setErros(erros);
    return Object.keys(erros).length === 0;
  }

  async function submeter(enviar: boolean) {
    setErroSubmit(null);
    if (!validar()) return;
    if (!usuario || !setorEfetivoId || tipoEfetivo === null) return;

    const beneficiarioEfetivo = isAdmin ? beneficiarioId! : usuario.usuario_id;

    setSalvando(true);
    try {
      await fakeApi.criarSolicitacao({
        solicitante_id: usuario.usuario_id,
        beneficiario_id: beneficiarioEfetivo,
        setor_id: setorEfetivoId,
        tipo_id: tipoEfetivo,
        modalidade,
        licenca_origem_id: modalidade === "Transferencia" ? licencaOrigemId : null,
        justificativa: justificativa.trim(),
        enviar,
      });
      qc.invalidateQueries({ queryKey: ["minhas-solicitacoes"] });
      qc.invalidateQueries({ queryKey: ["aprovacoes-pendentes"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      navigate("/minhas-solicitacoes");
    } catch (e) {
      setErroSubmit(e instanceof Error ? e.message : "Erro ao enviar.");
    } finally {
      setSalvando(false);
    }
  }

  // ---------- RENDER ----------

  return (
    <div className="max-w-3xl">
      <PageHeader
        titulo="Nova solicitação de licença"
        descricao={
          isAdmin
            ? "Você pode criar solicitações em nome de qualquer usuário."
            : `Setor: ${setorEfetivo?.nome ?? "—"} · A solicitação seguirá para aprovação do gestor.`
        }
      />

      {isAdmin && (
        <div className="card p-3 mb-4 bg-amber-50 border-amber-200 flex items-center gap-2">
          <Shield className="text-amber-700 shrink-0" size={18} />
          <div className="text-sm text-amber-900">
            <strong>Modo Administrador</strong> — campos adicionais habilitados para escolher usuários envolvidos.
          </div>
        </div>
      )}

      <form className="card p-6 space-y-5" onSubmit={(e) => e.preventDefault()}>
        {/* Modalidade */}
        <div>
          <label className="label">Modalidade</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => trocarModalidade("Nova")}
              className={`p-3 rounded-md border-2 text-left transition-colors ${
                modalidade === "Nova"
                  ? "border-brand-500 bg-brand-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="font-medium text-slate-900">Nova licença</div>
              <div className="text-xs text-slate-500">Solicitar um novo slot do pool do setor</div>
            </button>
            <button
              type="button"
              onClick={() => trocarModalidade("Transferencia")}
              className={`p-3 rounded-md border-2 text-left transition-colors ${
                modalidade === "Transferencia"
                  ? "border-brand-500 bg-brand-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="font-medium text-slate-900">Transferência</div>
              <div className="text-xs text-slate-500">
                {isAdmin ? "De um usuário para outro" : "De alguém do mesmo setor"}
              </div>
            </button>
          </div>
        </div>

        {/* ============== FLUXO ADMIN — TRANSFERÊNCIA ============== */}
        {isAdmin && modalidade === "Transferencia" && (
          <>
            <div>
              <label className="label">Usuário de origem (perderá a licença)</label>
              <UserPicker
                usuarios={usuarios}
                setores={setores}
                valor={origemUsuarioId}
                onChange={(id) => {
                  setOrigemUsuarioId(id);
                  setLicencaOrigemId(null);
                  setBeneficiarioId(null);
                }}
                filtro={(u) => licencas.some((l) => l.usuario_atual_id === u.usuario_id && l.status === "EmUso")}
                placeholder="Buscar usuário que possui licença SAP…"
                mensagemVazio="Nenhum usuário com licença ativa encontrado."
              />
              {erros.origem && <p className="text-xs text-red-600 mt-1">{erros.origem}</p>}
            </div>

            {origem && (
              <div>
                <label className="label">Licença a transferir</label>
                {licencasDisponiveisParaTransferencia.length === 0 ? (
                  <div className="p-3 rounded bg-slate-50 text-sm text-slate-500">
                    Este usuário não possui licenças em uso.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {licencasDisponiveisParaTransferencia.map((l) => {
                      const tipo = tipos.find((t) => t.tipo_id === l.tipo_id);
                      const setor = setores.find((s) => s.setor_id === l.setor_id);
                      const selecionada = licencaOrigemId === l.licenca_id;
                      return (
                        <label
                          key={l.licenca_id}
                          className={`flex items-center gap-3 p-3 rounded-md border-2 cursor-pointer transition-colors ${
                            selecionada ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="radio"
                            checked={selecionada}
                            onChange={() => {
                              setLicencaOrigemId(l.licenca_id);
                              setBeneficiarioId(null);
                            }}
                            className="text-brand-600"
                          />
                          <div className="flex-1">
                            <div className="font-mono font-medium text-slate-900">{l.codigo_sap}</div>
                            <div className="text-xs text-slate-500">
                              {tipo?.nome} · {setor?.nome}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
                {erros.licencaOrigem && <p className="text-xs text-red-600 mt-1">{erros.licencaOrigem}</p>}
              </div>
            )}

            {licencaOrigemId && origem && (
              <>
                <div className="flex items-center justify-center text-slate-400 py-1">
                  <ArrowRight size={20} />
                </div>
                <div>
                  <label className="label">Usuário destino (receberá a licença)</label>
                  <UserPicker
                    usuarios={usuarios}
                    setores={setores}
                    valor={beneficiarioId}
                    onChange={setBeneficiarioId}
                    filtro={(u) =>
                      u.usuario_id !== origemUsuarioId &&
                      u.setor_id === setorLicencaOrigem &&
                      // não pode já ter licença ativa do mesmo tipo
                      !licencas.some(
                        (l) =>
                          l.usuario_atual_id === u.usuario_id &&
                          l.tipo_id === tipoEfetivo &&
                          l.status === "EmUso"
                      )
                    }
                    placeholder={`Buscar usuário do setor ${setores.find((s) => s.setor_id === setorLicencaOrigem)?.nome ?? ""}…`}
                    mensagemVazio="Nenhum usuário disponível neste setor."
                  />
                  {erros.beneficiario && <p className="text-xs text-red-600 mt-1">{erros.beneficiario}</p>}
                  <p className="text-xs text-slate-500 mt-1">
                    Apenas usuários do mesmo setor que ainda não tenham licença deste tipo.
                  </p>
                </div>
              </>
            )}
          </>
        )}

        {/* ============== FLUXO ADMIN — NOVA LICENÇA ============== */}
        {isAdmin && modalidade === "Nova" && (
          <>
            <div>
              <label className="label">Beneficiário (usuário que receberá a licença)</label>
              <UserPicker
                usuarios={usuarios}
                setores={setores}
                valor={beneficiarioId}
                onChange={setBeneficiarioId}
                placeholder="Buscar usuário por nome, matrícula ou e-mail…"
              />
              {erros.beneficiario && <p className="text-xs text-red-600 mt-1">{erros.beneficiario}</p>}
            </div>

            {beneficiario && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-md text-sm">
                <div>
                  <div className="text-xs text-slate-500">Cargo</div>
                  <div className="font-medium text-slate-900">{beneficiario.cargo}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Setor</div>
                  <div className="font-medium text-slate-900">{setorEfetivo?.nome ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Matrícula</div>
                  <div className="font-mono text-slate-900">{beneficiario.matricula}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">E-mail</div>
                  <div className="text-slate-900 truncate">{beneficiario.email}</div>
                </div>
              </div>
            )}

            <div>
              <label className="label">Tipo de licença</label>
              <select
                className="input"
                value={tipoId ?? ""}
                onChange={(e) => setTipoId(e.target.value === "" ? null : Number(e.target.value))}
              >
                <option value="">Selecione…</option>
                {tipos.map((t) => (
                  <option key={t.tipo_id} value={t.tipo_id}>
                    {t.nome}
                  </option>
                ))}
              </select>
              {erros.tipo && <p className="text-xs text-red-600 mt-1">{erros.tipo}</p>}
            </div>
          </>
        )}

        {/* ============== FLUXO NÃO-ADMIN ============== */}
        {!isAdmin && (
          <>
            <div>
              <label className="label">Tipo de licença</label>
              <select
                className="input"
                value={tipoId ?? ""}
                onChange={(e) => {
                  setTipoId(e.target.value === "" ? null : Number(e.target.value));
                  setLicencaOrigemId(null);
                }}
              >
                <option value="">Selecione…</option>
                {tipos.map((t) => (
                  <option key={t.tipo_id} value={t.tipo_id}>
                    {t.nome}
                  </option>
                ))}
              </select>
              {erros.tipo && <p className="text-xs text-red-600 mt-1">{erros.tipo}</p>}
            </div>

            {modalidade === "Transferencia" && (
              <div>
                <label className="label">Licença de origem (mesmo setor)</label>
                <select
                  className="input"
                  value={licencaOrigemId ?? ""}
                  onChange={(e) =>
                    setLicencaOrigemId(e.target.value === "" ? null : Number(e.target.value))
                  }
                  disabled={!tipoId}
                >
                  <option value="">
                    {tipoId ? "Selecione uma licença…" : "Selecione o tipo primeiro"}
                  </option>
                  {licencasDisponiveisParaTransferencia.map((l) => {
                    const dono = usuarios.find((u) => u.usuario_id === l.usuario_atual_id);
                    return (
                      <option key={l.licenca_id} value={l.licenca_id}>
                        {l.codigo_sap} — atualmente com {dono?.nome ?? "—"}
                      </option>
                    );
                  })}
                </select>
                {tipoId && licencasDisponiveisParaTransferencia.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Nenhuma licença deste tipo em uso no seu setor para transferir.
                  </p>
                )}
                {erros.licencaOrigem && <p className="text-xs text-red-600 mt-1">{erros.licencaOrigem}</p>}
              </div>
            )}
          </>
        )}

        {/* ============== JUSTIFICATIVA (sempre) ============== */}
        <div>
          <label className="label">Justificativa</label>
          <textarea
            rows={4}
            className="input"
            placeholder="Descreva o motivo da solicitação, módulos a serem usados, duração estimada…"
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
          />
          <div className="flex justify-between items-center mt-1">
            {erros.justificativa ? (
              <p className="text-xs text-red-600">{erros.justificativa}</p>
            ) : (
              <span className="text-xs text-slate-400">Mínimo 20 caracteres.</span>
            )}
            <span className="text-xs text-slate-400">{justificativa.length} caracteres</span>
          </div>
        </div>

        {erroSubmit && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 text-red-700 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{erroSubmit}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <button type="button" className="btn-secondary" disabled={salvando} onClick={() => submeter(false)}>
            Salvar rascunho
          </button>
          <button type="button" className="btn-primary" disabled={salvando} onClick={() => submeter(true)}>
            {salvando ? "Enviando…" : "Enviar para aprovação"}
          </button>
        </div>
      </form>
    </div>
  );
}
