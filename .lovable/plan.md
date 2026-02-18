

# Atualização 80/20 — Reorganização UX Premium

Reorganizar a jornada do usuário sem criar novas features grandes. Mover conteúdo de lugar, limpar ruído e polir UI.

---

## Etapa 1: Home "Tu Misión Hoy" (Index.tsx)

### Remover da Home
- MiniRanking + leaderboard query
- StreakBadge
- ProgressRing + ProgressChip (hoy/semana/mes/año)
- Cronograma (schedule image + fullscreen modal)
- Texto longo colapsável (description)
- AudioPlayer
- PlaylistCards
- AnnouncementBanner (mover para Reto se necessário)

### Manter na Home (3 blocos apenas)

**(A) Hero Minimal do Reto Ativo**
- Banner semanal (weekData.cover_url) ou gradiente gold
- Chip: "Reto {n} · Semana {n} · Día X/7"
- Título do reto
- CTA primário: "Continuar hoy" -> `/reto/{weekId}/dia/{dayNumber}`
- Link secundário: "Abrir reto" -> `/reto/{weekId}`

**(B) "Tus 5 Momentos de Hoy"**
- Mesma lista de 5 tasks usando `useTodayTasks`
- Mesmo `DailyChecklist` com suporte a notas (reaproveitar props notes/onNoteChange/onNoteSave)
- Adicionar hooks de notas na Home: importar `useTaskNotes` e `useSaveNote` do `useTaskNotes.ts`
- Barra de progresso dourada (já existe)
- Botão "Concluir Día" quando 5/5

**(C) Depósito (Wallet Card)**
- Manter `DepositCard` como está (já premium)

### Estado vazio premium
- Sem semana ativa: "Tu reto aún no está activo."
- Admin: botão "Activar reto" -> /admin
- User: "Volver más tarde"

### Imports a remover
- `ProgressRing`, `StreakBadge`, `MiniRanking`, `AudioPlayer`, `PlaylistCard`, `AnnouncementBanner`
- `useLeaderboard`, `useCalculateScore`, `useStreak`, `useUpdateStreak` (manter updateStreak e calculateScore no handleCompleteDay)
- States: `descExpanded`, `scheduleFullscreen`

### Imports a adicionar
- `useTaskNotes`, `useSaveNote` de `@/hooks/useTaskNotes`
- `useState`, `useEffect` para state local de notas

---

## Etapa 2: Ranking como Hub de Performance (Ranking.tsx)

### Adicionar no topo: "Mi Progreso" (hero card)
- Importar `useProgress` e `useStreak` de `useTodayData`
- Card com:
  - % semana (número grande, protagonista)
  - Streak atual e record
  - Días completados (da leaderboard entry)
  - Progreso anual + barra de certificação (mover do Perfil)

### "Tu Posición" (já existe, melhorar)
- Já tem card com posição e pontos
- Adicionar "Faltan Z pts para subir" (já implementado com `nextAbove`)

### Rankings (tabs)
- Mudar tabs para: "Semana | Reto | General"
- "Reto" = mesma query "week"
- "General" = query "year"
- Top 10 (mudar p_limit de 20 para 10 na query, ou filtrar no render)
- Sempre mostrar usuário mesmo fora do top 10 (adicionar lógica: se currentUser não está nos primeiros 10, adicionar ao final com separador)

---

## Etapa 3: Perfil Minimalista (Perfil.tsx)

### Remover
- Stats grid (días completados, streak, progreso anual)
- Card "Certificación Anual"

### Manter / Adicionar
- Header com avatar e nome (conectar dados reais do user via `useAuth`)
- Menu: Configuración, Soporte/Ayuda, Cerrar sesión
- Logout funcional (importar `useAuth` e chamar `signOut`)

---

## Etapa 4: Reto com Seções Colapsáveis (Reto.tsx)

### Melhorar o layout com blocos (branch hasBlocks)
- Hero block: já renderiza via BlockRenderer
- Áudio: já oculta se null
- Texto longo: trocar `TextBlock` para usar accordion com seções (se o texto contiver marcadores como "Descripción", "Cronograma", etc., quebrar; senão, manter colapsável simples)
- Cronograma: renderizar como botão "Ver cronograma" que abre modal (não inline)
- Playlists: já renderiza via PlaylistsBlock
- Days map: já renderiza via DaysMapBlock

### Atualizar `CronogramaBlock.tsx`
- Em vez de mostrar imagem inline, mostrar botão "Ver cronograma"
- Clicar abre modal fullscreen com imagem + botão download PDF

---

## Etapa 5: Dia consistente com Home (Dia.tsx)

Página do Dia já está bem estruturada:
- Usa DailyChecklist com notas
- Tem botão "Concluir Día"
- Tem playlists e materiais

### Pequenos ajustes
- Remover ProgressRing do header (sem gamificação aqui)
- Manter apenas progresso inline "3/5" no header
- Adicionar link "Ver mi progreso" -> /ranking após completar dia (opcional)

---

## Etapa 6: Cuaderno (sem mudanças estruturais)

Já funciona bem:
- Agrupado por semana
- Busca por texto
- Chips de categoria

Nenhuma mudança necessária nesta etapa.

---

## Etapa 7: Admin (já implementado na iteração anterior)

Os hooks `useActivateWeek`, `useAdjustWeekDates`, `useUpdateWeekAsset` já existem em `useAdmin.ts`. O Admin.tsx já tem seção de assets e botões de ativar/ajustar. Sem mudanças adicionais.

---

## Arquivos a modificar

```text
src/pages/Index.tsx       -- Limpar para 3 blocos + adicionar notas
src/pages/Ranking.tsx     -- Adicionar "Mi Progreso" hero + melhorar tabs
src/pages/Perfil.tsx      -- Minimalizar (remover stats, adicionar logout real)
src/pages/Reto.tsx        -- Cronograma como modal em vez de inline
src/pages/Dia.tsx         -- Remover ProgressRing, simplificar header
src/components/blocks/CronogramaBlock.tsx -- Botão + modal em vez de imagem inline
```

### Arquivos sem mudanças
- DailyChecklist.tsx (já suporta notas)
- DepositCard.tsx (já premium)
- BottomNav.tsx (já está bom)
- Cuaderno.tsx (já funcional)
- Admin.tsx (já atualizado)
- Hooks (reutilizar os existentes)
- Banco de dados (sem migrações)

