

# Implementacion Completa: Reto 1 + Admin + Ranking + Storage

Este plan cubre todas las 12 secciones solicitadas, organizadas en bloques de implementacion secuencial.

---

## Bloque A — Schema de Base de Datos (migracion)

### A.1 Modificar tabla `weeks` para soportar materiales del reto
Agregar columnas a la tabla existente `weeks`:
- `cover_url` (text, nullable) — URL de la capa del reto en Storage
- `audio_url` (text, nullable) — URL del audio de introduccion
- `schedule_image_url` (text, nullable) — URL de la imagen del cronograma
- `schedule_pdf_url` (text, nullable) — URL del PDF descargable

### A.2 Crear tabla `leaderboard_scores`
- `id` (uuid, PK)
- `user_id` (uuid, not null)
- `period_type` (enum: 'week', 'month', 'year')
- `period_key` (text) — ej: "2026-W07", "2026-02", "2026"
- `score` (integer, default 0)
- `days_completed` (integer, default 0)
- `weeks_completed` (integer, default 0)
- `updated_at` (timestamptz)
- Unique constraint en (user_id, period_type, period_key)
- RLS: usuarios pueden leer todos los scores (para ranking), solo el sistema escribe

### A.3 Crear funcion `calculate_user_score`
Funcion RPC que calcula puntos para un usuario en un periodo:
- 1 punto por tarea completada
- +2 bonus por dia completo (5/5)
- +10 bonus por semana completa (7/7 dias)
Upsert en `leaderboard_scores`.

### A.4 Crear funcion `get_leaderboard`
Funcion RPC que retorna el ranking para un periodo dado, incluyendo display_name del perfil, ordenado por score DESC con desempate (% anual, streak, semanas completas).

### A.5 Storage buckets
Crear 4 buckets publicos:
- `covers` — capas de los retos
- `schedules` — imagenes de cronograma
- `audios` — audios de introduccion
- `pdfs` — PDFs descargables

Con RLS: lectura publica, escritura solo admin.

---

## Bloque B — Pagina del Reto `/reto/:weekId`

### B.1 Crear pagina `src/pages/Reto.tsx`
Layout completo con:
- **Header**: capa (imagen desde Storage), titulo del reto, progreso semanal (%), boton "Continuar hoy"
- **Audio player**: reproductor HTML5 con play/pause, barra de progreso, selector de velocidad (1x/1.25x/1.5x)
- **Cronograma semanal**: imagen del cronograma, boton "Ver en pantalla completa" (dialog fullscreen), boton "Descargar PDF"
- **Cards de Dias 1-7**: cada card muestra nombre del dia (Lunes-Domingo), status (completo/pendiente/bloqueado), progreso (ej: 3/5), dias futuros con candado y "Disponible en X horas"

### B.2 Hook `useRetoData`
- Consulta la semana por ID con sus materiales
- Consulta los 7 dias con sus tareas y checks del usuario
- Calcula progreso por dia y semanal

---

## Bloque C — Pagina del Dia `/reto/:weekId/dia/:dayNumber`

### C.1 Crear pagina `src/pages/Dia.tsx`
- **Header**: "Dia X — [titulo del reto]", indicador "Semana Y de 50", progreso del dia (%)
- **Checklist**: 5 tareas (Momentos 1-5) con checkbox grande, guardar/eliminar en `task_checks`
- **Materiales**: links al cronograma semanal y audio de introduccion
- **Boton "Concluir dia"**: habilitado solo con 5/5, al pulsar actualiza streak, calcula score y ranking

### C.2 Hook `useDayTasks`
Reutiliza la logica existente de `useTodayTasks` pero parametrizado por day_id arbitrario.

---

## Bloque D — Home (Hoy) Mejorada

### D.1 Conectar MiniRanking a datos reales
Reemplazar los datos mock del ranking con llamada a `get_leaderboard` para el periodo semanal actual.

### D.2 Link al reto actual
Agregar boton/link desde Home hacia `/reto/:weekId` de la semana actual.

---

## Bloque E — Ranking con Datos Reales

