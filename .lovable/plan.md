
# Design System Update: Plan Renacer 365

Actualizacion de la identidad visual completa del app para reflejar la marca "Plan Renacer 365" con tema dark navy premium + dourado.

---

## 1. Logo e Imagen

- Copiar la imagen subida a `src/assets/logo-renacer.jpeg`
- Crear un componente `src/components/Logo.tsx` que renderiza la marca:
  - En mobile: imagen compacta (40px de alto) + texto "PLAN RENACER 365"
  - Version full: imagen + subtitulo "Master en Desarrollo Personal"
- Usar la logo en:
  - Auth page (version full, centrada)
  - Header de Home (version compacta)
  - Admin page (version compacta)

---

## 2. Paleta de Colores (index.css)

Actualizar las CSS variables en `:root` para reflejar la paleta oficial:

```text
--background: #0B0E1A (dark navy)
--card / --popover: #070A12 (secondary bg)  
--muted: rgba(255,255,255,0.03) (surface)
--secondary: rgba(255,255,255,0.05) (surface-2)
--primary (gold): #D6B15A
--gold-dark: #B8903D
--gold-light: #F3D68A
--foreground: #F5F5F7
--muted-foreground: #A7ABB8
--border: rgba(255,255,255,0.08)
--border-gold: rgba(214,177,90,0.25)
```

Converter cada valor hex/rgba a formato HSL para manter compatibilidade com Tailwind.

---

## 3. Tipografia

Manter as fontes ja importadas (Inter + Playfair Display). Nenhuma mudanca de fonte necessaria -- Playfair Display ja e serif premium para titulos, Inter e sans clean para UI.

---

## 4. index.html - PWA Meta Tags

Atualizar:
- `<title>` para "Plan Renacer 365"
- `theme-color` meta tag: `#0B0E1A`
- Open Graph title/description
- Adicionar `<meta name="theme-color" content="#0B0E1A">`
- Adicionar `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`

---

## 5. Paginas Atualizadas

Todas as paginas ja usam as CSS variables (`bg-background`, `text-foreground`, `text-primary`, etc.), entao a mudanca de paleta no `index.css` ja afeta todas automaticamente.

Mudancas especificas por pagina:

### Auth.tsx
- Substituir texto "Planer 365" pelo componente Logo (version full)
- Remover gold-text inline, usar logo real

### Index.tsx (Home)
- Adicionar componente Logo compacto no header (substituir "Cargando..." por logo)

### Admin.tsx
- Adicionar Logo compacto no header
- Nenhuma outra mudanca necessaria (ja usa glass-card, gold-gradient, etc.)

### Demais paginas (Reto, Dia, Semana, Ranking, Perfil)
- Nenhuma mudanca de layout -- a atualizacao das CSS variables aplica o novo tema automaticamente

---

## 6. Utility Classes Atualizadas (index.css)

Atualizar os valores inline nos utilitarios:

- `.gold-gradient`: usar os novos valores gold (#D6B15A, #F3D68A, #B8903D)
- `.gold-text`: idem
- `.glass-card`: usar novo background surface + novo border
- `.gold-border`: usar novo border-gold com opacidade 0.25
- `.gold-glow`: usar novo gold para sombras

---

## Resumo dos Arquivos Modificados

```text
COPIAR:
  user-uploads://WhatsApp_Image_2026-02-12_at_12.51.27.jpeg -> src/assets/logo-renacer.jpeg

CRIAR:
  src/components/Logo.tsx  -- componente de logo reutilizavel

MODIFICAR:
  src/index.css            -- paleta de cores + utilitarios
  index.html               -- titulo, meta tags, theme-color
  src/pages/Auth.tsx       -- usar componente Logo
  src/pages/Index.tsx      -- adicionar Logo compacto no header
  src/pages/Admin.tsx      -- adicionar Logo compacto no header
```

Nenhuma funcionalidade e alterada. Apenas identidade visual e atualizada.
