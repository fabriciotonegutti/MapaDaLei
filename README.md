# MapaDaLei

Workflow Kanban multi-agente para mapeamento legislativo fiscal por leaf (categoria folha), cobrindo trilhas de ICMS (intra/inter), PIS/COFINS e IBS/CBS/IS com QA automatizado e gatekeeper semântico antes de persistência no Supabase.

## Stack
- Next.js 14 (App Router)
- TypeScript strict
- Tailwind CSS (dark mode first, design system Mission Control Pro)
- Radix UI + base shadcn/ui
- Supabase (`@supabase/supabase-js`)
- Lucide React
- `clsx` + `class-variance-authority`
- `date-fns`
- ESLint + Prettier

## Setup
1. Instale dependências:
```bash
npm install
```
2. Configure variáveis de ambiente:
```bash
cp .env.example .env.local
```
3. Rode em desenvolvimento:
```bash
npm run dev
```
4. Acesse:
```text
http://localhost:3000
```

## Variáveis de ambiente
Arquivo base: `.env.example`

```env
NEXT_PUBLIC_SUPABASE_URL=https://lepxmupabrzrlfnnsuun.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Observação: se as chaves não estiverem configuradas, a aplicação usa fallback com dados mock para manter o dashboard funcional.

## Arquitetura
```text
src/
├── app/
│   ├── page.tsx                 # Dashboard principal
│   ├── leaves/page.tsx          # Lista de leaves
│   ├── leaves/[id]/page.tsx     # Detalhe de leaf + Kanban
│   ├── monitor/page.tsx         # Monitor legislativo
│   └── api/
│       ├── leaves/route.ts      # GET/POST leaves
│       ├── tasks/route.ts       # GET/PATCH tasks
│       └── monitor/route.ts     # GET/PATCH evidências/hash
├── components/
│   ├── ui/                      # Button, Badge, Card, Dialog, Input
│   ├── KanbanBoard.tsx
│   ├── KanbanColumn.tsx
│   ├── TaskCard.tsx
│   ├── TaskDetailModal.tsx
│   ├── LeafCard.tsx
│   ├── LeafProgressBar.tsx
│   ├── MonitorTable.tsx
│   ├── AgentBadge.tsx
│   ├── StatusBadge.tsx
│   └── PriorityBadge.tsx
├── hooks/
│   ├── useLeaves.ts
│   ├── useTasks.ts
│   └── useMonitor.ts
├── lib/
│   ├── constants.ts
│   ├── mock-data.ts
│   ├── supabase.ts
│   └── utils.ts
└── types/
    └── index.ts
```

## Fluxo funcional
1. Agentes especializados executam tasks por `leaf`.
2. Tasks avançam no Kanban (`todo` → `done`) com estados de QA e gate semântico.
3. Evidências legislativas são monitoradas por hash SHA-256.
4. Ao detectar mudança de hash, o monitor destaca risco para revisão.
5. Regras aprovadas seguem para escrita no banco.

## UI / Design
- Dark mode first com fundo `bg-gray-950`.
- Paleta de prioridades:
  - `P0`: `#ef4444`
  - `P1`: `#f97316`
  - `P2`: `#eab308`
  - `P3`: `#22c55e`
- Paleta de status Kanban conforme Mission Control Pro.

## Qualidade
Validação recomendada antes de push:
```bash
npm run lint
npm run typecheck
npm run build
```

## Screenshots (placeholders)
- `docs/screenshots/dashboard.png`
- `docs/screenshots/leaf-detail-kanban.png`
- `docs/screenshots/monitor-legislativo.png`

## Git e entrega
- Commits semânticos por módulo/epic (`feat:`, `chore:`, `docs:` etc.)
- Branch sugerida: `feature/epic-E0-foundation`
