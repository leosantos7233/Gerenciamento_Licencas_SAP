import type { StatusLicenca, StatusSolicitacao } from "@/types";
import { cn } from "@/lib/utils";

const corPorStatusSolicitacao: Record<StatusSolicitacao, string> = {
  Rascunho: "bg-slate-100 text-slate-700",
  PendenteGestor: "bg-amber-100 text-amber-800",
  PendenteDiretor: "bg-orange-100 text-orange-800",
  PendenteTI: "bg-blue-100 text-blue-800",
  Aprovado: "bg-emerald-100 text-emerald-800",
  Rejeitado: "bg-red-100 text-red-800",
  Cancelado: "bg-slate-100 text-slate-500",
  Concluido: "bg-emerald-100 text-emerald-800",
};

const rotuloStatusSolicitacao: Record<StatusSolicitacao, string> = {
  Rascunho: "Rascunho",
  PendenteGestor: "Pendente Gestor",
  PendenteDiretor: "Pendente Diretor",
  PendenteTI: "Pendente TI",
  Aprovado: "Aprovado",
  Rejeitado: "Rejeitado",
  Cancelado: "Cancelado",
  Concluido: "Concluído",
};

const corPorStatusLicenca: Record<StatusLicenca, string> = {
  Livre: "bg-emerald-100 text-emerald-800",
  EmUso: "bg-blue-100 text-blue-800",
  Inativa: "bg-slate-100 text-slate-500",
  Reservada: "bg-amber-100 text-amber-800",
};

const rotuloStatusLicenca: Record<StatusLicenca, string> = {
  Livre: "Livre",
  EmUso: "Em uso",
  Inativa: "Inativa",
  Reservada: "Reservada",
};

interface Props {
  status: StatusSolicitacao | StatusLicenca;
}

export function StatusBadge({ status }: Props) {
  const ehSolicitacao = status in corPorStatusSolicitacao;
  const classe = ehSolicitacao
    ? corPorStatusSolicitacao[status as StatusSolicitacao]
    : corPorStatusLicenca[status as StatusLicenca];
  const rotulo = ehSolicitacao
    ? rotuloStatusSolicitacao[status as StatusSolicitacao]
    : rotuloStatusLicenca[status as StatusLicenca];
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", classe)}>
      {rotulo}
    </span>
  );
}
