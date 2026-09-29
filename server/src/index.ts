import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
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

// In production (container / built deploy) the server also serves the built
// client. In dev the dist folder does not exist and Vite owns the frontend.
// Anchor to this file, not cwd: npm workspaces run scripts with the
// workspace dir as cwd, so a naive relative path breaks under `npm -w`.
const clientDist = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'client',
  'dist',
)
if (existsSync(clientDist)) {
  // @hono/node-server's serve-static resolves its root against process.cwd().
  app.use('*', serveStatic({ root: relative(process.cwd(), clientDist) }))
  // SPA fallback: any non-API GET gets the app shell.
  app.get('*', async (c) => {
    if (c.req.path.startsWith('/api/')) {
      return c.json({ error: 'Not found' }, 404)
    }
    const index = await readFile(join(clientDist, 'index.html'), 'utf8')
    return c.html(index)
  })
}

if (!process.env.OPENROUTER_API_KEY) {
  console.warn('WARN: OPENROUTER_API_KEY is not set — /api/chat will return 500 until you add server/.env')
}

const port = Number(process.env.PORT) || 8787

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`server listening on http://localhost:${info.port}`)
})
