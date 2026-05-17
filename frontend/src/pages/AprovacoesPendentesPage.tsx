import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { CheckSquare, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fakeApi } from "@/mocks/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatarDataHora } from "@/lib/utils";

export function AprovacoesPendentesPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const { data: pendentes = [], isLoading } = useQuery({
    queryKey: ["aprovacoes-pendentes", usuario!.usuario_id],
    queryFn: () => fakeApi.listarAprovacoesPendentesPara(usuario!),
  });
  const { data: usuarios = [] } = useQuery({ queryKey: ["usuarios"], queryFn: () => fakeApi.listarUsuarios() });
  const { data: tipos = [] } = useQuery({ queryKey: ["tipos"], queryFn: () => fakeApi.listarTipos() });
  const { data: setores = [] } = useQuery({ queryKey: ["setores"], queryFn: () => fakeApi.listarSetores() });

  return (
    <div>
      <PageHeader
        titulo="Aprovações pendentes"
        descricao="Solicitações aguardando sua decisão."
      />

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-slate-500">Carregando…</div>
        ) : pendentes.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckSquare className="mx-auto mb-3 text-slate-300" size={40} />
            <p>Nenhuma solicitação aguardando sua aprovação.</p>
          </div>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>#</th>
                <th>Solicitante</th>
                <th>Setor</th>
                <th>Tipo</th>
                <th>Modalidade</th>
                <th>Status</th>
                <th>Aguardando há</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pendentes.map((s) => (
                <tr
                  key={s.solicitacao_id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/solicitacoes/${s.solicitacao_id}`)}
                  title="Abrir detalhes da solicitação"
                >
                  <td className="font-mono text-xs text-slate-500">#{s.solicitacao_id}</td>
                  <td>{usuarios.find((u) => u.usuario_id === s.solicitante_id)?.nome ?? "—"}</td>
                  <td>{setores.find((x) => x.setor_id === s.setor_id)?.nome ?? "—"}</td>
                  <td>{tipos.find((t) => t.tipo_id === s.tipo_id)?.nome ?? "—"}</td>
                  <td>{s.modalidade === "Nova" ? "Nova" : "Transferência"}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td className="text-xs text-slate-500">{formatarDataHora(s.atualizado_em)}</td>
                  <td className="text-right">
                    <span className="btn-primary text-xs pointer-events-none inline-flex">
                      Revisar <ChevronRight size={14} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
