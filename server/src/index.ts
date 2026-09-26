import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'

// Node >= 20.12: zero-dependency .env loading; missing file is fine (e.g. CI).
try {
  process.loadEnvFile()
} catch {
  // no .env — fall back to real environment variables
}

const app = new Hono()

app.use(logger())

app.get('/api/health', (c) => c.json({ ok: true }))

const port = Number(process.env.PORT) || 8787

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`server listening on http://localhost:${info.port}`)
})
