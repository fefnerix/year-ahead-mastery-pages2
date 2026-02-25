

# Regra "5 tarefas por dia" para calculo de progresso

## Problema

O app calcula `day_pct` e "Perfect Day" usando `tasks.length` como denominador. Se um dia tiver 4 ou 6 tarefas (seed incompleto/incorreto), o calculo fica errado: 4/4 = 100% quando deveria ser 4/5 = 80%.

## Solucao

Introduzir constante `TOTAL_TASKS_PER_DAY = 5` e usar como denominador fixo em todos os calculos de progresso e Perfect Day.

---

## Arquivos a alterar

### 1. `src/pages/Index.tsx`

Mudancas pontuais nas linhas de calculo (linhas 42-51) e nos contadores exibidos na UI:

**Calculos (substituir linhas 42-51):**
```typescript
const TOTAL_TASKS_PER_DAY = 5;

const completedCount = tasks.filter((t) => t.completed).length;
const dayProgress = Math.min(100, Math.max(0, Math.round((completedCount / TOTAL_TASKS_PER_DAY) * 100)));
const allCompleted = completedCount >= TOTAL_TASKS_PER_DAY;

// Warn if tasks count is unexpected (dev/admin only)
if (tasks.length > 0 && tasks.length !== TOTAL_TASKS_PER_DAY) {
  console.warn('[Admin] Day has tasks.length != 5', { dayId: progress?.day_id, tasksLength: tasks.length });
}

const softComplete = completedCount >= 3;
const momento5Task = tasks.find((t) => t.order === 5);
const momento5HasNote = momento5Task ? !!localNotes[momento5Task.id]?.trim() : false;
const isPerfectDay = completedCount >= TOTAL_TASKS_PER_DAY && momento5HasNote;
```

**Contadores na UI:**
- Linha 104 (header): `{completedCount}/{tasks.length}` -> `{completedCount}/{TOTAL_TASKS_PER_DAY}`
- Linha 210-212 (secao titulo): manter `{completedCount}/{TOTAL_TASKS_PER_DAY}`

**Fallback discreto (dev only):**
Apos o contador da secao de momentos, adicionar:
```typescript
{import.meta.env.DEV && tasks.length > 0 && tasks.length !== TOTAL_TASKS_PER_DAY && (
  <span className="text-[9px] text-muted-foreground/40 ml-2">⚠ {tasks.length} cfg</span>
)}
```

### 2. `src/pages/Dia.tsx`

Mesma logica, aplicada nas linhas 57-59:

**Calculos:**
```typescript
const TOTAL_TASKS_PER_DAY = 5;

const completedCount = tasks.filter((t) => t.completed).length;
const dayProgress = Math.min(100, Math.max(0, Math.round((completedCount / TOTAL_TASKS_PER_DAY) * 100)));
const allCompleted = completedCount >= TOTAL_TASKS_PER_DAY;

if (tasks.length > 0 && tasks.length !== TOTAL_TASKS_PER_DAY) {
  console.warn('[Admin] Day has tasks.length != 5', { dayId, tasksLength: tasks.length });
}
```

**Contadores na UI:**
- Linha 104: `{completedCount}/{tasks.length}` -> `{completedCount}/{TOTAL_TASKS_PER_DAY}`
- Linha 113: idem

**Botao "Concluir Dia" (linha 125):**
- Mudar condicao de `allCompleted` para `completedCount >= TOTAL_TASKS_PER_DAY` (ja coberto pela nova definicao de `allCompleted`)

**Fallback dev (ao lado do contador no header):**
```typescript
{import.meta.env.DEV && tasks.length > 0 && tasks.length !== TOTAL_TASKS_PER_DAY && (
  <span className="text-[9px] text-muted-foreground/40 ml-1">⚠ {tasks.length} cfg</span>
)}
```

---

## O que NAO muda

- Nenhuma tabela nova
- Nenhuma RLS alterada
- Nenhum hook novo ou estado global
- `DailyChecklist.tsx` continua renderizando as tasks que recebe (sem mudanca)
- Invalidacoes React Query ja existentes (`useToggleDayTask.onSettled` ja invalida `["progress"]`) -- nada a fazer
- O RPC `get_user_progress` no backend continua calculando com base nas tasks reais do banco -- a normalizacao aqui e apenas no frontend para UI/Perfect Day

## Resumo de impacto

| Ponto | Antes | Depois |
|---|---|---|
| Dia com 4 tasks, 4 feitas | 100%, Perfect Day possivel | 80%, Perfect Day impossivel |
| Dia com 5 tasks, 5 feitas | 100%, Perfect Day se nota | 100%, Perfect Day se nota |
| Dia com 6 tasks, 5 feitas | 83%, nao Perfect | 100%, Perfect Day se nota |
| Contador UI | "4/4" | "4/5" |
| Console warn | nenhum | warn em dev |
| Badge UI | nenhum | "⚠ 4 cfg" em dev only |
