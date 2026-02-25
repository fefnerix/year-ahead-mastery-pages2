

# Secao "Progreso" no Home/Hoy

## O que muda

Adicionar uma secao fixa "Progreso" com 4 cards compactos no Home, entre o greeting e o hero do reto. Os dados vem do hook `useProgress()` que ja existe e ja retorna percentuais 0-100.

## Arquivo alterado

**Apenas** `src/pages/Index.tsx` — nenhum outro arquivo precisa ser tocado.

## Por que so 1 arquivo

- `useProgress()` ja retorna `day_pct`, `week_pct`, `month_pct`, `year_pct` (0-100, inteiros)
- `useToggleDayTask` ja invalida `["progress"]` no `onSettled` (linha 82 de `useDayTasks.ts`), entao os cards atualizam automaticamente ao marcar/desmarcar tarefas
- Nao precisa de novo hook, novo estado global, nem nova query

## Detalhes da implementacao

### 1. Helper de clamp/format

Funcao inline no componente:

```typescript
const clampPct = (v: number | null | undefined) =>
  Math.min(100, Math.max(0, Math.round(v ?? 0)));
```

### 2. Secao "Progreso"

Posicao: logo apos o greeting (linha 109), antes do hero do reto.

Estrutura:
- Titulo: `<h2 className="section-title">Progreso</h2>`
- Grid 2x2 mobile (`grid grid-cols-2 gap-3`)
- 4 cards: Hoy (`day_pct`), Semana (`week_pct`), Mes (`month_pct`), Total (`year_pct`)

### 3. Card individual

Cada card usa o padrao `glass-card` ja existente no app:

```text
+------------------+
| Hoy              |  <- label (text-xs, muted)
| 72%              |  <- valor (text-2xl, bold, primary)
+------------------+
```

Classes: `glass-card rounded-2xl p-4 border border-primary/10`

### 4. Loading state

Quando `progressLoading` e true, mostra 4 skeletons com `animate-pulse rounded-2xl bg-muted h-20` no mesmo grid, sem pular layout.

### 5. Atualizacao imediata

Ja funciona: `useToggleDayTask.onSettled` invalida `["progress"]`, que e a query key de `useProgress()`. Nada a fazer aqui.

## Resultado visual (mobile)

```text
Hola, {name}

Progreso
+--------+  +--------+
|  Hoy   |  | Semana |
|  60%   |  |  45%   |
+--------+  +--------+
+--------+  +--------+
|  Mes   |  | Total  |
|  30%   |  |  12%   |
+--------+  +--------+

[Hero do reto]
...
```

## Definition of Done

- 4 cards sempre visiveis no Home com percentuais 0-100%
- Clamp e arredondamento aplicados
- Loading skeleton sem layout shift
- Atualiza ao marcar/desmarcar tarefa (ja coberto pela invalidation existente)
- Dark premium, mobile-first, sem textos redundantes
