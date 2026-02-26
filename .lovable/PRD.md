# Plan Renacer 365 — PRD Completo

> Documento gerado a partir do código-fonte como fonte de verdade.  
> Data: 2026-02-26

---

## 1. Visão Geral

**Plan Renacer 365** é um PWA de transformação pessoal diária para o mercado LatAm, estruturado como um programa de 10 meses (Março–Dezembro) com tarefas espirituais e de desenvolvimento pessoal. O app guia o usuário por um ciclo de Mês → Semana (Reto) → Dia, onde cada dia oferece exatamente 2 atividades: uma **Oración del día** (🙏🏼) e uma **Tarea del día** (🔥). O progresso é calculado em tempo real e gamificado com streaks, ranking e um "Depósito de Abundância".

**Para quem:** Público LatAm interessado em crescimento pessoal, espiritualidade e consistência de hábitos.

**Transformação prometida:** Consistência diária em 4 pilares (Cuerpo, Mente, Alma, Finanzas) ao longo de 10 meses, com acompanhamento visível de progresso e comunidade via ranking.

---

## 2. Mapa de Telas (Sitemap)

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/auth` | `Auth.tsx` | Login, registro e reset de senha |
| `/` | `Index.tsx` | **Home / Hoy** — tela principal do dia |
| `/calendario` | `CalendarioAno.tsx` | Calendário anual (Março–Dezembro) |
| `/calendario/:year/:month` | `CalendarioMes.tsx` | Calendário mensal com grid de dias |
| `/reto/:weekId` | `Reto.tsx` | Página do Reto semanal (blocos dinâmicos ou fallback legado) |
| `/reto/:weekId/dia/:dayNumber` | `Dia.tsx` | Detalhe do dia via Reto (por day number) |
| `/day/:dayId` | `DayDetail.tsx` | Detalhe do dia via Calendário (por day id) |
| `/cuaderno` | `Cuaderno.tsx` | Diário — Reflexões livres + Notas de tarefas |
| `/ranking` | `Ranking.tsx` | Leaderboard (fora do escopo) |
| `/perfil` | `Perfil.tsx` | Perfil do usuário (fora do escopo) |
| `/deposito` | `Deposito.tsx` | Depósito de Abundância — registro financeiro |
| `/semana` | `Semana.tsx` | Visão semanal (dados hardcoded — legado) |
| `/admin` | `Admin.tsx` | Painel admin — CRUD de Programas/Meses/Retos |
| `/admin/retos/:weekId/builder` | `RetoBuilder.tsx` | Construtor de blocos do Reto |
| `/admin/retos/:weekId/tareas` | `AdminDayTasks.tsx` | Editor de Oración/Tarea por dia |
| `*` | `NotFound.tsx` | 404 |

### Fluxo principal
```
Auth → Home (/) → Reto → Dia → check Oración/Tarea → Concluir Día → Diario
```

### Navegação inferior (BottomNav)
`Hoy` | `Calendario` | `Diario` | `Ranking` | `Perfil` | `Admin` (condicional)

---

## 3. Fluxos do Usuário

### 3.1 Fluxo Diário (Hoy)
```
Home (/)
├── Ver progresso (Dia/Semana/Mes/Total) via RPC get_user_progress
├── Hero do Reto ativo → CTA "Continuar hoy" → /reto/:weekId/dia/:dayNumber
├── Card "Recuperar ayer" (se ontem incompleto) → mesma rota do dia anterior
├── Seção "Hoy": 2 cards (DailyItemCard)
│   ├── 🙏🏼 Oración del día → Drawer com detalhe → check
│   └── 🔥 Tarea del día → Drawer com detalhe → check
├── "Concluir Día" (quando 2/2) → update_user_streak + calculate_user_score
└── Reflexión del día (JournalInput) → auto-save com debounce
```

### 3.2 Fluxo Semanal (Calendario → Reto → Dia)
```
CalendarioAno (/calendario)
├── Grid de meses (Março–Dezembro) com % progresso
└── Click → CalendarioMes (/calendario/:year/:month)
    ├── Macro del Mes (tema, áudio, vídeo)
    ├── Retos del mes (links para /reto/:weekId)
    └── Grid de dias por semana (dia real do mês, colorido por status)
        └── Click → DayDetail (/day/:dayId)
            ├── DailyItemCard (Oración + Tarea)
            ├── Concluir Día
            ├── JournalInput
            └── Playlists + Materiais
