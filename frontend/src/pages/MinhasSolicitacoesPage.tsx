import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { PlusCircle, FileText, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fakeApi } from "@/mocks/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatarDataHora } from "@/lib/utils";

export function MinhasSolicitacoesPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const usuarioId = usuario!.usuario_id;

  const { data: solicitacoes = [], isLoading } = useQuery({
    queryKey: ["minhas-solicitacoes", usuarioId],
    queryFn: () => fakeApi.listarMinhasSolicitacoes(usuarioId),
  });
  const { data: tipos = [] } = useQuery({ queryKey: ["tipos"], queryFn: () => fakeApi.listarTipos() });
  const { data: setores = [] } = useQuery({ queryKey: ["setores"], queryFn: () => fakeApi.listarSetores() });

  return (
    <div>
      <PageHeader
        titulo="Minhas solicitações"
        descricao="Acompanhe o andamento das suas solicitações de licença SAP."
        acoes={
          <Link to="/nova-solicitacao" className="btn-primary">
            <PlusCircle size={16} /> Nova solicitação
          </Link>
        }
      />

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-slate-500">Carregando…</div>
        ) : solicitacoes.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="mx-auto mb-3 text-slate-300" size={40} />
            <p>Você ainda não possui solicitações.</p>
            <Link to="/nova-solicitacao" className="btn-primary mt-4 inline-flex">
              Criar primeira solicitação
            </Link>
          </div>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>#</th>
                <th>Tipo</th>
                <th>Setor</th>
                <th>Modalidade</th>
                <th>Status</th>
                <th>Criado em</th>
                <th>Atualizado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {solicitacoes.map((s) => (
                <tr
                  key={s.solicitacao_id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/solicitacoes/${s.solicitacao_id}`)}
                  title="Abrir detalhes da solicitação"
                >
                  <td className="font-mono text-xs text-slate-500">#{s.solicitacao_id}</td>
                  <td>{tipos.find((t) => t.tipo_id === s.tipo_id)?.nome ?? "—"}</td>
                  <td>{setores.find((x) => x.setor_id === s.setor_id)?.nome ?? "—"}</td>
                  <td>{s.modalidade === "Nova" ? "Nova" : "Transferência"}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td className="text-xs text-slate-500">{formatarDataHora(s.criado_em)}</td>
                  <td className="text-xs text-slate-500">{formatarDataHora(s.atualizado_em)}</td>
                  <td className="text-right text-brand-600">
                    <ChevronRight size={16} className="inline" />
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
