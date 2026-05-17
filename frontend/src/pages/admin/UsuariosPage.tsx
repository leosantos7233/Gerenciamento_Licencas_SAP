import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, PlusCircle, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fakeApi } from "@/mocks/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Modal } from "@/components/shared/Modal";
import type { PerfilNome, Usuario } from "@/types";

const PERFIS_DISPONIVEIS: PerfilNome[] = [
  "Solicitante",
  "Gestor",
  "Diretor",
  "GerenteTI",
  "Administrador",
  "Auditor",
];

const schema = z.object({
  nome: z.string().min(3, "Nome muito curto."),
  email: z.string().email("E-mail inválido."),
  matricula: z.string().min(3, "Matrícula muito curta."),
  cargo: z.string().min(2, "Cargo obrigatório."),
  setor_id: z.coerce.number().int().positive("Selecione um setor."),
  perfis: z.array(z.string()).min(1, "Selecione ao menos um perfil."),
  ativo: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export function UsuariosAdminPage() {
  const { usuario, temPermissao } = useAuth();
  const qc = useQueryClient();
  const podeEditar = temPermissao("usuarios:gerenciar");

  const { data: usuarios = [] } = useQuery({ queryKey: ["usuarios"], queryFn: () => fakeApi.listarUsuarios() });
  const { data: setores = [] } = useQuery({ queryKey: ["setores"], queryFn: () => fakeApi.listarSetores() });
  const { data: licencas = [] } = useQuery({ queryKey: ["licencas"], queryFn: () => fakeApi.listarLicencas() });

  const [filtro, setFiltro] = useState("");
  const [editando, setEditando] = useState<Usuario | "novo" | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { perfis: ["Solicitante"], ativo: true },
  });

  const perfisSelecionados = watch("perfis") || [];

  const usuariosFiltrados = useMemo(() => {
    if (!filtro) return usuarios;
    const t = filtro.toLowerCase();
    return usuarios.filter(
      (u) =>
        u.nome.toLowerCase().includes(t) ||
        u.email.toLowerCase().includes(t) ||
        u.matricula.toLowerCase().includes(t)
    );
  }, [usuarios, filtro]);

  function abrirNovo() {
    reset({
      nome: "",
      email: "",
      matricula: "",
      cargo: "",
      setor_id: setores[0]?.setor_id ?? 0,
      perfis: ["Solicitante"],
      ativo: true,
    });
    setErro(null);
    setEditando("novo");
  }

  function abrirEdicao(u: Usuario) {
    reset({
      nome: u.nome,
      email: u.email,
      matricula: u.matricula,
      cargo: u.cargo,
      setor_id: u.setor_id,
      perfis: u.perfis as string[],
      ativo: u.ativo,
    });
    setErro(null);
    setEditando(u);
  }

  function togglePerfil(perfil: PerfilNome) {
    const atual = perfisSelecionados as string[];
    if (atual.includes(perfil)) {
      setValue("perfis", atual.filter((p) => p !== perfil), { shouldValidate: true });
    } else {
      setValue("perfis", [...atual, perfil], { shouldValidate: true });
    }
  }

  async function salvar(data: FormData) {
    setErro(null);
    try {
      if (editando === "novo") {
        await fakeApi.criarUsuario({
          nome: data.nome,
          email: data.email,
          matricula: data.matricula,
          cargo: data.cargo,
          setor_id: data.setor_id,
          perfis: data.perfis as PerfilNome[],
          ativo: data.ativo,
          criado_por: usuario!.usuario_id,
        });
      } else if (editando) {
        await fakeApi.atualizarUsuario({
          usuario_id: editando.usuario_id,
          nome: data.nome,
          email: data.email,
          matricula: data.matricula,
          cargo: data.cargo,
          setor_id: data.setor_id,
          perfis: data.perfis as PerfilNome[],
          ativo: data.ativo,
          alterado_por: usuario!.usuario_id,
        });
      }
      qc.invalidateQueries({ queryKey: ["usuarios"] });
      qc.invalidateQueries({ queryKey: ["auditoria"] });
      setEditando(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar.");
    }
  }

  return (
    <div>
      <PageHeader
        titulo="Gestão de usuários"
        descricao="Cadastro, perfis e status dos usuários do sistema."
        acoes={
          podeEditar && (
            <button onClick={abrirNovo} className="btn-primary">
              <PlusCircle size={16} /> Novo usuário
            </button>
          )
        }
      />

      <div className="card p-4 mb-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Buscar por nome, e-mail ou matrícula…"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Matrícula</th>
              <th>Nome</th>
              <th>Cargo</th>
              <th>E-mail</th>
              <th>Setor</th>
              <th>Perfis</th>
              <th>Licenças</th>
              <th>Status</th>
              {podeEditar && <th></th>}
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((u) => {
              const setor = setores.find((s) => s.setor_id === u.setor_id);
              const lics = licencas.filter((l) => l.usuario_atual_id === u.usuario_id);
              return (
                <tr key={u.usuario_id}>
                  <td className="font-mono text-xs">{u.matricula}</td>
                  <td className="font-medium">{u.nome}</td>
                  <td className="text-slate-600">{u.cargo}</td>
                  <td className="text-slate-600">{u.email}</td>
                  <td>{setor?.nome ?? "—"}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {u.perfis.map((p) => (
                        <span key={p} className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="text-xs">
                    {lics.length === 0 ? (
                      <span className="text-slate-400">nenhuma</span>
                    ) : (
                      lics.map((l) => (
                        <span key={l.licenca_id} className="font-mono mr-1">{l.codigo_sap}</span>
                      ))
                    )}
                  </td>
                  <td>
                    <span className={u.ativo ? "text-emerald-700" : "text-slate-400"}>
                      {u.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  {podeEditar && (
                    <td className="text-right">
                      <button className="btn-ghost text-xs" onClick={() => abrirEdicao(u)}>
                        <Pencil size={14} /> Editar
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        aberto={editando !== null}
        onFechar={() => setEditando(null)}
        titulo={editando === "novo" ? "Novo usuário" : `Editar usuário: ${editando ? editando.nome : ""}`}
        largura="lg"
      >
        <form onSubmit={handleSubmit(salvar)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nome completo</label>
              <input className="input" {...register("nome")} />
              {errors.nome && <p className="text-xs text-red-600 mt-1">{errors.nome.message}</p>}
            </div>
            <div>
              <label className="label">Matrícula</label>
              <input className="input" {...register("matricula")} />
              {errors.matricula && <p className="text-xs text-red-600 mt-1">{errors.matricula.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="label">E-mail</label>
              <input type="email" className="input" {...register("email")} />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Cargo</label>
              <input className="input" placeholder="ex.: Analista Financeiro" {...register("cargo")} />
              {errors.cargo && <p className="text-xs text-red-600 mt-1">{errors.cargo.message}</p>}
            </div>
            <div>
              <label className="label">Setor</label>
              <select className="input" {...register("setor_id")}>
                {setores.map((s) => (
                  <option key={s.setor_id} value={s.setor_id}>{s.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Perfis</label>
            <div className="grid grid-cols-2 gap-2">
              {PERFIS_DISPONIVEIS.map((p) => {
                const ativo = (perfisSelecionados as string[]).includes(p);
                return (
                  <label
                    key={p}
                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer text-sm ${
                      ativo ? "border-brand-500 bg-brand-50" : "border-slate-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={ativo}
                      onChange={() => togglePerfil(p)}
                      className="text-brand-600"
                    />
                    <span className="font-medium">{p}</span>
                  </label>
                );
              })}
            </div>
            {errors.perfis && <p className="text-xs text-red-600 mt-1">{errors.perfis.message as string}</p>}
            <p className="text-xs text-slate-500 mt-2">
              Um usuário pode ter múltiplos perfis (ex.: Gestor + Solicitante).
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register("ativo")} className="text-brand-600" />
              <span>Usuário ativo</span>
            </label>
            <p className="text-xs text-slate-500 mt-1">
              Desativar bloqueia login. Licenças vinculadas só são liberadas por revogação manual.
            </p>
          </div>

          {erro && <div className="p-2 rounded bg-red-50 text-red-700 text-xs">{erro}</div>}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" className="btn-secondary" onClick={() => setEditando(null)}>Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? "Salvando…" : editando === "novo" ? "Criar usuário" : "Salvar alterações"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