```

### 3.3 Fluxo do Reto
```
Reto (/reto/:weekId)
├── Se tem week_blocks → renderiza blocos dinâmicos (hero, audio, video, text, cronograma, playlists, resources, days_map)
├── Se não tem blocos → fallback legado (cover, audio, cronograma, lista de dias)
├── Lista de dias com progresso (tasks_completed/tasks_total)
├── CTA fixo "Continuar Hoy — Día N"
└── Lecturas (content_items)
```

### 3.4 Fluxo de Escrita (Diario)
```
Cuaderno (/cuaderno)
├── Toggle: Diario (default) | Notas de tareas
├── Busca por texto + filtro por mês
├── Agrupamento: Mês → Semana → entradas
├── Diario: entradas de journal_entries (via JournalInput)
└── Notas: notas de task_notes vinculadas a tarefas
```

### 3.5 Fluxo do Depósito de Abundância
```
Perfil → DepositCard → /deposito
├── Listar depósitos do usuário
├── Novo depósito (modal: amount, currency, note)
└── Deletar depósito
```

---

## 4. Regras de Negócio

### 4.1 Unlock de Dias
- Cada dia tem `unlock_date` na tabela `days`
- O dia fica desbloqueado quando `unlock_date <= hoje`
- Usado em: `Reto.tsx` (disabled se locked), `get_user_progress` (filtro `d.unlock_date <= p_date`), `get_week_days_progress` (campo `is_unlocked`)

### 4.2 Cálculo de Progresso
Feito inteiramente pelo RPC `get_user_progress`:
- **Day %**: `COUNT(checks) / NULLIF(COUNT(active_tasks), 0) * 100`
- **Week %**: média dos day_pct dos dias desbloqueados da semana ativa
- **Month %**: média dos week_pct das semanas do mês
- **Year %**: média dos month_pct de todos os meses do programa
- Apenas tasks com `is_active = true` são contabilizadas

### 4.3 Definição de "Completo"
- Dia completo: `tasks_completed = tasks_total` (com `tasks_total` = número de tasks ativas, atualmente 2)
- No front: `allCompleted = totalTasks > 0 && completedCount >= totalTasks`

### 4.4 Semana Ativa
- Somente 1 semana pode ter `status = 'active'` por vez
- `useActivateWeek` define a semana selecionada como `active` e todas as outras como `published`
- `useCurrentWeekData` busca primeiro a semana ativa, e faz fallback por data

### 4.5 Timezone
- RPCs usam `America/Sao_Paulo`: `v_today := (now() AT TIME ZONE 'America/Sao_Paulo')::date`
- `useYesterdayData` usa `Intl.DateTimeFormat` com `timeZone: "America/Sao_Paulo"`
- `Index.tsx` formata a data com `es-ES` (locale espanhol) para exibição

### 4.6 Streaks
- RPC `update_user_streak`: conta dias consecutivos completos de trás para frente a partir de hoje
- Armazena `current_streak`, `max_streak`, `last_completed_date` em `user_streaks`

### 4.7 Scoring / Ranking
- RPC `calculate_user_score`: 1 ponto por task completa + 2 bônus por dia completo + 10 bônus por semana completa (7/7 dias)
- Calculado por período (week/month/year) e armazenado em `leaderboard_scores`
- `get_leaderboard`: retorna top 20 por período

### 4.8 Constraint de Unicidade
- `task_checks` tem constraint `UNIQUE(user_id, task_id)` para evitar checks duplicados
- Front trata erro `23505` silenciosamente em `useDayTasks.ts`

---

## 5. Modelo de Dados

### 5.1 `programs`
| Coluna | Tipo | Uso |
|--------|------|-----|
| id | uuid PK | FK de months |
| name | text | "Plan Renacer 365" |
| year | int | 2026 |
| start_date, end_date | date | Período do programa |
- **Queries**: `usePrograms()` (admin), `get_user_progress` (via months → program_id)

### 5.2 `months`
| Coluna | Tipo | Uso |
|--------|------|-----|
| id | uuid PK | FK de weeks |
| program_id | uuid FK→programs | Relação com programa |
| number | int | 3–12 (Março–Dezembro) |
| name | text | Nome do mês |
| theme | text? | Tema do Macro |
| macro_text | text? | Texto explicativo do Macro |
| audio_url, video_url | text? | Materiais do Macro |
- **Queries**: `useMonths()` (admin), `CalendarioMes.tsx` (macro card), `get_year_calendar`, `get_user_progress`

### 5.3 `weeks`
| Coluna | Tipo | Uso |
|--------|------|-----|
| id | uuid PK | FK de days, week_blocks |
| month_id | uuid FK→months | Relação com mês |
| number | int | Número da semana |
| name | text | Nome do Reto (ex: "Encontrando mi propósito") |
| status | text | `'active'` / `'published'` |
| objective | text? | Objetivo do reto |
| cover_url, audio_url, schedule_image_url, schedule_pdf_url | text? | Assets |
| description_long | text? | Descrição extendida |
| spiritual_playlist_url, mental_playlist_url | text? | URLs Spotify |
- **Queries**: `useWeeks()`, `useCurrentWeekData()`, `useRetoData()`, `Dia.tsx`, `DayDetail.tsx`

### 5.4 `days`
| Coluna | Tipo | Uso |
|--------|------|-----|
| id | uuid PK | FK de tasks, task_checks, task_notes |
| week_id | uuid FK→weeks | Relação com semana |
| number | int | 1–7 |
| date | date | Data real do dia |
| unlock_date | date | Quando o dia desbloqueia |
- **Queries**: `useDayTasks()`, `get_user_progress`, `get_month_calendar`, `get_week_days_progress`

### 5.5 `tasks`
| Coluna | Tipo | Uso |
|--------|------|-----|
| id | uuid PK | FK de task_checks, task_notes |
| day_id | uuid FK→days | Relação com dia |
| title | text | Texto da tarefa |
| description | text? | Explicação detalhada |
| task_kind | text | `'prayer'` / `'activity'` |
| category | enum | `cuerpo` / `mente` / `alma` / `finanzas` |
| is_active | bool | Flag de ativação (false para legados) |
| order | int | Ordem de exibição |
- **Queries**: `useDayTasks()`, RPCs de progresso, `AdminDayTasks.tsx`
- **Mutations**: Admin upsert (insert/update por kind)

### 5.6 `task_checks`
| Coluna | Tipo | Uso |
|--------|------|-----|
| id | uuid PK | — |
| user_id | uuid | Usuário que completou |
| task_id | uuid FK→tasks | Tarefa completada |
| day_id | uuid FK→days | Dia (desnormalizado) |
| checked_at | timestamptz | Quando foi marcada |
- **Constraint**: `UNIQUE(user_id, task_id)`
- **Queries**: `useDayTasks()`, todas as RPCs de progresso
- **Mutations**: `useToggleDayTask()` (insert/delete)

### 5.7 `task_notes`
| Coluna | Tipo | Uso |
|--------|------|-----|
| id | uuid PK | — |
| user_id, task_id, day_id | uuid | Relações |
| content | text | Nota do usuário |
- **Queries**: `useTaskNotes()`, `useAllNotes()` (Cuaderno)
- **Mutations**: `useSaveNote()` (upsert)

### 5.8 `journal_entries`
| Coluna | Tipo | Uso |
|--------|------|-----|
| id | uuid PK | — |
| user_id | uuid | Autor |
| date | date | Data da reflexão |
| content | text | Texto livre |
| day_id, week_id, month_id | uuid? | Contexto |
- **Queries**: `useJournalEntry()`, `useAllJournalEntries()` (Cuaderno)
- **Mutations**: `useSaveJournal()` (upsert por user_id + date)

### 5.9 `week_blocks`
| Coluna | Tipo | Uso |
|--------|------|-----|
| id | uuid PK | — |
| week_id | uuid FK→weeks | Reto associado |
| type | text | hero/audio/video/text/cronograma/playlists/resources/days_map |
| title | text? | Título do bloco |
| config | jsonb | Configuração dinâmica |
| order_index | int | Posição |
| is_visible | bool | Visibilidade |
- **Queries**: `useWeekBlocks(weekId)` → `BlockRenderer` → blocos específicos
- **Mutations**: `useCreateBlock()`, `useUpdateBlock()`, `useDeleteBlock()`, `useReorderBlocks()`

### 5.10 Outras tabelas
| Tabela | Uso |
|--------|-----|
| `profiles` | display_name, avatar_url (criado automaticamente via trigger) |
| `user_roles` | role admin/user (via `has_role` RPC) |
| `user_streaks` | current_streak, max_streak |
| `leaderboard_scores` | score por período (week/month/year) |
| `abundance_deposits` | Depósito de Abundância |
| `announcements` / `announcement_reads` | Comunicados do admin |
| `content_items` | Lecturas (PDFs, links) por dia |

---

## 6. RPCs / SQL

| RPC | Inputs | Output | Chamada no Front | Impacto |
|-----|--------|--------|-----------------|---------|
| `get_user_progress` | `p_user_id`, `p_date?` | `{day_id, day_pct, week_pct, month_pct, year_pct, day_number, week_name, month_theme}` | `useTodayData.ts → useProgress()` → `Index.tsx` | Progresso principal |
| `get_month_calendar` | `p_user_id`, `p_month_id` | `[{day_id, date, week_id, day_number, week_name, week_number, day_pct, status}]` | `CalendarioMes.tsx` | Grid mensal |
| `get_year_calendar` | `p_user_id`, `p_year` | `[{month_id, month_number, month_name, month_theme, month_pct}]` | `CalendarioAno.tsx` | Grid anual |
| `get_week_days_progress` | `p_user_id`, `p_week_id` | `[{id, number, date, unlock_date, tasks_total, tasks_completed, is_unlocked, is_today}]` | `useRetoData.ts` | Reto semanal |
| `update_user_streak` | `p_user_id` | `{current_streak, max_streak}` | `Index.tsx`, `Dia.tsx`, `DayDetail.tsx` (botão Concluir) | Streaks |
| `calculate_user_score` | `p_user_id`, `p_period_type`, `p_period_key` | `{score, days_completed, weeks_completed}` | `useLeaderboard.ts → useCalculateScore()` | Ranking |
| `get_leaderboard` | `p_period_type`, `p_period_key`, `p_limit` | `[{user_id, display_name, score, ...}]` | `Ranking.tsx` | Ranking |
| `has_role` | `_user_id`, `_role` | `boolean` | `useIsAdmin()` | Controle de acesso |

---

## 7. Front-end: Arquitetura

### 7.1 Estrutura de Pastas
```
src/
├── pages/          # 16 telas (rotas)
├── components/     # Componentes reutilizáveis
│   ├── blocks/     # 8 blocos dinâmicos para week_blocks
│   └── ui/         # shadcn/ui (40+ componentes)
├── hooks/          # 15 hooks de dados (React Query)
├── integrations/supabase/  # client.ts + types.ts (auto-gerados)
└── lib/            # utils.ts (cn helper)
```

### 7.2 Principais Hooks e Query Keys

| Hook | Arquivo | Query Keys |
|------|---------|------------|
| `useProgress` | `useTodayData.ts` | `["progress", userId]` |
| `useDayTasks` | `useDayTasks.ts` | `["day-tasks", dayId, userId]` |
| `useToggleDayTask` | `useDayTasks.ts` | Invalida: day-tasks, reto, progress, today-tasks, calendars |
| `useCurrentWeekData` | `useCurrentWeekData.ts` | `["current-week-data"]` |
| `useRetoData` | `useRetoData.ts` | `["reto", weekId, userId]` |
| `useYesterdayProgress` | `useYesterdayData.ts` | `["yesterday-progress", userId]` |
| `useWeekBlocks` | `useWeekBlocks.ts` | `["week-blocks", weekId]` |
| `useJournalEntry` | `useJournal.ts` | `["journal_entry", userId, date]` |
| `useAllJournalEntries` | `useJournal.ts` | `["journal_list", userId]` |
| `useAllNotes` | `useTaskNotes.ts` | `["all-notes", userId]` |
| `useLeaderboard` | `useLeaderboard.ts` | `["leaderboard", periodType, periodKey]` |
| `useIsAdmin` | `useAdmin.ts` | `["is-admin", userId]` |
| `useDeposits` | `useDeposits.ts` | (não analisado) |
| `useAnnouncements` | `useAnnouncements.ts` | (não analisado) |

### 7.3 Padrões de UI
- **Dark premium**: fundo `230 38% 7%`, cards glass com blur, bordas sutis
- **Acento dourado**: gradiente `gold-gradient` (HSL 43°), glow e shimmer
- **Tipografia**: Inter (body) + Playfair Display (headings)
- **Tokens**: tudo via CSS vars (`--primary`, `--background`, etc.) em `index.css`
- **Componentes**: shadcn/ui customizado (Drawer para detalhes, Dialog para modais)
- **Animações**: `press-scale`, `shimmer`, `pulse-gold`, `animate-count-up`
- **PWA**: `vite-plugin-pwa` instalado (manifest não analisado)

---

## 8. Admin

### 8.1 Telas Existentes

#### `/admin` — Painel Principal (`Admin.tsx`)
- Tab "Contenido": CRUD de Programs → Months → Weeks/Retos
- Tab "Comunicados": CRUD de Announcements
- Para cada Week: botões para Builder (🔧) e Tareas (📖)
- Ações por Week: Activar, Ajustar fechas, Upload de assets
- **⚠️ Problema**: `useCreateWeekWithDays` cria **5 tarefas genéricas** ("Momento 1–5") por dia — legado do modelo antigo

#### `/admin/retos/:weekId/builder` — Construtor de Blocos (`RetoBuilder.tsx`)
- CRUD de week_blocks: add, edit (config JSON), reorder, toggle visibility, delete
- 8 tipos: hero, audio, video, text, cronograma, playlists, resources, days_map

#### `/admin/retos/:weekId/tareas` — Editor de Tarefas do Dia (`AdminDayTasks.tsx`)
- Seletor horizontal de dias por data
- 2 editores: Oración (prayer) e Tarea (activity)
- Campos: título (min 5 chars), descrição, pilar (só activity)
- Upsert: update se existir, insert se não
- "Desactivar todas" para tarefas legacy
- Invalidação de caches ao salvar

### 8.2 O que falta
- `useCreateWeekWithDays` ainda cria 5 tasks "Momento X" (deveria criar 2: 1 prayer + 1 activity)
- Não há edição de Macro del Mes (macro_text, audio_url, video_url) no admin
- Não há gerenciamento de `content_items` (Lecturas) no admin

---

## 9. Gap Analysis

### P0 — Crítico

| # | Gap | Como está | Como deveria ser | Arquivos | Impacto |
|---|-----|-----------|-------------------|----------|---------|
| 1 | **useCreateWeekWithDays cria 5 tasks** | Cria 5 "Momento X" por dia | Criar 2 tasks: 1 prayer (order 0, category alma) + 1 activity (order 1, category cuerpo) | `src/hooks/useAdmin.ts` L124-133 | Admin cria dados inconsistentes ao criar retos novos |
| 2 | **Semana.tsx é hardcoded** | Dados estáticos, não conectado ao DB | Deveria ser removido ou redirecionado para `/reto/:weekId` | `src/pages/Semana.tsx` | Tela inútil / confusa |
| 3 | **calculate_user_score não filtra is_active** | Conta todas as tasks (ativas e inativas) | Adicionar `AND t.is_active = true` nos JOINs | RPC `calculate_user_score` | Score/Ranking incorretos se existirem tasks legacy |

### P1 — Importante

| # | Gap | Como está | Como deveria ser | Arquivos | Impacto |
|---|-----|-----------|-------------------|----------|---------|
| 4 | **update_user_streak não filtra is_active** | Conta todas as tasks no streak | Adicionar `AND t.is_active = true` | RPC `update_user_streak` | Streak incorreto |
| 5 | **Sem edição de Macro del Mes no Admin** | macro_text/audio_url/video_url editáveis apenas via DB | Admin deveria ter editor para dados do mês | `src/pages/Admin.tsx` | Admin incompleto |
| 6 | **Sem CRUD de content_items (Lecturas)** | Lecturas são exibidas mas não podem ser criadas/editadas | Adicionar editor no Admin ou no Builder | `src/pages/Reto.tsx`, `src/pages/Dia.tsx` | Conteúdo manual via DB |
| 7 | **Link morto: /lecturas** | `Reto.tsx` e `Dia.tsx` linkam para `/lecturas` que não existe | Criar rota ou remover links | `src/pages/Reto.tsx` L102, L252 | 404 ao clicar |

### P2 — Nice to Have

| # | Gap | Como está | Como deveria ser | Arquivos | Impacto |
|---|-----|-----------|-------------------|----------|---------|
| 8 | **Validação de 2 tasks ativas por dia** | Nenhuma validação no DB | Trigger ou check que impeça > 1 prayer ou > 1 activity ativa por dia | Migration SQL | Integridade de dados |
| 9 | **PWA manifest/service worker** | `vite-plugin-pwa` instalado mas manifest não verificado | Verificar icons, name, theme_color, offline caching | `vite.config.ts` | Experiência PWA |
| 10 | **DailyChecklist.tsx é legacy** | Componente existe mas não é importado | Pode ser removido | `src/components/DailyChecklist.tsx` | Código morto |
| 11 | **ProgressRing.tsx não utilizado** | Componente existe na pasta | Verificar se é usado ou remover | `src/components/ProgressRing.tsx` | Código morto |
| 12 | **MiniRanking.tsx não utilizado na Home** | Existe mas não aparece na Home atual | Poderia ser adicionado à Home como preview do ranking | `src/components/MiniRanking.tsx` | Feature não aproveitada |

---

## 10. Plano de Execução

### Sprint 1: Core Fixes (1–2 dias)

**Objetivo:** Corrigir inconsistências de dados e RPCs.

| Task | Detalhe |
|------|---------|
| Fix `useCreateWeekWithDays` | Alterar para criar 2 tasks (1 prayer + 1 activity) por dia em vez de 5 |
| Fix RPC `calculate_user_score` | Adicionar `AND t.is_active = true` em todos os JOINs de tasks |
| Fix RPC `update_user_streak` | Adicionar `AND t.is_active = true` |
| Remover/redirecionar `Semana.tsx` | Rota `/semana` → redirecionar para `/` ou remover |
| Remover código morto | `DailyChecklist.tsx`, `ProgressRing.tsx` (se não usado), imports órfãos |

**Critérios de aceite:**
- [ ] Novo reto criado no admin tem exatamente 2 tasks por dia (1 prayer + 1 activity)
- [ ] Score e streak calculam corretamente ignorando tasks inativas
- [ ] `/semana` não mostra dados hardcoded

### Sprint 2: Admin & Conteúdo (2–3 dias)

**Objetivo:** Completar ferramentas administrativas.

| Task | Detalhe |
|------|---------|
| Editor de Macro del Mes | No Admin, permitir editar theme, macro_text, audio_url, video_url do mês |
| CRUD de Lecturas (content_items) | Adicionar editor no AdminDayTasks ou separado |
| Validação DB: max 2 tasks ativas/dia | Trigger que impede > 1 prayer ou > 1 activity ativa por dia |
| Fix links /lecturas | Criar rota de lecturas ou remover links mortos |

**Critérios de aceite:**
- [ ] Admin edita Macro do Mês sem tocar no DB diretamente
- [ ] Admin adiciona Lecturas por dia
- [ ] Não é possível ter 2 prayers ativas no mesmo dia
- [ ] Nenhum link retorna 404

### Sprint 3: Polish & PWA (1–2 dias)

**Objetivo:** Polimento final e otimização.

| Task | Detalhe |
|------|---------|
| Configurar PWA manifest | Verificar icons, theme_color, start_url, offline |
| Adicionar MiniRanking à Home | Preview compacto do ranking na Home |
| Revisar timezone consistency | Garantir que todas as queries usam America/Sao_Paulo |
| Limpeza de código | Remover componentes não usados, consolidar tipos |
| Testes e2e | Verificar fluxo completo: criar reto → editar tasks → completar dia → ver progresso |

**Critérios de aceite:**
- [ ] App instalável como PWA com ícone correto
- [ ] Home mostra preview do ranking
- [ ] Fluxo completo funciona sem erros

---

## Arquivos-Chave (Quick Reference)

| Área | Arquivo |
|------|---------|
| **Rotas** | `src/App.tsx` |
| **Home** | `src/pages/Index.tsx` |
| **Reto** | `src/pages/Reto.tsx` |
| **Dia** | `src/pages/Dia.tsx`, `src/pages/DayDetail.tsx` |
| **Calendário** | `src/pages/CalendarioAno.tsx`, `src/pages/CalendarioMes.tsx` |
| **Diário** | `src/pages/Cuaderno.tsx` |
| **Admin** | `src/pages/Admin.tsx`, `src/pages/AdminDayTasks.tsx`, `src/pages/RetoBuilder.tsx` |
| **Card reutilizável** | `src/components/DailyItemCard.tsx` |
| **Journaling** | `src/components/JournalInput.tsx` |
| **Blocos dinâmicos** | `src/components/BlockRenderer.tsx`, `src/components/blocks/*` |
| **Nav** | `src/components/BottomNav.tsx` |
| **Progresso** | `src/hooks/useTodayData.ts` (useProgress) |
| **Tasks do dia** | `src/hooks/useDayTasks.ts` |
| **Reto data** | `src/hooks/useRetoData.ts` |
| **Yesterday** | `src/hooks/useYesterdayData.ts` |
| **Admin hooks** | `src/hooks/useAdmin.ts` |
| **Week blocks** | `src/hooks/useWeekBlocks.ts` |
| **Journal** | `src/hooks/useJournal.ts` |
| **Task notes** | `src/hooks/useTaskNotes.ts` |
| **Leaderboard** | `src/hooks/useLeaderboard.ts` |
| **Design tokens** | `src/index.css` |
| **DB types** | `src/integrations/supabase/types.ts` |
