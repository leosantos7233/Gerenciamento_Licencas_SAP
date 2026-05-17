import { PageHeader } from "@/components/shared/PageHeader";
import { permissoesPorPerfil } from "@/mocks/dados";

export function PerfisAdminPage() {
  const perfis = Object.keys(permissoesPorPerfil) as Array<keyof typeof permissoesPorPerfil>;

  return (
    <div>
      <PageHeader
        titulo="Perfis e permissões"
        descricao="Mapa de permissões granulares por perfil. No banco real, virá das tabelas Perfis × PerfilPermissao × Permissoes."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {perfis.map((p) => (
          <div key={p} className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-2">{p}</h3>
            <ul className="space-y-1">
              {permissoesPorPerfil[p].map((perm) => (
                <li key={perm} className="text-xs font-mono text-slate-600">
                  ✓ {perm}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
