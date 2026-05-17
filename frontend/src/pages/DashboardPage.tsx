import { useQuery } from "@tanstack/react-query";
import { Key, CheckCircle, XCircle, Clock, AlertTriangle, DollarSign } from "lucide-react";
import { fakeApi } from "@/mocks/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatarMoeda } from "@/lib/utils";

interface CardProps {
  titulo: string;
  valor: string | number;
  icone: typeof Key;
  cor: string;
  subtitulo?: string;
}

function CardIndicador({ titulo, valor, icone: Icone, cor, subtitulo }: CardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wide font-medium">{titulo}</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{valor}</div>
          {subtitulo && <div className="text-xs text-slate-400 mt-1">{subtitulo}</div>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cor}`}>
          <Icone size={20} />
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fakeApi.dashboard(),
  });

  if (isLoading || !data) {
    return <div className="text-slate-500">Carregando indicadores…</div>;
  }

  const custoTotal = data.por_tipo.reduce((acc, t) => acc + t.custo_total_mensal, 0);

  return (
    <div>
      <PageHeader
        titulo="Dashboard"
        descricao="Visão geral das licenças SAP, alocação por setor e custos."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <CardIndicador titulo="Total" valor={data.total_licencas} icone={Key} cor="bg-slate-100 text-slate-700" />
        <CardIndicador titulo="Em uso" valor={data.em_uso} icone={CheckCircle} cor="bg-emerald-100 text-emerald-700" />
        <CardIndicador titulo="Disponíveis" valor={data.disponiveis} icone={Key} cor="bg-blue-100 text-blue-700" />
        <CardIndicador titulo="Inativas" valor={data.inativas} icone={XCircle} cor="bg-slate-100 text-slate-500" />
        <CardIndicador titulo="Pendentes" valor={data.pendentes_aprovacao} icone={Clock} cor="bg-amber-100 text-amber-700" subtitulo="solicitações" />
      </div>

      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Custo mensal estimado</h2>
          <DollarSign size={18} className="text-slate-400" />
        </div>
        <div className="text-3xl font-bold text-slate-900">{formatarMoeda(custoTotal)}</div>
        <div className="text-xs text-slate-500 mt-1">considerando apenas licenças em uso</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Por setor</h2>
          <table className="table-base">
            <thead>
              <tr>
                <th>Setor</th>
                <th>Total</th>
                <th>Em uso</th>
                <th>Livres</th>
                <th>Limite</th>
                <th>Utilização</th>
              </tr>
            </thead>
            <tbody>
              {data.por_setor.map((s) => {
                const pct = s.limite_total > 0 ? Math.round((s.em_uso / s.limite_total) * 100) : 0;
                const cor =
                  pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500";
                return (
                  <tr key={s.setor_id}>
                    <td className="font-medium text-slate-900">{s.setor_nome}</td>
                    <td>{s.total}</td>
                    <td>{s.em_uso}</td>
                    <td>{s.disponiveis}</td>
                    <td>{s.limite_total}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 max-w-[80px]">
                          <div className={`h-2 rounded-full ${cor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="text-xs text-slate-600">{pct}%</span>
                        {pct >= 90 && <AlertTriangle size={14} className="text-red-500" />}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Por tipo de licença</h2>
          <table className="table-base">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Em uso</th>
                <th>Livres</th>
                <th>Custo/mês</th>
              </tr>
            </thead>
            <tbody>
              {data.por_tipo.map((t) => (
                <tr key={t.tipo_id}>
                  <td className="font-medium text-slate-900">{t.tipo_nome}</td>
                  <td>{t.em_uso}</td>
                  <td>{t.disponiveis}</td>
                  <td>{formatarMoeda(t.custo_total_mensal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
