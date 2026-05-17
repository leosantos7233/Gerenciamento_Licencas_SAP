import { Routes, Route, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { fakeApi } from "@/mocks/api";
import { podeVerDashboard } from "@/lib/permissoes";

import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { MinhasSolicitacoesPage } from "@/pages/MinhasSolicitacoesPage";
import { NovaSolicitacaoPage } from "@/pages/NovaSolicitacaoPage";
import { AprovacoesPendentesPage } from "@/pages/AprovacoesPendentesPage";
import { SolicitacaoDetalhePage } from "@/pages/SolicitacaoDetalhePage";
import { LicencasPage } from "@/pages/LicencasPage";
import { LicencaDetalhePage } from "@/pages/LicencaDetalhePage";
import { HistoricoPage } from "@/pages/HistoricoPage";
import { AuditoriaPage } from "@/pages/AuditoriaPage";
import { UsuariosAdminPage } from "@/pages/admin/UsuariosPage";
import { SetoresAdminPage } from "@/pages/admin/SetoresPage";
import { PerfisAdminPage } from "@/pages/admin/PerfisPage";

/**
 * Decide o que mostrar em "/" — Dashboard ou redireciona para a primeira página
 * que o usuário tem permissão de acessar. Evita a tela "Acesso negado" no login.
 */
function LandingRoute() {
  const { usuario, permissoes, temPermissao } = useAuth();
  const { data: setores = [] } = useQuery({ queryKey: ["setores"], queryFn: () => fakeApi.listarSetores() });
  if (!usuario) return null;

  const setor = setores.find((s) => s.setor_id === usuario.setor_id);
  if (podeVerDashboard(usuario, setor, permissoes)) return <DashboardPage />;

  if (temPermissao("licencas:solicitar")) return <Navigate to="/minhas-solicitacoes" replace />;
  if (temPermissao("licencas:aprovar_gestor") || temPermissao("licencas:aprovar_diretor") || temPermissao("licencas:aprovar_ti"))
    return <Navigate to="/aprovacoes" replace />;
  if (temPermissao("licencas:visualizar_lista")) return <Navigate to="/licencas" replace />;
  if (temPermissao("auditoria:visualizar")) return <Navigate to="/auditoria" replace />;
  return <Navigate to="/historico" replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<LandingRoute />} />
        <Route path="minhas-solicitacoes" element={<MinhasSolicitacoesPage />} />
        <Route path="nova-solicitacao" element={<NovaSolicitacaoPage />} />
        <Route
          path="aprovacoes"
          element={
            <ProtectedRoute>
              <AprovacoesPendentesPage />
            </ProtectedRoute>
          }
        />
        <Route path="solicitacoes/:id" element={<SolicitacaoDetalhePage />} />
        <Route
          path="licencas"
          element={
            <ProtectedRoute requer="licencas:visualizar_lista">
              <LicencasPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="licencas/:id"
          element={
            <ProtectedRoute requer="licencas:visualizar_lista">
              <LicencaDetalhePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="historico"
          element={
            <ProtectedRoute requer="licencas:visualizar_historico">
              <HistoricoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="auditoria"
          element={
            <ProtectedRoute requer="auditoria:visualizar">
              <AuditoriaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/usuarios"
          element={
            <ProtectedRoute requer="usuarios:gerenciar">
              <UsuariosAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/setores"
          element={
            <ProtectedRoute requer="setor:gerenciar">
              <SetoresAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/perfis"
          element={
            <ProtectedRoute requer="perfis:gerenciar">
              <PerfisAdminPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
