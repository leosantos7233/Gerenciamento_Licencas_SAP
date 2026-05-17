import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { Setor, Usuario } from "@/types";

interface Props {
  usuarios: Usuario[];
  setores: Setor[];
  valor: number | null;
  onChange: (id: number | null) => void;
  filtro?: (u: Usuario) => boolean;
  placeholder?: string;
  mensagemVazio?: string;
}

export function UserPicker({
  usuarios,
  setores,
  valor,
  onChange,
  filtro,
  placeholder = "Buscar usuário por nome, matrícula ou e-mail…",
  mensagemVazio = "Nenhum usuário encontrado.",
}: Props) {
  const [query, setQuery] = useState("");
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const selecionado = valor !== null ? usuarios.find((u) => u.usuario_id === valor) : null;

  if (selecionado) {
    const setor = setores.find((s) => s.setor_id === selecionado.setor_id);
    return (
      <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-md border border-brand-200">
        <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-semibold shrink-0">
          {selecionado.nome.charAt(0)}
        </div>
        <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-3 gap-y-0.5">
          <div className="col-span-2">
            <div className="font-semibold text-slate-900 truncate">{selecionado.nome}</div>
          </div>
          <div className="text-xs">
            <span className="text-slate-500">Cargo:</span>{" "}
            <span className="text-slate-800">{selecionado.cargo}</span>
          </div>
          <div className="text-xs">
            <span className="text-slate-500">Setor:</span>{" "}
            <span className="text-slate-800">{setor?.nome ?? "—"}</span>
          </div>
          <div className="text-xs">
            <span className="text-slate-500">Matrícula:</span>{" "}
            <span className="font-mono text-slate-800">{selecionado.matricula}</span>
          </div>
          <div className="text-xs truncate">
            <span className="text-slate-500">E-mail:</span>{" "}
            <span className="text-slate-800">{selecionado.email}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-slate-400 hover:text-red-500 p-1 shrink-0"
          title="Limpar seleção"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  const lista = usuarios
    .filter((u) => u.ativo)
    .filter((u) => !filtro || filtro(u))
    .filter((u) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        u.nome.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.matricula.toLowerCase().includes(q) ||
        u.cargo.toLowerCase().includes(q)
      );
    })
    .slice(0, 8);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-9"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
        />
      </div>
      {aberto && (
        <div className="absolute top-full left-0 right-0 mt-1 card max-h-72 overflow-y-auto z-20">
          {lista.length === 0 ? (
            <div className="p-3 text-sm text-slate-500 text-center">{mensagemVazio}</div>
          ) : (
            lista.map((u) => {
              const setor = setores.find((s) => s.setor_id === u.setor_id);
              return (
                <button
                  key={u.usuario_id}
                  type="button"
                  onClick={() => {
                    onChange(u.usuario_id);
                    setQuery("");
                    setAberto(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50 last:border-b-0"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-semibold text-sm shrink-0">
                    {u.nome.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-slate-900 truncate">{u.nome}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {u.cargo} · {setor?.nome ?? "—"} · {u.matricula}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
