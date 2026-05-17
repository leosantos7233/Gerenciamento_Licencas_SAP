import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, LogOut, RefreshCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fakeApi } from "@/mocks/api";
import { cn } from "@/lib/utils";

export function Header() {
  const { usuario, logout, trocarUsuario } = useAuth();
  const navigate = useNavigate();
  const [abertoUser, setAbertoUser] = useState(false);
  const [abertoSwitch, setAbertoSwitch] = useState(false);

  const { data: usuarios = [] } = useQuery({
    queryKey: ["usuarios"],
    queryFn: () => fakeApi.listarUsuarios(),
  });

  const { data: setores = [] } = useQuery({
    queryKey: ["setores"],
    queryFn: () => fakeApi.listarSetores(),
  });

  if (!usuario) return null;
  const setorNome = setores.find((s) => s.setor_id === usuario.setor_id)?.nome ?? "—";

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div>
        <div className="text-sm text-slate-500">Bem-vindo de volta,</div>
        <div className="font-semibold text-slate-900">{usuario.nome}</div>
      </div>

      <div className="flex items-center gap-3">
        {/* Demo: troca rápida de usuário */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setAbertoSwitch((v) => !v);
              setAbertoUser(false);
            }}
            className="btn-secondary text-xs"
          >
            <RefreshCcw size={14} /> Trocar usuário (demo)
          </button>
          {abertoSwitch && (
            <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto card p-2 z-20">
              <div className="px-3 py-2 text-xs uppercase text-slate-400 tracking-wider">
                Login rápido como…
              </div>
              {usuarios.map((u) => (
                <button
                  key={u.usuario_id}
                  onClick={() => {
                    trocarUsuario(u);
                    setAbertoSwitch(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm hover:bg-slate-100 flex items-start justify-between gap-2",
                    u.usuario_id === usuario.usuario_id && "bg-brand-50"
                  )}
                >
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 truncate">{u.nome}</div>
                    <div className="text-xs text-slate-500 truncate">{u.email}</div>
                  </div>
                  <div className="text-xs text-slate-500 shrink-0">{u.perfis.join(", ")}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Menu do usuário */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setAbertoUser((v) => !v);
              setAbertoSwitch(false);
            }}
            className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-slate-100"
          >
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold">
              {usuario.nome.charAt(0)}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-sm font-medium text-slate-900">{usuario.nome}</div>
              <div className="text-xs text-slate-500">{setorNome}</div>
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </button>
          {abertoUser && (
            <div className="absolute right-0 mt-2 w-64 card p-2 z-20">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="text-sm font-medium">{usuario.nome}</div>
                <div className="text-xs text-slate-500">{usuario.email}</div>
                <div className="text-xs text-slate-500 mt-1">
                  Perfis: <span className="font-medium">{usuario.perfis.join(", ")}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="w-full mt-1 px-3 py-2 rounded-md text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut size={14} /> Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
