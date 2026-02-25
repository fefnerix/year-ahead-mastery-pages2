

# Plan: Migrar Home e RPCs para modelo de 2 tasks (Oracion + Tarea)

Este plano cobre os 13 prompts em uma implementacao coerente e sequencial.

---

## Checklist DoD

- [x] Home mostra 2 cards (Oracion + Tarea) com drawer de detalhe
- [x] Nenhuma referencia a "5 momentos" ou "Perfect Day" na Home
- [x] RPCs filtram tasks inativas (is_active = true)
- [x] get_month_calendar sem hardcode /5
- [x] Constraint unique(user_id, task_id) em task_checks
- [x] useYesterdayData funciona com 2 tasks
- [x] useRetoData sem N+1
- [x] CalendarioMes mostra dia do mes real
- [x] DailyItemCard reutilizado em Home, Dia e DayDetail
- [ ] RetoBuilder limita 2 tasks ativas por dia
- [x] Navegacao consistente entre todas as telas
