

## Trocar a Logo Principal em Todos os Posicionamentos

### Resumo
Substituir a logo atual (`logo-365.png`) pela nova imagem dourada do "P" (`principal.png`) em todos os locais onde ela aparece no app.

### Arquivos Afetados

1. **`src/assets/logo-365.png`** -- Substituir pelo arquivo `principal.png` enviado (copiar `user-uploads://principal.png` para `src/assets/logo-365.png`). Como todos os componentes importam este mesmo arquivo, a troca automaticamente reflete em todos os lugares:
   - Tela de login (`Auth.tsx`)
   - Header do app (`Index.tsx`, `CalendarioAno.tsx`, `Admin.tsx`)
   - Gate de acesso (`EntitlementGate.tsx`)
   - Qualquer outro local que use `Logo`, `AppLogo` ou `BrandLogo`

2. **Nenhuma alteracao de codigo necessaria** -- O componente `AppLogo` ja importa `@/assets/logo-365.png`, entao basta substituir o arquivo de imagem.

### Detalhes Tecnicos
- Copiar `user-uploads://principal.png` para `src/assets/logo-365.png` (sobrescreve o arquivo existente)
- O Vite reprocessa automaticamente o asset com novo hash, forcando atualizacao do cache
- As dimensoes de exibicao ja sao controladas pelo componente `AppLogo` (40px header, 160px login, 168px secoes), entao a nova imagem sera redimensionada proporcionalmente