### E.1 Actualizar `src/pages/Ranking.tsx`
- Conectar los 3 tabs (Semana/Mes/Ano) a `get_leaderboard` con el periodo correspondiente
- Mostrar display_name, score, posicion del usuario actual
- Mostrar "distancia para el siguiente" (puntos que faltan)
- Actualizar reglas mostradas con la puntuacion real (1pt/tarea, +2/dia, +10/semana)

---

## Bloque F — Admin Panel

### F.1 Componente `AdminRoute`
Wrapper que verifica `has_role(user_id, 'admin')` y redirige si no es admin.

### F.2 Crear pagina `src/pages/Admin.tsx`
Dashboard admin con tabs/secciones para:
- **Programas**: listar, crear (nombre, ano, fecha inicio/fin)
- **Meses**: listar, crear asociados a un programa
- **Semanas/Retos**: listar, crear con uploads (capa, audio, cronograma, PDF)
- **Dias + Tareas**: al crear un reto, generar automaticamente 7 dias con 5 tareas cada uno (Momento 1-5), edicion opcional del texto

### F.3 Upload de archivos
Componente de upload que sube a los buckets de Storage y guarda la URL en la tabla correspondiente.

### F.4 Creacion automatica de dias y tareas
Al crear una semana/reto, el sistema automaticamente:
1. Crea 7 registros en `days` (con fechas calculadas y unlock_date)
2. Para cada dia, crea 5 registros en `tasks` (Momento 1..5, categoria por defecto)

---

## Bloque G — Seed del Reto 1

### G.1 Datos iniciales
Insertar via SQL:
- 1 programa: "Valientes 2026"
- 1 mes: "Febrero" 
- 1 semana: "Reto 1 — Encontrando mi proposito"
- 7 dias con fecha actual como base
- 35 tareas (5 por dia): Momento 1..5 con titulos basados en el cronograma

---

## Bloque H — Rutas y Navegacion

### H.1 Actualizar `App.tsx`
Agregar rutas:
- `/reto/:weekId` — pagina del reto (protegida)
- `/reto/:weekId/dia/:dayNumber` — pagina del dia (protegida)
- `/admin` — panel admin (protegida + verificacion admin)

### H.2 Actualizar BottomNav
Mantener la navegacion existente. Agregar item "Admin" visible solo para admins (condicional).

---

## Detalles Tecnicos

### Archivos nuevos a crear
```text
src/pages/Reto.tsx              — pagina del reto
src/pages/Dia.tsx               — pagina del dia
src/pages/Admin.tsx             — panel admin
src/components/AdminRoute.tsx   — proteccion de ruta admin
src/components/AudioPlayer.tsx  — reproductor de audio
src/components/FileUpload.tsx   — upload a Storage
src/hooks/useRetoData.ts        — datos del reto/semana
src/hooks/useLeaderboard.ts     — ranking real
src/hooks/useAdmin.ts           — operaciones CRUD admin
```

### Archivos existentes a modificar
```text
src/App.tsx                     — agregar rutas nuevas
src/pages/Index.tsx             — conectar ranking real, link al reto
src/pages/Ranking.tsx           — conectar a datos reales
src/components/BottomNav.tsx    — item admin condicional
src/hooks/useTodayData.ts       — reutilizar logica para dia arbitrario
```

### Migracion SQL (resumen)
```text
1. ALTER TABLE weeks ADD COLUMN cover_url, audio_url, schedule_image_url, schedule_pdf_url
2. CREATE TABLE leaderboard_scores (...)
3. CREATE FUNCTION calculate_user_score(...)
4. CREATE FUNCTION get_leaderboard(...)
5. CREATE storage buckets: covers, schedules, audios, pdfs
6. RLS policies para leaderboard_scores y storage
7. INSERT seed data: programa + mes + semana + 7 dias + 35 tareas
```

### Orden de ejecucion
1. Migracion DB (schema + funciones + storage + seed)
2. Hooks de datos (useRetoData, useLeaderboard, useAdmin)
3. Paginas nuevas (Reto, Dia, Admin)
4. Componentes auxiliares (AudioPlayer, FileUpload, AdminRoute)
5. Actualizacion de paginas existentes (Home, Ranking, rutas)

