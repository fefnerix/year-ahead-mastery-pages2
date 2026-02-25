

# Fix "Recuperar Ayer" — Timezone-safe + Context-aware

## Problema

O hook `useYesterdayProgress` tem dois bugs:

1. Usa `toISOString().split("T")[0]` que converte para UTC, causando off-by-one em America/Sao_Paulo (ex: 23h SP = dia seguinte UTC)
2. Faz `.eq("date", dateStr)` buscando exatamente "ontem UTC" sem considerar a semana ativa nem `unlock_date`

## Solucao

Reescrever a query do hook para:
- Usar `Intl.DateTimeFormat` com timezone America/Sao_Paulo para obter a data local correta
- Buscar o ultimo dia desbloqueado ANTES de hoje, dentro da semana ativa
- Manter a mesma interface de retorno e o mesmo comportamento de ocultar quando completo

## Arquivo alterado

**Apenas** `src/hooks/useYesterdayData.ts`

O render em `Index.tsx` ja faz `{yesterday && (...)}`, entao nao precisa mudar.

## Implementacao

### 1. Helper de data local

```typescript
const getTodaySP = (): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
```

`en-CA` retorna formato `YYYY-MM-DD` nativamente.

### 2. Query reescrita

Em vez de `.eq("date", dateStr)` com data UTC:

1. Buscar a semana ativa: `weeks.status = 'active'`
2. Buscar o ultimo dia desbloqueado antes de hoje:
   - `.eq("week_id", activeWeekId)`
   - `.lt("unlock_date", todaySP)` (estritamente antes de hoje)
   - `.order("number", { ascending: false })`
   - `.limit(1)`
3. Buscar tasks e checks como ja faz
4. Se completo (checks >= total) ou sem tasks: retornar `null`

### 3. Logica de "completude" usa TOTAL_TASKS_PER_DAY = 5

Consistente com a regra global: so oculta "Ayer" se `completed >= 5` (nao `tasks.length`).

## Codigo final do hook

```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const TOTAL_TASKS_PER_DAY = 5;

const getTodaySP = (): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

interface YesterdayData {
  day_id: string;
  day_number: number;
  week_id: string;
  week_name: string;
  completed_count: number;
  total_count: number;
}

export function useYesterdayProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["yesterday-progress", user?.id],
    queryFn: async (): Promise<YesterdayData | null> => {
      const todaySP = getTodaySP();

      // 1) Semana ativa
      const { data: activeWeek, error: weekErr } = await supabase
        .from("weeks")
        .select("id, name")
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (weekErr) throw weekErr;
      if (!activeWeek) return null;

      // 2) Ultimo dia desbloqueado ANTES de hoje
      const { data: day, error: dayErr } = await supabase
        .from("days")
        .select("id, number, week_id")
        .eq("week_id", activeWeek.id)
        .lt("unlock_date", todaySP)
        .order("number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dayErr) throw dayErr;
      if (!day) return null;

      // 3) Tasks e checks
      const [{ data: tasks }, { data: checks }] = await Promise.all([
        supabase.from("tasks").select("id").eq("day_id", day.id),
        supabase
          .from("task_checks")
          .select("id")
          .eq("day_id", day.id)
          .eq("user_id", user!.id),
      ]);

      const total = tasks?.length ?? 0;
      const completed = checks?.length ?? 0;

      // Ocultar se completo (regra 5/5) ou sem tasks
      if (completed >= TOTAL_TASKS_PER_DAY) return null;
      if (total === 0) return null;

      return {
        day_id: day.id,
        day_number: day.number,
        week_id: day.week_id,
        week_name: activeWeek.name ?? "",
        completed_count: completed,
        total_count: total,
      };
    },
    enabled: !!user,
  });
}
```

## O que NAO muda

- `Index.tsx` — ja renderiza condicionalmente com `{yesterday && (...)}`
- Nenhuma tabela/RLS/RPC nova
- Nenhum estado global novo
- Query key permanece `["yesterday-progress", userId]`

## Resumo de impacto

| Aspecto | Antes | Depois |
|---|---|---|
| Timezone | UTC (off-by-one) | America/Sao_Paulo |
| Contexto | Qualquer dia no banco | Semana ativa apenas |
| Filtro | `.eq("date", ontemUTC)` | `.lt("unlock_date", hojeSP)` ordenado desc |
| Completude | `completed >= tasks.length` | `completed >= 5` (regra global) |
| Queries | 4 sequenciais | 2 seq + 2 paralelas |
