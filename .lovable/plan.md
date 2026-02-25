

## Plan: 3 Changes in 1

This plan covers three related UI tasks that touch minimal files.

---

### Task 1: Restrict Calendar to months 3-12

**Files:** `src/pages/CalendarioAno.tsx`, `src/pages/CalendarioMes.tsx`

**CalendarioAno.tsx (line 75):**
- Filter the `months` array client-side before rendering: `.filter(m => m.month_number >= 3 && m.month_number <= 12)`
- No RPC changes needed

**CalendarioMes.tsx (line 36):**
- Change validation from `monthNum >= 1 && monthNum <= 12` to `monthNum >= 3 && monthNum <= 12`
- Update the error message from "Mes no valido" to "Mes no disponible" with CTA "Volver al calendario"
- No prev/next navigation arrows exist currently, so no arrow logic needed

---

### Task 2: Rename "Cuaderno" to "Diario" in UI labels

**Files:** `src/components/BottomNav.tsx`, `src/pages/Cuaderno.tsx`

**BottomNav.tsx (line 12):**
- Change label from `"Cuaderno"` to `"Diario"`
- Change icon from `BookOpen` to `PenLine`

**Cuaderno.tsx (line 139):**
- Change heading from `"Mi Cuaderno"` to `"Mi Diario"`
- Change subtitle from `"Todas tus notas y reflexiones"` to `"Tus reflexiones y notas"`

Route stays `/cuaderno` -- no file rename.

---

### Task 3: Make "Diario" the default tab in Cuaderno page

**File:** `src/pages/Cuaderno.tsx`

**Line 23:**
- Change default state from `useState<ViewMode>("notas")` to `useState<ViewMode>("diario")`

**Lines 145-156 (toggle buttons):**
- Swap the order: "Diario" button first, "Notas de tareas" button second

---

### Summary of all file changes

| File | Changes |
|------|---------|
| `src/pages/CalendarioAno.tsx` | Filter months to 3-12 |
| `src/pages/CalendarioMes.tsx` | Validate month 3-12, update error state |
| `src/components/BottomNav.tsx` | Label "Cuaderno" to "Diario", icon to PenLine |
| `src/pages/Cuaderno.tsx` | Heading to "Mi Diario", default tab to "diario", swap tab order |

### No new queries/RPCs needed

All changes are client-side filtering and label updates.

### DoD Checklist (post-implementation)

- [ ] `/calendario` shows only Mar-Dec
- [ ] `/calendario/2026/2` shows "Mes no disponible" + CTA, no console errors
- [ ] Month-to-day navigation works for months 3-12
- [ ] BottomNav shows "Diario"
- [ ] `/cuaderno` heading is "Mi Diario"
- [ ] Default tab is "Diario", toggle to "Notas de tareas" works
- [ ] No regression on task notes creation/display

