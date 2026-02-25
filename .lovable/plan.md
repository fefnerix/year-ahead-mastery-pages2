

# Plan: Migrar Home e RPCs para modelo de 2 tasks (Oracion + Tarea)

Este plano cobre os 13 prompts em uma implementacao coerente e sequencial.

---

## Resumo das mudancas

O app atualmente assume 5 tarefas por dia em varios lugares (Home, RPCs, hooks). Vamos migrar tudo para o modelo de 2 tasks ativas (1 prayer + 1 activity), criar um componente reutilizavel `DailyItemCard`, limpar a Home, corrigir RPCs e adicionar constraint de unicidade em task_checks.

---

## Fase 1: Corrigir RPCs no banco de dados (Prompts 4, 5, 6)

Criar uma migration com 3 funcoes atualizadas:

### 1.1 `get_month_calendar` 
- Remover hardcode `/5`
- Filtrar `t.is_active = true` nos JOINs de tasks
- `day_pct = ROUND(COUNT(tc.id) / NULLIF(COUNT(t.id), 0) * 100)`
- Status: `complete` quando `COUNT(tc.id) = COUNT(t.id) AND COUNT(t.id) > 0`

### 1.2 `get_user_progress`
- Adicionar `AND t.is_active = true` em todos os trechos (day, week, month, year)
- Remover qualquer hardcode de 5

### 1.3 `get_year_calendar`
- Adicionar `AND t.is_active = true` nos JOINs de tasks

---

## Fase 2: Constraint de unicidade em task_checks (Prompt 12)

Na mesma migration:
```text
ALTER TABLE public.task_checks
  ADD CONSTRAINT task_checks_user_task_unique UNIQUE (user_id, task_id);
```

Isso previne checks duplicados por cliques rapidos.

---

## Fase 3: RPC para Reto sem N+1 (Prompt 8)

Criar funcao `get_week_days_progress(p_user_id uuid, p_week_id uuid)` que retorna todos os dias da semana com `tasks_total` (ativas), `tasks_completed`, `is_unlocked`, `is_today` em uma unica query.

---

## Fase 4: Componente reutilizavel DailyItemCard (Prompt 10)

Criar `src/components/DailyItemCard.tsx`:
- Props: `task: TaskWithCheck | null`, `type: "prayer" | "activity"`, `onToggle: (id) => void`
- Renderiza card com icone (BookOpen/Target), titulo, descricao, badge de categoria (se activity), botao de check
- Se task for null, mostra "No disponible"
- Drawer (vaul) abre ao clicar no card mostrando detalhes + botao de marcar

---

## Fase 5: Reescrever Home/Index.tsx (Prompts 1, 2, 3)

### Remover:
- `TOTAL_TASKS_PER_DAY = 5`
- Secao "Tus 5 momentos de hoy" inteira (barra de progresso, DailyChecklist, mensagens de Perfect Day)
- Secao "Ahora -- Next Best Action"
- Secao "All done -- Perfect Day CTA"
- Botoes "Soft/Hard Complete Day" com logica de Perfect Day
- Import de `DailyChecklist`
- Variaveis: `softComplete`, `isPerfectDay`, `momento5Task`, `momento5HasNote`, `nextTask`, `sortedTasks`, `dayProgress`, `allCompleted`
- `localNotes`, `handleNoteChange`, `handleNoteSave`, `notesData`, `saveNote`

### Adicionar:
- 2 cards usando `DailyItemCard` (prayer + activity) com drawer para detalhe
- Botao "Concluir Dia" simples quando ambas tasks estao completas
- Progresso usa valores do RPC diretamente (sem recalcular)

### Hero do Reto (Prompt 3):
- Manter hero, mas remover CTA secundario "Ver reto"
- Apenas 1 CTA: "Continuar hoy"

---

## Fase 6: Corrigir useYesterdayData (Prompt 7)

Em `src/hooks/useYesterdayData.ts`:
- Remover `TOTAL_TASKS_PER_DAY = 5`
- Filtrar tasks ativas: `.eq("is_active", true)` na query de tasks
- Ocultar se `completed >= total` (em vez de `completed >= 5`)

---

## Fase 7: Atualizar useRetoData (Prompt 8)

Em `src/hooks/useRetoData.ts`:
- Substituir `Promise.all(map(async day => ...))` pela chamada ao novo RPC `get_week_days_progress`
- Manter query key `["reto", weekId, userId]`

---

## Fase 8: CalendarioMes grid com dia do mes (Prompt 9)

Em `src/pages/CalendarioMes.tsx`:
- No grid de dias, mostrar `new Date(d.date + 'T12:00:00').getDate()` em vez de `D{d.day_number}`
- Ordenar dias por `date` dentro de cada semana

---

## Fase 9: Atualizar Dia.tsx e DayDetail.tsx (Prompt 10)

- Substituir cards inline por `DailyItemCard` reutilizavel
- Remover codigo duplicado de Oracion/Tarea

---

## Fase 10: Admin/RetoBuilder (Prompt 11)

Em `src/pages/RetoBuilder.tsx`:
- Adicionar secao de edicao de tasks por dia
- Limitar a 2 tasks ativas por dia (1 prayer + 1 activity)
- Validacao client-side antes de salvar
- Desativar tasks extras com `is_active = false`

---

## Fase 11: Navegacao consistente (Prompt 13)

Verificar e ajustar:
- Home CTA Hero -> `/reto/:weekId/dia/:dayNumber`
- CalendarioMes grid -> `/day/:dayId`
- Reto CTA -> `/reto/:weekId/dia/:dayNumber`
- Nenhuma tela assume "5 momentos"

---

## Arquivos alterados

| Arquivo | Tipo |
|---|---|
| `supabase/migrations/xxx.sql` | Migration (3 RPCs + 1 RPC nova + constraint) |
| `src/components/DailyItemCard.tsx` | Novo componente |
| `src/pages/Index.tsx` | Reescrita parcial |
| `src/pages/Dia.tsx` | Usar DailyItemCard |
| `src/pages/DayDetail.tsx` | Usar DailyItemCard |
| `src/pages/CalendarioMes.tsx` | Grid com dia do mes |
| `src/pages/RetoBuilder.tsx` | Validacao 2 tasks |
| `src/hooks/useYesterdayData.ts` | Filtrar tasks ativas |
| `src/hooks/useRetoData.ts` | Usar RPC |
| `src/hooks/useDayTasks.ts` | Tratar conflito de constraint |

---

## Checklist DoD

- [ ] Home mostra 2 cards (Oracion + Tarea) com drawer de detalhe
- [ ] Nenhuma referencia a "5 momentos" ou "Perfect Day" na Home
- [ ] RPCs filtram tasks inativas (is_active = true)
- [ ] get_month_calendar sem hardcode /5
- [ ] Constraint unique(user_id, task_id) em task_checks
- [ ] useYesterdayData funciona com 2 tasks
- [ ] useRetoData sem N+1
- [ ] CalendarioMes mostra dia do mes real
- [ ] DailyItemCard reutilizado em Home, Dia e DayDetail
- [ ] RetoBuilder limita 2 tasks ativas por dia
- [ ] Navegacao consistente entre todas as telas

