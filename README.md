# MapaDaLei

Workflow Kanban multi-agente para mapeamento legislativo fiscal por leaf (categoria folha), cobrindo trilhas de ICMS (intra/inter), PIS/COFINS e IBS/CBS/IS com QA automatizado e gatekeeper semântico antes de persistência no Supabase.

## Status atual

| Sprint | Escopo | Status |
|--------|--------|--------|
| Sprint 0 | Scaffold Next.js 14 + TypeScript + Tailwind + Supabase | ✅ Concluída |
| Sprint 1 | Dashboard real, AlertBanner, DashboardMetrics, Monitor + hash SHA-256 | ✅ Concluída |
| Sprint 2 | Integração real classifica-ai (métricas fiscais, evidências) | ✅ Concluída |
| Sprint 3 | API Estrutura Mercadológica (4.251 leaves reais) + ativação + backlog 41 tasks | ✅ Concluída |
| Sprint 4 | Piloto E2E com leaves reais + testes (61 passing) + build produção validado | ✅ Concluída |

## Stack
- Next.js 14 (App Router)
- TypeScript strict
- Tailwind CSS (dark mode first, design system Mission Control Pro)
- Radix UI + base shadcn/ui
- Supabase (`@supabase/supabase-js`)
- Lucide React
- `pg` (PostgreSQL para classifica_ai)
- Jest + ts-jest (61 testes passando)
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
CLASSIFICA_AI_URL=http://localhost:8000
CLASSIFICA_AI_EMAIL=admin@classifica.ai
CLASSIFICA_AI_PASSWORD=
CLASSIFICA_AI_PG_DSN=postgresql://user@localhost:5432/classifica_ai
```

Observação: se as chaves não estiverem configuradas, a aplicação usa fallback com dados mock para manter o dashboard funcional.

## Como rodar o piloto (Sprint 4)

O piloto ativa 3 leaves reais do classifica_ai e gera 41 tasks por leaf (123 total) no Supabase:

```bash
# Via script direto (requer .env.local configurado)
npx ts-node --project tsconfig.scripts.json scripts/pilot-leaves.ts

# Via API (com a aplicação rodando)
curl -X POST http://localhost:3000/api/pilot

# Via interface web
# Acessar http://localhost:3000/pilot → clicar em "Rodar piloto com 3 leaves"
```

O relatório JSON é salvo em `scripts/pilot-report.json`.

## Rodar testes

```bash
npm test                     # todos os testes (61 passing)
npm test -- --coverage       # com cobertura
```

## Validação de build

```bash
npm run build     # build de produção limpo
npm run lint      # zero warnings críticos
npx tsc --noEmit  # zero erros de tipo
```

## Arquitetura dos 3 sistemas integrados

```
┌─────────────────────────────────────────────────────────────────┐
│                        MapaDaLei (Next.js 14)                   │
│                                                                 │
│  ┌──────────────┐  ┌────────────────┐  ┌───────────────────┐   │
│  │  Dashboard   │  │  /mercadolog.  │  │  /pilot           │   │
│  │  (métricas   │  │  (4.251 leaves │  │  (piloto E2E      │   │
│  │   fiscais)   │  │   reais)       │  │   com 3 leaves)   │   │
│  └──────┬───────┘  └───────┬────────┘  └────────┬──────────┘   │
│         │                  │                    │              │
│  ┌──────▼───────────────────▼────────────────────▼──────────┐  │
│  │                    API Routes (Next.js)                   │  │
│  │  /api/fiscal/metrics    /api/mercadological/leaves        │  │
│  │  /api/fiscal/alerts     /api/mercadological/leaves/:id    │  │
│  │  /api/monitor           /api/pilot                        │  │
│  │  /api/proposals         /api/leaves  /api/tasks           │  │
│  └──────┬───────────────────────────────────────┬───────────┘  │
└─────────│───────────────────────────────────────│──────────────┘
          │                                       │
          ▼                                       ▼
┌─────────────────────┐                 ┌─────────────────────────┐
│   classifica-ai     │                 │   Supabase              │
│   (localhost:8000)  │                 │   (PostgreSQL cloud)    │
│                     │                 │                         │
│  • Métricas fiscais │                 │  • leaves               │
│  • Alertas legais   │                 │    (leaves ativas)      │
│  • 4.251 leaves     │                 │  • mc_tasks             │
│    (PostgreSQL)     │                 │    (backlog 41 tasks)   │
│  • Proposals API    │                 │  • mc_projects          │
└─────────────────────┘                 └─────────────────────────┘
```

## Backlog por leaf: 41 tasks

| Tipo | Count | Descrição |
|------|-------|-----------|
| UF_INTRA | 27 | Uma por estado brasileiro (AC, AL, ... TO) |
| UF_INTER | 12 | Pares interestaduais (SP→RJ, SP→MG, ...) |
| PISCOFINS | 1 | Regra PIS/COFINS federal |
| IBSCBSIS | 1 | Regra IBS/CBS/IS (Reforma Tributária) |
| **Total** | **41** | |

## Pipeline de QA + Gatekeeper

```
Proposta  →  runQA()  →  submitToGatekeeper()  →  singleWriter
               │                  │
           6 checks:          confidence:
           - schema válido     ≥ 0.8 → approved
           - confidence ≥ 0.6  ≥ 0.6 → rework
           - fontes válidas    < 0.6 → rejected
           - campos obrig.
           - vigência
           - owner_agent
```

## Páginas disponíveis

| Rota | Descrição |
|------|-----------|
| `/` | Dashboard com métricas fiscais reais |
| `/mercadological` | Estrutura mercadológica — 4.251 leaves |
| `/leaves` | Leaves ativas no Supabase |
| `/monitor` | Monitor legislativo com hash SHA-256 |
| `/pilot` | **Piloto E2E** — ativar leaves + ver tasks |

## Screenshots (placeholders)

- `docs/screenshots/dashboard.png` — Dashboard com métricas fiscais reais (classifica-ai) e AlertBanner
- `docs/screenshots/mercadological.png` — Lista de 4.251 leaves reais com filtro e paginação
- `docs/screenshots/pilot.png` — Página /pilot com botão de ativação e últimas 10 tasks criadas
- `docs/screenshots/monitor.png` — Monitor legislativo com detecção de mudança por hash SHA-256

## Qualidade

```bash
npm run lint          # ESLint sem warnings críticos
npm run typecheck     # TypeScript strict sem erros
npm run build         # Build de produção limpo
npm test              # 61 testes passando (5 suites)
```

## Testes (Sprint 4)

| Suite | Testes | Descrição |
|-------|--------|-----------|
| `qa-checker.test.ts` | 10 | runQA — validação de propostas |
| `evidence-store.test.ts` | 14 | Hash SHA-256 e normalização |
| `api-leaves.test.ts` | 10 | queryLeaves + queryLeafById (mock pg Pool) |
| `proposal-flow.test.ts` | 14 | runQA + gatekeeper fluxo completo |
| `coverage.test.ts` | 13 | generateLeafBacklog + checkLeafCompleteness |

## Git e entrega
- Commits semânticos por módulo/epic (`feat:`, `chore:`, `docs:`, `test:` etc.)
- Sprints como PRs limpos mergeados em `main`
