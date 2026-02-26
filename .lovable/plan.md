

# Plan: Refazer UI de Progresso na Home + Remover "Recuperar Ayer"

## Resumo

Tres mudancas cirurgicas:
1. Remover bloco "Ayer" da Home e import do hook
2. Redesenhar secao Progresso com layout premium (card grande Hoy + card menor Mes)
3. Ranking ja mostra Semana e Total -- nenhuma mudanca necessaria

## Mudancas

### 1. `src/pages/Index.tsx`

**Remover:**
- Import de `useYesterdayProgress` (linha 16)
- Import de `Clock` do lucide (linha 6)
- Hook call `const { data: yesterday } = useYesterdayProgress()` (linha 33)
- Bloco JSX "Recuperar Ayer" inteiro (linhas 165-184)

**Redesenhar secao Progresso (linhas 100-131):**

Substituir os 2 cards identicos por um layout diferenciado:

```text
+------------------------------------------+
|  Progreso                                |
|                                          |
|  [========= CARD HOY (full width) ====]  |
|  |  HOY          67%                   |  |
|  |  ================================  |  |
|  |  1/2 hechas                        |  |
|  +------------------------------------+  |
|                                          |
|  [========= CARD MES (full width) ====]  |
|  |  MES          27%                   |  |
|  |  ================================  |  |
|  |  Promedio del mes                   |  |
|  +------------------------------------+  |
+------------------------------------------+
```

O card "Hoy" sera maior e mais prominente:
- Percentual em texto 3xl com cor dourada (`gold-text`)
- Barra de progresso `h-3` com `gold-gradient`
- Subtexto "x/2 hechas"
- Borda dourada sutil (`border-primary/20`)

O card "Mes" sera mais compacto:
- Percentual em texto xl
- Barra `h-2`
- Subtexto "Promedio del mes"

Tambem atualizar o skeleton loader de `[...Array(4)]` para `[...Array(2)]` com tamanhos adequados.

**Subtexto "x/2 hechas"**: Ja funciona dinamicamente via `completedCount`/`totalTasks`. Nao precisa hardcodar "/2".

### 2. `src/pages/Ranking.tsx`

**Nenhuma mudanca necessaria.** O Ranking ja exibe:
- `week_pct` como hero principal ("Semana")
- `year_pct` como card ("Anual")
- Streaks (racha/record)
- Dias completados
- Certificacao anual com barra

Todos os criterios de aceite para o Ranking ja estao atendidos.

### 3. `src/hooks/useYesterdayData.ts`

**Nenhuma mudanca.** O arquivo fica no projeto mas nao sera mais importado na Home. Pode ser util no futuro.

---

## Arquivos alterados

| Arquivo | Acao |
|---|---|
| `src/pages/Index.tsx` | Remover "Ayer", redesenhar Progresso |

## Criterios de aceite

- CA1: Bloco "Ayer / Recuperar" nao aparece mais
- CA2: Home exibe "Hoy" (card grande, % destaque, barra h-3) e "Mes" (card menor, barra h-2)
- CA3: Ranking ja exibe Semana e Total
- CA4: Marcar tarefa atualiza Hoy/Mes imediatamente (sem mudanca -- React Query invalidate ja funciona)
- CA5: UI premium mantida -- dourado, dark, sem redundancia
