import 'dotenv/config'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getDb } from './lib/db'
import { sessionMiddleware } from './middleware/auth'
import { authRoutes } from './routes/auth'
import { pagesRoutes, publicPagesRoutes } from './routes/pages'
import { journalRoutes } from './routes/journal'
import { appsRoutes } from './routes/apps'
import { embedTokensRoutes } from './routes/embed-tokens'
import { embedRoutes } from './routes/embed'
import { connectorsRoutes } from './routes/connectors'
import { mediaRoutes } from './routes/media'
import { tenantsRoutes } from './routes/tenants'
import { startScheduler } from './scheduler'
import type { AppVariables } from './types'

const db = getDb()
const app = new Hono<{ Variables: AppVariables }>()

app.use(
  cors({
    origin: [
      process.env.CMS_URL ?? 'http://localhost:3001',
      process.env.JOURNAL_URL ?? 'http://localhost:3002',
    ],
    credentials: true,
  })
)

app.use(sessionMiddleware(db))

app.route('/auth', authRoutes)
app.route('/pages', pagesRoutes)
app.route('/public', publicPagesRoutes)
app.route('/journal', journalRoutes)
app.route('/apps', appsRoutes)
app.route('/embed-tokens', embedTokensRoutes)
app.route('/embed', embedRoutes)
app.route('/connectors', connectorsRoutes)
app.route('/media', mediaRoutes)
app.route('/tenants', tenantsRoutes)

// Serve uploaded files — accessible by CMS, journal, and external embeds
app.use('/uploads/*', serveStatic({ root: './' }))

app.get('/', (c) => c.json({ message: 'moducore api', status: 'ok' }))
app.get('/health', (c) => c.json({ status: 'ok' }))

serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log('API running on http://localhost:3000')
  startScheduler()
})
