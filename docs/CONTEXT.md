# Contexto Atual do Projeto

## Status Geral
- **Fase atual:** 0 - Setup Inicial
- **Ultima atualizacao:** 2026-01-30
- **Proxima tarefa:** Fase 2 - Banco de Dados (schema, models, migrations)

## O que esta funcionando
- [x] Estrutura de pastas criada
- [x] Docker Compose local (PostgreSQL 15, Redis 7, Adminer)
- [x] .env.example com todas as variaveis
- [x] .gitignore configurado
- [x] Dockerfiles base (API e Dashboard)
- [x] requirements.txt com dependencias do backend
- [x] package.json skeleton do frontend

## O que falta
- [ ] Fase 1: Design no Figma (telas e componentes)
- [ ] Fase 2: Schema do banco, models SQLAlchemy, migrations Alembic
- [ ] Fase 3: Backend API completo (auth, CRUD, Twitter, Claude, workers)
- [ ] Fase 4: Frontend Dashboard (Next.js, todas as paginas)
- [ ] Fase 5: Infraestrutura e deploy (VPS, CI/CD, monitoramento)

## Decisoes tomadas
1. **2026-01-30** - Stack definida: FastAPI + Next.js 14 + PostgreSQL + Redis + Claude API
2. **2026-01-30** - Async PostgreSQL com asyncpg como driver
3. **2026-01-30** - Celery com Redis como broker para tarefas em background
4. **2026-01-30** - JWT para autenticacao com access + refresh tokens
5. **2026-01-30** - Tokens Twitter criptografados no banco (Fernet)

## Problemas conhecidos
- Nenhum ate o momento

## Notas para proxima sessao
- Criar schema SQL completo para PostgreSQL
- Configurar Alembic para migrations async
- Implementar models SQLAlchemy com relacionamentos
- Configurar servicos externos (Twitter Developer App, Claude API key)
