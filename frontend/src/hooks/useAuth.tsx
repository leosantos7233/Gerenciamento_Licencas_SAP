import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { PermissaoChave, Usuario } from "@/types";
import { fakeLogin, permissoesDoUsuario } from "@/mocks/api";

interface AuthContextValue {
  usuario: Usuario | null;
  permissoes: PermissaoChave[];
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  trocarUsuario: (u: Usuario) => void; // utilitário para demonstração
  temPermissao: (chave: PermissaoChave) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "sap-licencas:usuario";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo) {
      try {
        setUsuario(JSON.parse(salvo) as Usuario);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setCarregando(false);
  }, []);

  const persistir = (u: Usuario | null) => {
    setUsuario(u);
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const login = async (email: string, senha: string) => {
    const u = await fakeLogin(email, senha);
    persistir(u);
  };

  const logout = () => persistir(null);

  const trocarUsuario = (u: Usuario) => persistir(u);

  const permissoes = usuario ? permissoesDoUsuario(usuario) : [];
  const temPermissao = (chave: PermissaoChave) => permissoes.includes(chave);

  return (
    <AuthContext.Provider value={{ usuario, permissoes, carregando, login, logout, trocarUsuario, temPermissao }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
