

# Plan: Confirmar modelo 2 tarefas/dia e ajustar Home

## Resumo

O codigo ja opera no modelo de 2 tasks (prayer + activity). As RPCs ja filtram `is_active = true` e calculam percentuais genericamente (`COUNT(checks)/COUNT(tasks)`). O Admin ja cria 2 tasks por dia. A unica mudanca real e na **Home (Index.tsx)**: remover os cards "Semana" e "Total" da secao de progresso, mantendo apenas "Hoy" e "Mes".

---

## Mudancas

### 1. `src/pages/Index.tsx` -- Secao Progresso

**O que muda:**
- Remover `{ label: "Semana", value: progress?.week_pct }` e `{ label: "Total", value: progress?.year_pct }` do array `progressItems`
- Manter apenas "Hoy" e "Mes"
- Mudar o grid de `grid-cols-2` (4 cards) para `grid-cols-2` (2 cards) -- mesma classe, menos itens
- O subtexto "x/2 hechas" ja funciona corretamente (usa `completedCount`/`totalTasks` dinamicamente)
- Aumentar a barra de progresso do "Hoy" de `h-1` para `h-2` para destaque visual

Linhas afetadas: 69-74 (array progressItems) e opcionalmente 122 (altura da barra).

### 2. Nenhuma mudanca no backend

As RPCs (`get_user_progress`, `get_month_calendar`, `get_year_calendar`, `calculate_user_score`, `update_user_streak`) ja estao corretas:
- Filtram `is_active = true`
- Calculam `COUNT(tc.id) / NULLIF(COUNT(t.id), 0) * 100` -- generico, funciona com 2 tasks
- day_pct: 0/2=0%, 1/2=50%, 2/2=100%

### 3. Nenhuma mudanca no Admin

`useCreateWeekWithDays` ja cria 2 tasks por dia (prayer + activity). `AdminDayTasks.tsx` ja edita exatamente 2 tasks. Validacao de legado ja existe.

---

## Criterios de aceite

- CA1: Home mostra apenas "Hoy" e "Mes" (sem "Semana" e "Total")
- CA2: Subtexto mostra "x/2 hechas"
- CA3: day_pct correto: 0%, 50%, 100%
- CA4: month_pct e week_pct usam formula generica (soma checks / soma tasks ativas)
- CA5: Admin continua criando/editando exatamente 2 tasks por dia

