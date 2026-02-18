import { Pool } from 'pg'

// Shared connection pool for the classifica_ai Postgres database
export const classifica_ai_pool = new Pool({
  connectionString:
    process.env.CLASSIFICA_AI_PG_DSN ??
    'postgresql://garrymoltonsmith@localhost:5432/classifica_ai',
  max: 5,
  idleTimeoutMillis: 30000,
})
