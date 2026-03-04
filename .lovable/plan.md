

## Plano: Verificar e criar acessos para lista de alunos

### Análise
- O programa é `progress_2026` com ID `a0000000-0000-0000-0000-000000000001`
- A lista contém ~350 linhas com muitos emails duplicados
- Já existe a Edge Function `admin-import-csv` que faz exatamente isso: verifica se o usuário existe, cria se necessário (senha padrão `renacer123`), e faz upsert no `access_control` com status `active`

### Plano de execução
1. **Deduplicar a lista** — remover emails repetidos e linhas vazias
2. **Chamar a Edge Function `admin-import-csv`** com os dados limpos via `curl_edge_functions`, enviando:
   - `program_id`: `a0000000-0000-0000-0000-000000000001`
   - `default_status`: `active`
   - `rows`: array de `{ email, full_name }`
3. **Verificar o resultado** — a função retorna um relatório com `created_users`, `existing_users`, `upserts` e `errors`

### Detalhes técnicos
- A função já faz upsert em `access_control` (conflito em `user_id,program_id`) e `access_entitlements` para backwards compat
- Usuários novos são criados com senha `renacer123` e email confirmado
- Todas as ações são registradas em `audit_logs`
- A lista tem ~215 emails únicos após deduplicação

Nenhuma alteração de código é necessária — apenas execução da função existente.

