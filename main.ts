import { Hono } from 'hono'
import { serveStatic } from 'hono/deno'

const app = new Hono()

// 静的ファイルの配信
app.use('/public/*', serveStatic({ root: './' }))
app.use('/style.css', serveStatic({ path: './public/style.css' }))
app.use('/script.js', serveStatic({ path: './public/script.js' }))

// メインページ
app.get('/', serveStatic({ path: './public/index.html' }))

Deno.serve(app.fetch)
