import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  CheckSquare,
  Key,
  History,
  ShieldCheck,
  Users,
  Building2,
  UserCog,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fakeApi } from "@/mocks/api";
import { podeVerDashboard } from "@/lib/permissoes";
import type { PermissaoChave } from "@/types";
import { cn } from "@/lib/utils";

interface Item {
  to: string;
  label: string;
  icone: typeof LayoutDashboard;
  requer?: PermissaoChave;
}

const itens: Item[] = [
  { to: "/", label: "Dashboard", icone: LayoutDashboard, requer: "dashboard:visualizar" },
  { to: "/minhas-solicitacoes", label: "Minhas solicitações", icone: FileText, requer: "licencas:solicitar" },
  { to: "/nova-solicitacao", label: "Nova solicitação", icone: PlusCircle, requer: "licencas:solicitar" },
  { to: "/aprovacoes", label: "Aprovações pendentes", icone: CheckSquare, requer: "licencas:aprovar_gestor" },
  { to: "/licencas", label: "Licenças", icone: Key, requer: "licencas:visualizar_lista" },
  { to: "/historico", label: "Histórico", icone: History, requer: "licencas:visualizar_historico" },
  { to: "/auditoria", label: "Auditoria", icone: ShieldCheck, requer: "auditoria:visualizar" },
  { to: "/admin/usuarios", label: "Usuários", icone: Users, requer: "usuarios:gerenciar" },
  { to: "/admin/setores", label: "Setores", icone: Building2, requer: "setor:gerenciar" },
  { to: "/admin/perfis", label: "Perfis e permissões", icone: UserCog, requer: "perfis:gerenciar" },
];

export function Sidebar() {
  const { temPermissao, permissoes, usuario } = useAuth();
  const { data: setores = [] } = useQuery({ queryKey: ["setores"], queryFn: () => fakeApi.listarSetores() });

  // Aprovações: aparece pra quem tem QUALQUER tipo de aprovação
  const podeVerAprovacoes =
    permissoes.includes("licencas:aprovar_gestor") ||
    permissoes.includes("licencas:aprovar_diretor") ||
    permissoes.includes("licencas:aprovar_ti");

  const setor = usuario ? setores.find((s) => s.setor_id === usuario.setor_id) : undefined;
  const dashboardLiberado = usuario ? podeVerDashboard(usuario, setor, permissoes) : false;

  const itensVisiveis = itens.filter((i) => {
    if (i.to === "/") return dashboardLiberado;
    if (i.to === "/aprovacoes") return podeVerAprovacoes;
    return !i.requer || temPermissao(i.requer);
  });

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-md bg-brand-600 flex items-center justify-center font-bold text-white">
            SAP
          </div>
          <div>
            <div className="font-semibold leading-tight">Licenças SAP</div>
            <div className="text-xs text-slate-400">Gestão corporativa</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {itensVisiveis.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-brand-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )
            }
          >
            <item.icone size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-800 text-xs text-slate-500">
        v0.1.0 · frontend mock
      </div>
    </aside>
  );
}
