# Gestão de Licenças SAP — Frontend (mock)

Frontend React do sistema corporativo de gestão de licenças SAP. Esta versão é
totalmente independente do backend — usa **mock data em memória** em
`src/mocks/`. Quando o backend Node + SQL Server estiver pronto, basta
substituir as chamadas em `src/mocks/api.ts` por requisições HTTP reais.

## Stack

- React 18 + TypeScript + Vite
- React Router v6
- TanStack Query (cache de chamadas)
- React Hook Form + Zod (formulários e validação)
- Tailwind CSS
- lucide-react (ícones)

## Como rodar

Pré-requisito: Node.js 20 ou superior. Verifique com `node -v`.

```powershell
cd "c:\Users\Matheus\Documents\My Web Sites\frontend"
npm install
npm run dev
```

Abra http://localhost:5173 no navegador.

## Como testar diferentes perfis

Na tela de login você verá 6 botões de **acesso rápido** (Admin, Gerente TI,
Gestor, Diretor, Solicitante, Auditor). Qualquer senha com 3+ caracteres
funciona no mock.

Já dentro do app, o botão **"Trocar usuário (demo)"** no topo direito permite
alternar pra qualquer usuário sem precisar deslogar — útil pra testar o fluxo
de aprovação (criar solicitação como Solicitante → trocar pra Gestor da área e
aprovar → trocar pra Gerente TI e aprovar).

## Estrutura

```
src/
├── api/            # (futuro) cliente axios real
├── components/
│   ├── layout/     # AppShell, Sidebar, Header
│   └── shared/     # ProtectedRoute, StatusBadge, PageHeader
├── hooks/          # useAuth (contexto de autenticação)
├── lib/            # utilitários (cn, formatadores)
├── mocks/
│   ├── dados.ts    # estado inicial (usuários, setores, licenças, etc)
│   └── api.ts      # "fake API" com mesma assinatura que axios terá
├── pages/          # uma página por rota
├── types/          # tipos compartilhados (espelha schema SQL)
├── App.tsx
├── main.tsx
├── routes.tsx
└── index.css
```

## Fluxos pra testar

### 1. Solicitação completa

1. Login como `juliana.alves@empresa.com.br` (Solicitante, Financeiro)
2. Menu "Nova solicitação" → preencha justificativa e envie
3. Trocar usuário (botão demo) para `ana.silva@empresa.com.br` (Gestor Financeiro)
4. Menu "Aprovações pendentes" → revisar e aprovar
5. Como Financeiro não exige diretor, vai direto pra TI
6. Trocar usuário para `carlos.mendes@empresa.com.br` (Gerente TI) → aprovar
7. A licença é concedida automaticamente; verifique em "Licenças" e "Histórico"

### 2. Fluxo com diretor

Mesmo procedimento mas começando com `olivia.cardoso@empresa.com.br` (Vendas,
que exige aprovação de diretor). A solicitação passa por Gestor → Diretor → TI.

### 3. Rejeição

Tente aprovar/rejeitar a solicitação #105 (já rejeitada) ou crie uma e rejeite
no caminho. Rejeição **exige comentário**.

## Próximas etapas (combinadas)

- [ ] Banco SQL Server (DDL, índices, seeds, mock data, views)
- [ ] Backend Node.js + Express + TypeScript
- [ ] Substituir `fakeApi` por chamadas HTTP reais
- [ ] Autenticação JWT real
- [ ] Notificações in-app
- [ ] Integração LDAP (fase 2)
- [ ] Notificações por e-mail (fase 2)
