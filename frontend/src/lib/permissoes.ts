import type { PermissaoChave, Setor, Usuario } from "@/types";

/**
 * Decide se o usuário pode ver o Dashboard.
 *
 * Regra geral: precisa ter a permissão `dashboard:visualizar`.
 * Exceção setorial: Gestor (sem perfil Administrador) cujo setor tenha
 * `gestor_ve_dashboard = false` perde o acesso, mesmo que o perfil Gestor
 * tenha a permissão.
 */
export function podeVerDashboard(
  usuario: Usuario,
  setor: Setor | undefined,
  permissoes: PermissaoChave[]
): boolean {
  if (!permissoes.includes("dashboard:visualizar")) return false;
  const ehGestor = usuario.perfis.includes("Gestor");
  const ehAdmin = usuario.perfis.includes("Administrador");
  if (ehGestor && !ehAdmin && setor && setor.gestor_ve_dashboard === false) {
    return false;
  }
  return true;
}
