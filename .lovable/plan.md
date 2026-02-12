

# Redesign Visual Premium — Plan Renacer 365

Actualización puramente visual. Sin cambios de lógica, banco, rutas o reglas de negocio.

---

## 1. Header Premium (Index.tsx)

Reemplazar el header actual por:
- Logo compacto a la izquierda
- Avatar a la derecha con borde gold sutil
- Linea dorada de 1px debajo del header (`border-b border-primary/15`)
- Saludo en serif mas grande: "Hola, {first_name}" sin emoji
- Subtexto: "Hoy avanzas un paso." (en vez del "Enfoque: ...")

---

## 2. Hero del Reto Activo (Index.tsx)

Transformar el banner actual en un hero real:
- Altura mayor (h-44 en vez de h-32)
- Overlay con gradiente oscuro mas fuerte
- Contenido posicionado sobre la imagen:
  - Chip superior: "Dia X de 7" con fondo surface
  - Titulo serif grande: "Reto 1"
  - Subtitulo: "Encontrando mi proposito"
  - CTA principal: boton gold "Continuar"
  - CTA secundario: texto "Ver cronograma"
- Eliminar texto "Reto 1 -- Semana 1" duplicativo

---

## 3. Seccion Tareas de Hoy (Index.tsx + DailyChecklist.tsx)

### Index.tsx
- Header de seccion con titulo serif y contador compacto "0/5"
- Barra de progreso sutil dorada debajo del header
- Estado vacio elegante:
  - Titulo: "Aun no empieza tu reto."
  - Si admin: boton "Activar reto"
  - Si no admin: texto sutil "El reto sera activado pronto."

### DailyChecklist.tsx
- Checkbox circular con ring gold (en vez de circulo solido)
- Fondo de task mas sutil (sin glass-card en cada item, usar border-b)
- Categoria badge mas discreto
- Nota expandida con fondo surface y borde gold sutil

---

## 4. Deposito como Wallet Card (DepositCard.tsx)

- Icono cofre/vault en vez de DollarSign
- Total en tipografia grande serif
- Badge "x100" como chip dorado discreto
- Boton "Registrar" compacto inline
- Link "Historial" como texto minimal

---

## 5. Progreso Reimaginado (Index.tsx + ProgressRing.tsx)

Reemplazar los 4 circulos identicos por:
- 1 card principal "Progreso de hoy" con ring grande centrado y % prominente
- 3 chips compactos abajo: Semana, Mes, Año con % en texto (sin rings, solo barras o chips)
- Separacion visual clara entre "hoy" (protagonista) y los demas (complementarios)

---

## 6. Ranking Premium (MiniRanking.tsx)

- Top 3 con iconos dorados mas grandes y fondo sutil diferenciado
- Posicion del usuario con outline gold y fondo primary/5
- Score en tipografia tabular
- Estado vacio: "Completa tu primer dia para entrar al ranking." (una linea, sin explicaciones)

---

## 7. Bottom Nav Premium (BottomNav.tsx)

- Fondo con backdrop-blur mas fuerte
- Border top gold sutil (border-primary/10)
- Labels en mayusculas mas pequenas (ya esta, refinar)
- Icono activo con glow gold mas pronunciado
- Padding vertical generoso (py-3)

---

## 8. Componentes Auxiliares

### AudioPlayer.tsx
- Sin cambios estructurales, solo refinar spacing

### PlaylistCard.tsx
- Icono de musica en gold (no verde Spotify)
- Botones con estilo consistente (gold primary + ghost secondary)

### AnnouncementBanner.tsx
- Badge rojo mas discreto (puntito mas pequeno)
- Bordes mas sutiles

### StreakBadge.tsx
- Sin cambios mayores, ya tiene buen estilo

### Logo.tsx
- Sin cambios

---

## 9. Microcopy Humanizado (Index.tsx)

Reemplazar textos "cara de IA" por microcopy premium:

| Antes | Despues |
|---|---|
| "No hay tareas programadas para hoy." | "Aun no empieza tu reto." |
| "Un admin debe crear el programa y las tareas." | "El reto sera activado pronto." |
| "Completa tareas para aparecer en el ranking" | "Completa tu primer dia para entrar al ranking." |
| "Audio de introduccion" | "Escucha la intro" |
| "Sobre este reto" | "Sobre este reto" (mantener) |
| "Toca para leer mas" | "Leer mas" |
| "Continuar hoy" | "Continuar" |

---

## 10. Espaciado y Tokens Globales (index.css)

- Aumentar spacing entre secciones: `space-y-6` en vez de `space-y-5`
- Padding horizontal: `px-5` (mantener, buen valor mobile)
- Border radius cards: `rounded-2xl` en vez de `rounded-xl`
- Refinar `.glass-card`: fondo con opacidad ligeramente mayor para mejor contraste
- Agregar utilidad `.section-title` para titulos de seccion consistentes

---

## Archivos a Modificar

```text
src/pages/Index.tsx              -- Layout, hero, empty states, microcopy
src/components/DailyChecklist.tsx -- Checkbox gold ring, item styling, note area
src/components/MiniRanking.tsx    -- Top 3 destaque, empty state
src/components/ProgressRing.tsx   -- (minor refinements)
src/components/BottomNav.tsx      -- Border gold, blur, spacing
src/components/DepositCard.tsx    -- Wallet card style
src/components/PlaylistCard.tsx   -- Gold iconos, botones consistentes
src/components/AnnouncementBanner.tsx -- Badge discreto
src/index.css                     -- Spacing tokens, .section-title utility
```

Ningun archivo nuevo. Ninguna ruta nueva. Ninguna tabla nueva.

