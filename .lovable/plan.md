

# Redesenho Premium da Home "Tu Misión Hoy"

A Home atual ja tem a estrutura correta (hero + 5 tasks + deposito). O foco e elevar o visual para nivel high-ticket e melhorar a interacao de notas.

---

## 1. DailyChecklist Premium (DailyChecklist.tsx)

Transformar de lista simples para checklist premium:

- Envolver toda a lista em um `glass-card rounded-2xl` com padding
- Cada task vira um card individual com `bg-card/30 rounded-xl p-4` e borda sutil
- Checkbox maior: `w-7 h-7` com animacao de scale ao completar
- Adicionar numero do momento: "01", "02", etc. (receber `index` no map)
- Categoria como badge/chip colorido (nao so texto pequeno)
- Ao completar: animacao CSS de pulse dourado no checkbox (ja existe `.pulse-gold`)
- Nota: trocar de textarea inline para **Dialog/modal** "Tu Cuaderno" que abre ao marcar task
  - Modal com titulo do momento, textarea, botao "Guardar"
  - Momento 5: nota obrigatoria (botao desabilitado se vazio)
  - Momentos 1-4: nota opcional com placeholder "Escribe una linea sobre tu experiencia..."
  - Ao fechar/guardar: salva nota via onNoteSave

### Props novas
- Adicionar `onTaskComplete?: (taskId: string) => void` para separar toggle de celebracao
- O modal abre automaticamente quando `completed` muda de false para true

---

## 2. Hero Compacto Premium (Index.tsx)

Ajustes no hero atual:

- Adicionar subtexto: "Llego tu nuevo reto" abaixo do titulo
- Chip com fundo `gold-gradient` sutil em vez de `bg-card/80`
- Altura do hero: manter `h-44` (compacto)
- Gradiente overlay mais forte na base para legibilidade
- Sem mudancas estruturais (ja esta correto)

---

## 3. Greeting Simplificado (Index.tsx)

- Remover subtexto "Tu mision de hoy te espera" (redundante com o hero)
- Manter so "Hola, {displayName}" como ancora visual

---

## 4. Announcement Card Opcional (Index.tsx)

- Adicionar `AnnouncementBanner` entre Deposito e BottomNav
- Importar de `@/components/AnnouncementBanner`
- Se nao houver announcements, nao renderiza nada (ja implementado no componente)

---

## 5. Barra de Progresso e Botao "Concluir Dia" (Index.tsx)

- Barra de progresso: manter como esta (gold gradient, sutil)
- Botao "Concluir Dia": manter como esta (ja premium com shimmer + gold-glow)
- Adicionar margem superior ao botao para separacao visual

---

## 6. Espacamento e Acabamento (Index.tsx)

- Aumentar `space-y-6` para `space-y-8` no main
- Header: remover `border-b` (mais limpo)
- Section "Tus 5 momentos": titulo em Playfair (ja usa `.section-title`)

---

## Arquivos a modificar

```text
src/components/DailyChecklist.tsx  -- UI premium + modal de notas
src/pages/Index.tsx                -- Hero tweaks + announcement + espacamento
```

### Detalhes tecnicos

**DailyChecklist.tsx** mudancas principais:
- Importar `Dialog` de `@/components/ui/dialog`
- State: `noteModalTask` (task id do modal aberto)
- Ao toggle de false->true: abrir modal automaticamente
- Modal: titulo do momento, textarea, botao Guardar
- Momento 5 (index 4): validar nota nao vazia
- Cada task item: glass card individual com padding, numero, badge de categoria

**Index.tsx** mudancas:
- Importar `AnnouncementBanner`
- Adicionar subtexto no hero
- Chip com estilo gold
- Remover subtexto do greeting
- Aumentar espacamento
- Remover border do header
