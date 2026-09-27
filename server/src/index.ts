import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { createChatRouter } from './chat'

// Node >= 20.12: zero-dependency .env loading; missing file is fine (e.g. CI).
try {
  process.loadEnvFile()
} catch {
  // no .env — fall back to real environment variables
}

const app = new Hono()

app.use(logger())

const model = process.env.OPENROUTER_MODEL ?? 'google/gemma-4-31b-it:free'

app.get('/api/health', (c) => c.json({ ok: true, model }))

app.route(
  '/',
  createChatRouter(
    () => model,
    () => process.env.OPENROUTER_API_KEY,
  ),
)

if (!process.env.OPENROUTER_API_KEY) {
  console.warn('WARN: OPENROUTER_API_KEY is not set — /api/chat will return 500 until you add server/.env')
}

const port = Number(process.env.PORT) || 8787

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`server listening on http://localhost:${info.port}`)
})
