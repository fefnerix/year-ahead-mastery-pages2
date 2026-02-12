

# Planer 365 — Plan de Implementacion Completo

Este plan cubre los 6 sprints descritos en tu documento, adaptados a la stack de Lovable (React + Vite + Supabase via Lovable Cloud). A continuacion el detalle de cada fase.

---

## Sprint 1 — Auth + Estructura + Home v0

### 1.1 Activar Lovable Cloud
- Habilitar Cloud para obtener base de datos, auth y edge functions.

### 1.2 Autenticacion
- Crear pagina `/auth` con login y registro (email/contrasena).
- Implementar reset de contrasena.
- Proteger todas las rutas con un componente `ProtectedRoute` que redirige a `/auth` si no hay sesion.
- Crear tabla `profiles` con trigger automatico al registrarse (nombre, avatar_url).
- Crear tabla `user_roles` con enum `app_role` (admin, user) y funcion `has_role()` security definer.

### 1.3 Estructura de contenido (tablas)
- **programs**: id, name, year, start_date, end_date
- **months**: id, program_id, number, name, theme
- **weeks** (retos): id, month_id, number, name, objective
- **days**: id, week_id, number, date, unlock_date
- **tasks**: id, day_id, title, category (enum: cuerpo/mente/alma/finanzas), order
- **content_items**: id, day_id, type (pdf/audio/video/link), title, url, order
- RLS: lectura autenticada para todo el contenido.

### 1.4 Home v0 conectada
- Consultar el dia actual del programa y mostrar las tareas reales.
- Conectar los anillos de progreso a datos calculados.

---

## Sprint 2 — Tareas + Checks + Progreso + Streak

### 2.1 Tabla de checks
- **task_checks**: id, user_id, task_id, day_id, checked_at (timestamp)
- RLS: cada usuario solo lee/escribe sus propios checks.
- Unique constraint en (user_id, task_id) para evitar duplicados.

### 2.2 Checklist funcional
- Al marcar una tarea, insertar registro en `task_checks` con timestamp.
- Al desmarcar, eliminar el registro.
- Optimistic updates en la UI para respuesta instantanea.

### 2.3 Calculo de progreso
- **% del dia** = checks del dia / tareas del dia.
- **% semana** = promedio de % de los dias desbloqueados de la semana.
- **% mes** = promedio de semanas del mes.
- **% ano** = promedio de meses del programa.
- Crear una vista SQL o funcion RPC que calcule estos valores para el usuario actual.

### 2.4 Streak
- Calcular streak actual: dias consecutivos hacia atras donde % dia = 100%.
- Almacenar streak record en tabla `user_streaks` (user_id, current_streak, max_streak, last_completed_date).
- Actualizar via trigger o edge function al completar un dia.

### 2.5 UI "1 segundo"
- Progreso del dia visible en el header.
- Boton "Concluir Dia" con animacion de celebracion (confetti leve o gold pulse).

---

## Sprint 3 — Drip + Reglas + Anti-trampa

### 3.1 Drip diario
- Columna `unlock_date` en tabla `days`.
- La UI muestra candado en dias futuros (ya implementado visualmente en Semana.tsx).
- Validacion server-side: RLS o edge function que impide insertar checks en dias no desbloqueados.

### 3.2 Ventana retroactiva (48h)
- Al intentar marcar una tarea, validar que `NOW() - day.date <= interval '48 hours'`.
- Implementar como check constraint o policy RLS en `task_checks`.
- UI: mostrar indicador de "tiempo restante" para dias anteriores dentro de la ventana.

### 3.3 Logs de auditoria
- Tabla **audit_logs**: id, user_id, action, entity_type, entity_id, metadata (jsonb), created_at.
- Registrar cada check/uncheck con timestamp y origen.
- Flag `suspicious` para revision manual del Top 10.

---

## Sprint 4 — Ranking

### 4.1 Sistema de puntuacion
- 1 punto por tarea completada.
- +2 bonus al completar el dia (5/5 = 100%).
- +10 bonus al completar semana completa (7/7 dias).
- Edge function o database function que calcula scores.

### 4.2 Leaderboards
- Tabla **leaderboard_scores**: user_id, period_type (week/month/year), period_key, score, rank.
- Actualizar via cron job o trigger tras cada check.
- Tabs ya implementados en Ranking.tsx, conectarlos a datos reales.

### 4.3 Desempate
1. Mayor % anual.
2. Mayor streak maximo.
3. Mas semanas al 100%.

### 4.4 UI ranking mejorada
- Mostrar "distancia para el siguiente" (puntos que faltan).
- Destacar posicion del usuario actual.
- Reglas publicas ya implementadas en la UI.

---

## Sprint 5 — Admin + Contenido

### 5.1 Panel admin
- Rutas `/admin/*` protegidas con verificacion de role `admin`.
- CRUD para: programas, meses, semanas, dias, tareas.
- Upload de materiales (PDFs/audios) via Supabase Storage.
- Links de video (YouTube/Vimeo).

### 5.2 Configuracion del ciclo
- Interfaz para definir fechas de inicio/fin del programa.
- Configurar ventana retroactiva (default 48h).
- Configurar reglas de puntuacion y certificacion.

### 5.3 Biblioteca mensual
- Seccion de replay de lives (links).
- Libros del mes con orden y justificacion ("por que").

---

## Sprint 6 — Certificacion + Polimiento

### 6.1 Certificacion
- Tabla **certifications**: id, user_id, program_id, percentage_achieved, issued_at, certificate_code.
- Regla configurable: X% minimo para certificar (default 80%).
- Pagina de status: "Faltam Y% / Z dias".
- Generacion de PDF via edge function con codigo unico.

### 6.2 Top 10 anual
- Pagina de resultados finales.
- Export de logs de auditoria del Top 10 para revision.

### 6.3 Polimiento
- Verificar contraste AA+ en todo el diseno.
- Focus visible y navegacion por teclado.
- PWA manifest y service worker para instalacion.
- Safe area bottom ya implementada en BottomNav.

---

## Detalles Tecnicos

### Esquema de base de datos (resumen)

```text
programs
  +-- months
       +-- weeks (retos)
            +-- days
                 +-- tasks (max 5 por dia)
                 +-- content_items

users (auth.users)
  +-- profiles (trigger auto-create)
  +-- user_roles (admin/user)
  +-- task_checks (user_id, task_id, checked_at)
  +-- user_streaks (current, max, last_date)
  +-- leaderboard_scores (period_type, score, rank)
  +-- certifications (program_id, percentage, code)
  +-- audit_logs (action, metadata)
```

### Orden de implementacion recomendado
1. Activar Cloud y crear tablas de contenido + auth (Sprint 1)
2. Implementar checks y progreso (Sprint 2)
3. Drip y validaciones (Sprint 3)
4. Ranking con datos reales (Sprint 4)
5. Admin panel (Sprint 5)
6. Certificacion y polish (Sprint 6)

Cada sprint se puede implementar de forma incremental, probando al final de cada uno.

