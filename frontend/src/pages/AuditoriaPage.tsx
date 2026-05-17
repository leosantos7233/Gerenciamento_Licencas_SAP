import { useQuery } from "@tanstack/react-query";
import { fakeApi } from "@/mocks/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatarDataHora } from "@/lib/utils";

export function AuditoriaPage() {
  const { data: registros = [] } = useQuery({ queryKey: ["auditoria"], queryFn: () => fakeApi.listarAuditoria() });
  const { data: usuarios = [] } = useQuery({ queryKey: ["usuarios"], queryFn: () => fakeApi.listarUsuarios() });

  return (
    <div>
      <PageHeader
        titulo="Auditoria do sistema"
        descricao="Log forense de todas as ações sensíveis: logins, alterações de limite, aprovações e rejeições."
      />
      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Quando</th>
              <th>Usuário</th>
              <th>Ação</th>
              <th>Entidade</th>
              <th>ID</th>
              <th>IP</th>
              <th>Detalhe</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((a) => (
              <tr key={a.auditoria_id}>
                <td className="text-xs text-slate-500 whitespace-nowrap">{formatarDataHora(a.executado_em)}</td>
                <td>{usuarios.find((u) => u.usuario_id === a.usuario_id)?.nome ?? <span className="text-slate-400 italic">anônimo</span>}</td>
                <td className="font-medium">{a.acao}</td>
                <td className="text-slate-600">{a.entidade}</td>
                <td className="text-xs font-mono">{a.entidade_id ?? "—"}</td>
                <td className="text-xs font-mono text-slate-500">{a.ip_origem}</td>
                <td className="text-xs text-slate-600 max-w-md">{a.detalhe}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
