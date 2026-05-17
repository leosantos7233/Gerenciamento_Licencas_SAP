import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { PermissaoChave } from "@/types";

interface Props {
  children: ReactNode;
  requer?: PermissaoChave;
}

export function ProtectedRoute({ children, requer }: Props) {
  const { usuario, carregando, temPermissao } = useAuth();
  const location = useLocation();

  if (carregando) {
    return (
      <div className="h-screen flex items-center justify-center text-slate-500">Carregando…</div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requer && !temPermissao(requer)) {
    return (
      <div className="p-8">
        <div className="card p-6 max-w-md">
          <h2 className="text-lg font-semibold text-slate-900">Acesso negado</h2>
          <p className="text-sm text-slate-500 mt-1">
            Você não possui permissão para visualizar este recurso.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
