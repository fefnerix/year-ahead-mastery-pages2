

# Finalizar Reto 1 — Assets, Semana Activa y Limpieza

Todo lo necesario para que el Reto 1 funcione de verdad en el app.

---

## 1. Admin: Seccion "Assets del Reto" por semana

Agregar en `Admin.tsx`, dentro de cada card de semana (donde hoy solo aparece el boton "Constructor"), una seccion expandible "Assets" con uploads para:

- **Banner/Cover** (imagen) -> bucket `covers`, actualiza `weeks.cover_url`
- **Audio de apertura** (mp3) -> bucket `audios`, actualiza `weeks.audio_url`
- **Cronograma imagen** (png/jpg) -> bucket `schedules`, actualiza `weeks.schedule_image_url`
- **Cronograma PDF** -> bucket `pdfs`, actualiza `weeks.schedule_pdf_url`

Despues de cada upload exitoso, ejecutar un UPDATE al campo correspondiente en la tabla `weeks`.

Tambien sincronizar automaticamente los `week_blocks` existentes:
- Bloque `audio`: actualizar `config.audio_url`
- Bloque `cronograma`: actualizar `config.schedule_image_url` y `config.schedule_pdf_url`
- Bloque `hero`: actualizar `config.cover_image_url` con el mismo `cover_url`

### Nuevo hook necesario
`useUpdateWeekAssets` en `useAdmin.ts`: mutation que recibe `{ weekId, field, value }` y hace UPDATE en `weeks` + UPDATE en el `week_block` correspondiente.

---

## 2. Ajustar fechas a la semana actual

Agregar boton en Admin (junto a cada semana): **"Ajustar a esta semana"**

Al hacer clic:
- Calcula el lunes de la semana actual (2026-02-16)
- Actualiza `days.date` y `days.unlock_date` para los 7 dias (Lun 16 -> Dom 22)
- No toca tasks, solo fechas

Esto hace que `useCurrentWeekData` detecte correctamente la semana y que "Dia X de 7" funcione en la Home.

### Implementacion
Nuevo mutation `useAdjustWeekDates` en `useAdmin.ts` que recibe `weekId` y calcula las 7 fechas desde el lunes actual.

---

## 3. Boton "Activar semana" en Admin

Agregar boton **"Activar"** por semana que:
- Pone `weeks.status = 'active'` en la semana seleccionada
- Pone `weeks.status = 'published'` en todas las demas

Actualizar `useCurrentWeekData.ts` para:
1. Primero buscar `weeks.status = 'active'`
2. Si no existe, fallback por fecha (logica actual)

Esto permite control manual sin depender solo de fechas.

---

## 4. Bloques: ocultar si asset falta

Actualizar los componentes de bloque para no renderizar cuando el asset es null:

- `AudioBlock.tsx`: ya tiene `if (!audio_url) return null` -- OK
- `CronogramaBlock.tsx`: ya tiene `if (!schedule_image_url) return null` -- OK
- `HeroBlock.tsx`: si no hay `cover_image_url`, mostrar gradiente premium (ya implementado en Index) en vez de nada

No se necesitan cambios adicionales aqui, los bloques ya manejan esto correctamente.

---

## 5. Home: hero usa `cover_url` de weeks (no Hotmart)

La Home (`Index.tsx`) ya usa `weekData.cover_url` en linea 101. Cuando el admin suba el banner real, automaticamente reemplaza la imagen Hotmart (que hoy es null, asi que muestra gradiente gold). No requiere cambios de codigo.

---

## Archivos a modificar

```text
src/pages/Admin.tsx        -- Seccion assets + boton ajustar fechas + boton activar
src/hooks/useAdmin.ts      -- useUpdateWeekAssets, useAdjustWeekDates, useActivateWeek
src/hooks/useCurrentWeekData.ts -- Priorizar status='active' antes de fallback por fecha
```

## Archivos sin cambios

- Index.tsx, Reto.tsx, BlockRenderer, bloques: no requieren modificaciones
- Base de datos: no se necesitan migraciones (weeks.status ya existe)
- Buckets de storage: ya existen (covers, audios, schedules, pdfs)
