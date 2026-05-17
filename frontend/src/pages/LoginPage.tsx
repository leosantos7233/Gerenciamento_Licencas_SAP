import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Key, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fakeApi } from "@/mocks/api";

const schema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  senha: z.string().min(3, "Senha deve ter ao menos 3 caracteres."),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { login, usuario } = useAuth();
  const navigate = useNavigate();
  const [erro, setErro] = useState<string | null>(null);

  const { data: usuariosDemo = [] } = useQuery({
    queryKey: ["usuarios"],
    queryFn: () => fakeApi.listarUsuarios(),
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { senha: "demo123" } });

  useEffect(() => {
    if (usuario) navigate("/");
  }, [usuario, navigate]);

  async function onSubmit(data: FormData) {
    setErro(null);
    try {
      await login(data.email, data.senha);
      navigate("/");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao fazer login.");
    }
  }

  const exemplos = [
    { rotulo: "Administrador", email: "admin@empresa.com.br" },
    { rotulo: "Gerente de TI", email: "carlos.mendes@empresa.com.br" },
    { rotulo: "Gestor (Financeiro)", email: "ana.silva@empresa.com.br" },
    { rotulo: "Diretor (Vendas)", email: "helena.martins@empresa.com.br" },
    { rotulo: "Solicitante", email: "juliana.alves@empresa.com.br" },
    { rotulo: "Auditor", email: "tatiana.moreira@empresa.com.br" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-6">
      <div className="w-full max-w-md card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-brand-600 flex items-center justify-center text-white">
            <Key />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Gestão de Licenças SAP</h1>
            <p className="text-xs text-slate-500">Entre com suas credenciais corporativas</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">E-mail</label>
            <input id="email" type="email" autoComplete="email" placeholder="seu.email@empresa.com.br" className="input" {...register("email")} />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label" htmlFor="senha">Senha</label>
            <input id="senha" type="password" autoComplete="current-password" className="input" {...register("senha")} />
            {errors.senha && <p className="text-xs text-red-600 mt-1">{errors.senha.message}</p>}
          </div>

          {erro && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 text-red-700 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-3">
            <strong>Modo demonstração:</strong> qualquer senha (≥ 3 caracteres) funciona. Clique em um perfil pra preencher:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {exemplos.map((e) => {
              const existe = usuariosDemo.some((u) => u.email === e.email);
              return (
                <button
                  key={e.email}
                  type="button"
                  disabled={!existe}
                  onClick={() => setValue("email", e.email)}
                  className="text-xs px-2 py-1.5 rounded border border-slate-200 hover:bg-slate-50 text-left disabled:opacity-40"
                >
                  <div className="font-medium text-slate-700">{e.rotulo}</div>
                  <div className="text-slate-400 truncate">{e.email}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
