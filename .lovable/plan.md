

# Plan: Sprint 0 + Sprint 1 — Produto Operável

## Checklist DoD

- [x] Home mostra 2 cards (Oracion + Tarea) com drawer de detalhe
- [x] Nenhuma referencia a "5 momentos" ou "Perfect Day" na Home
- [x] RPCs filtram tasks inativas (is_active = true) — calculate_user_score + update_user_streak corrigidos
- [x] get_month_calendar sem hardcode /5
- [x] Constraint unique(user_id, task_id) em task_checks
- [x] useYesterdayData funciona com 2 tasks
- [x] useRetoData sem N+1
- [x] CalendarioMes mostra dia do mes real
- [x] DailyItemCard reutilizado em Home, Dia e DayDetail
- [x] RetoBuilder limita 2 tasks ativas por dia (AdminDayTasks)
- [x] Navegacao consistente entre todas as telas
- [x] useCreateWeekWithDays cria 2 tasks (prayer + activity) por dia, não 5 Momentos
- [x] /semana removida (era hardcoded)
- [x] /lecturas criada como página funcional
- [x] Admin: editor Macro del Mes (theme/macro_text/audio/video)
- [ ] Admin: CRUD de Lecturas (content_items) — pendente Sprint 2
