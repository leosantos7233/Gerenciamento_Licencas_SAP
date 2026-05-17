import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Download, Search } from "lucide-react";
import { fakeApi } from "@/mocks/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { UserPicker } from "@/components/shared/UserPicker";
import { formatarDataHora } from "@/lib/utils";
import { exportarCsv } from "@/lib/exportar";
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

function tempoRelativo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h atrás`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} dia${d > 1 ? "s" : ""} atrás`;
  const m = Math.floor(d / 30);
  if (m < 12) return `${m} mês${m > 1 ? "es" : ""} atrás`;
  const y = Math.floor(m / 12);
  return `${y} ano${y > 1 ? "s" : ""} atrás`;
}

export function HistoricoPage() {
  const [busca, setBusca] = useState("");
  const [matricula, setMatricula] = useState("");
  const [codigoSap, setCodigoSap] = useState("");
  const [usuarioFiltroId, setUsuarioFiltroId] = useState<number | null>(null);
  const [eventoFiltro, setEventoFiltro] = useState<TipoEventoLicenca | "">("");
  const [setorFiltro, setSetorFiltro] = useState<number | "">("");
  const [tipoFiltro, setTipoFiltro] = useState<number | "">("");
  const [periodoFiltro, setPeriodoFiltro] = useState<"7" | "30" | "90" | "todos">("todos");

  const { data: historico = [] } = useQuery({ queryKey: ["historico"], queryFn: () => fakeApi.listarHistorico() });
  const { data: licencas = [] } = useQuery({ queryKey: ["licencas"], queryFn: () => fakeApi.listarLicencas() });
  const { data: usuarios = [] } = useQuery({ queryKey: ["usuarios"], queryFn: () => fakeApi.listarUsuarios() });
  const { data: tipos = [] } = useQuery({ queryKey: ["tipos"], queryFn: () => fakeApi.listarTipos() });
  const { data: setores = [] } = useQuery({ queryKey: ["setores"], queryFn: () => fakeApi.listarSetores() });

  const filtrado = useMemo(() => {
    const limite = periodoFiltro === "todos" ? null : Date.now() - Number(periodoFiltro) * 24 * 60 * 60 * 1000;
    return historico
      .filter((h) => {
        const lic = licencas.find((l) => l.licenca_id === h.licenca_id);
        const anterior = usuarios.find((u) => u.usuario_id === h.usuario_anterior_id);
        const novo = usuarios.find((u) => u.usuario_id === h.usuario_novo_id);

        // Filtro usuário (anterior OU novo)
        if (usuarioFiltroId !== null) {
          if (h.usuario_anterior_id !== usuarioFiltroId && h.usuario_novo_id !== usuarioFiltroId) {
            return false;
          }
        }

        // Filtro matrícula (qualquer um dos envolvidos)
        if (matricula.trim()) {
          const m = matricula.trim().toLowerCase();
          const matchAnterior = anterior?.matricula.toLowerCase().includes(m);
          const matchNovo = novo?.matricula.toLowerCase().includes(m);
          if (!matchAnterior && !matchNovo) return false;
        }

        // Filtro código SAP
        if (codigoSap.trim()) {
          if (!lic?.codigo_sap.toLowerCase().includes(codigoSap.trim().toLowerCase())) return false;
        }

        if (eventoFiltro && h.tipo_evento !== eventoFiltro) return false;
        if (limite !== null && new Date(h.executado_em).getTime() < limite) return false;
        if (setorFiltro !== "" && lic?.setor_id !== setorFiltro) return false;
        if (tipoFiltro !== "" && lic?.tipo_id !== tipoFiltro) return false;

        // Busca livre
        if (busca.trim()) {
          const t = busca.trim().toLowerCase();
          if (
            !lic?.codigo_sap.toLowerCase().includes(t) &&
            !anterior?.nome.toLowerCase().includes(t) &&
            !novo?.nome.toLowerCase().includes(t) &&
            !(h.observacao ?? "").toLowerCase().includes(t)
          ) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => b.executado_em.localeCompare(a.executado_em));
  }, [historico, licencas, usuarios, busca, matricula, codigoSap, usuarioFiltroId, eventoFiltro, setorFiltro, tipoFiltro, periodoFiltro]);

  const stats = useMemo(() => {
    const por_evento: Record<string, number> = {};
    for (const h of filtrado) {
      por_evento[h.tipo_evento] = (por_evento[h.tipo_evento] ?? 0) + 1;
    }
    return por_evento;
  }, [filtrado]);

  function limparFiltros() {
    setBusca("");
    setMatricula("");
    setCodigoSap("");
    setUsuarioFiltroId(null);
    setEventoFiltro("");
    setSetorFiltro("");
    setTipoFiltro("");
    setPeriodoFiltro("todos");
  }

  function exportar() {
    exportarCsv({
      nomeArquivo: `historico-licencas-${new Date().toISOString().slice(0, 10)}.csv`,
      colunas: [
        { cabecalho: "Data/Hora", valor: (h) => formatarDataHora(h.executado_em) },
        { cabecalho: "Evento", valor: (h) => rotuloEvento[h.tipo_evento] },
        { cabecalho: "Código SAP", valor: (h) => licencas.find((l) => l.licenca_id === h.licenca_id)?.codigo_sap ?? "" },
        { cabecalho: "Tipo licença", valor: (h) => {
          const lic = licencas.find((l) => l.licenca_id === h.licenca_id);
          return tipos.find((t) => t.tipo_id === lic?.tipo_id)?.nome ?? "";
        }},
        { cabecalho: "Setor", valor: (h) => {
          const lic = licencas.find((l) => l.licenca_id === h.licenca_id);
          return setores.find((s) => s.setor_id === lic?.setor_id)?.nome ?? "";
        }},
        { cabecalho: "Usuário anterior", valor: (h) => usuarios.find((u) => u.usuario_id === h.usuario_anterior_id)?.nome ?? "" },
        { cabecalho: "Matrícula anterior", valor: (h) => usuarios.find((u) => u.usuario_id === h.usuario_anterior_id)?.matricula ?? "" },
        { cabecalho: "Usuário novo", valor: (h) => usuarios.find((u) => u.usuario_id === h.usuario_novo_id)?.nome ?? "" },
        { cabecalho: "Matrícula nova", valor: (h) => usuarios.find((u) => u.usuario_id === h.usuario_novo_id)?.matricula ?? "" },
        { cabecalho: "Executado por", valor: (h) => usuarios.find((u) => u.usuario_id === h.executado_por)?.nome ?? "" },
        { cabecalho: "Solicitação #", valor: (h) => h.solicitacao_id ?? "" },
        { cabecalho: "Observação", valor: (h) => h.observacao ?? "" },
      ],
      linhas: filtrado,
    });
  }

  const filtrosAtivos =
    busca || matricula || codigoSap || usuarioFiltroId !== null || eventoFiltro || setorFiltro !== "" || tipoFiltro !== "" || periodoFiltro !== "todos";

  return (
    <div>
      <PageHeader
        titulo="Histórico de movimentação"
        descricao="Linha do tempo rastreável: por licença, por usuário, por solicitação. Clique no código SAP para ver a trajetória completa de cada licença."
        acoes={
          <button className="btn-secondary" onClick={exportar} disabled={filtrado.length === 0}>
            <Download size={16} /> Exportar Excel
          </button>
        }
      />

      <div className="card p-4 mb-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="label">Filtrar por usuário (anterior ou novo)</label>
            <UserPicker
              usuarios={usuarios}
              setores={setores}
              valor={usuarioFiltroId}
              onChange={setUsuarioFiltroId}
              placeholder="Buscar usuário envolvido em movimentações…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Matrícula do colaborador</label>
              <input
                className="input"
                placeholder="ex.: FIN010"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Código da licença</label>
              <input
                className="input font-mono"
                placeholder="ex.: SAPUSR0001"
                value={codigoSap}
                onChange={(e) => setCodigoSap(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="label">Busca livre</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9"
                placeholder="Nome, observação…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Tipo de movimentação</label>
            <select className="input" value={eventoFiltro} onChange={(e) => setEventoFiltro(e.target.value as TipoEventoLicenca | "")}>
              <option value="">Todos</option>
              {Object.entries(rotuloEvento).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Setor</label>
            <select className="input" value={setorFiltro} onChange={(e) => setSetorFiltro(e.target.value === "" ? "" : Number(e.target.value))}>
              <option value="">Todos</option>
              {setores.map((s) => <option key={s.setor_id} value={s.setor_id}>{s.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tipo de licença</label>
            <select className="input" value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value === "" ? "" : Number(e.target.value))}>
              <option value="">Todos</option>
              {tipos.map((t) => <option key={t.tipo_id} value={t.tipo_id}>{t.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Período</label>
            <select className="input" value={periodoFiltro} onChange={(e) => setPeriodoFiltro(e.target.value as typeof periodoFiltro)}>
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="todos">Todos</option>
            </select>
          </div>
        </div>

        {filtrosAtivos && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              {filtrado.length} resultado{filtrado.length === 1 ? "" : "s"} com os filtros aplicados
            </span>
            <button onClick={limparFiltros} className="text-xs text-brand-600 hover:underline">
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-5 gap-3 mb-4">
        {(Object.keys(rotuloEvento) as TipoEventoLicenca[]).map((ev) => (
          <div key={ev} className="card p-3">
            <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${corEvento[ev]} mb-2`}>
              {rotuloEvento[ev]}
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats[ev] ?? 0}</div>
            <div className="text-xs text-slate-500">no período filtrado</div>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Linha do tempo · {filtrado.length} evento{filtrado.length === 1 ? "" : "s"}</h2>
        {filtrado.length === 0 ? (
          <div className="text-center text-slate-500 py-8">Nenhum evento encontrado com os filtros aplicados.</div>
        ) : (
          <ol className="relative space-y-4 pl-6 border-l-2 border-slate-100">
            {filtrado.map((h) => {
              const lic = licencas.find((l) => l.licenca_id === h.licenca_id);
              const tipo = tipos.find((t) => t.tipo_id === lic?.tipo_id);
              const setor = setores.find((s) => s.setor_id === lic?.setor_id);
              const de = usuarios.find((u) => u.usuario_id === h.usuario_anterior_id);
              const para = usuarios.find((u) => u.usuario_id === h.usuario_novo_id);
              const executor = usuarios.find((u) => u.usuario_id === h.executado_por);

              return (
                <li key={h.historico_id} className="relative">
                  <div className={`absolute -left-[1.85rem] top-2 w-3 h-3 rounded-full border-2 ${corEvento[h.tipo_evento]}`}></div>
                  <div className="card p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${corEvento[h.tipo_evento]}`}>
                          {rotuloEvento[h.tipo_evento]}
                        </span>
                        {lic && (
                          <Link
                            to={`/licencas/${lic.licenca_id}`}
                            className="font-mono text-sm font-medium text-brand-700 hover:underline"
                            title="Abrir página da licença"
                          >
                            {lic.codigo_sap}
                          </Link>
                        )}
                        {tipo && <span className="text-xs text-slate-500">{tipo.nome}</span>}
                        {setor && <span className="text-xs text-slate-500">· {setor.nome}</span>}
                      </div>
                      <div className="text-right text-xs text-slate-500 whitespace-nowrap">
                        <div>{formatarDataHora(h.executado_em)}</div>
                        <div className="italic">{tempoRelativo(h.executado_em)}</div>
                      </div>
                    </div>

                    {(de || para) && (
                      <div className="flex items-center gap-2 text-sm py-1">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-slate-500">De</div>
                          <div className={de ? "font-medium" : "text-slate-400 italic"}>
                            {de?.nome ?? "(pool livre)"}
                            {de && <span className="block text-xs text-slate-500 font-normal">{de.matricula}</span>}
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-slate-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-slate-500">Para</div>
                          <div className={para ? "font-medium" : "text-slate-400 italic"}>
                            {para?.nome ?? "(pool livre)"}
                            {para && <span className="block text-xs text-slate-500 font-normal">{para.matricula}</span>}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-600 grid grid-cols-2 gap-2">
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
                      <p className="mt-2 text-sm text-slate-700 italic bg-slate-50 p-2 rounded">
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
  );
}
