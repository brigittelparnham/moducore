import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getDb } from './lib/db'
import { sessionMiddleware } from './middleware/auth'
import { authRoutes } from './routes/auth'
import { pagesRoutes, publicPagesRoutes } from './routes/pages'
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

app.get('/', (c) => c.json({ message: 'moducore api', status: 'ok' }))
app.get('/health', (c) => c.json({ status: 'ok' }))

serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log('API running on http://localhost:3000')
})
