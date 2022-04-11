// @ts-check
const path = require('path')
const express = require('express')
const { createRender } = require('vite-ssr-vue3/server')

async function createServer() {
  const out = path.join(__dirname, '../dist')
  const resolve = p => path.resolve(out, p)
  const app = express()
  app.use(express.static(resolve('./client'), {
    index: false,
    maxAge: '1y',
  }))

  const render = await createRender({ isProd: true, root: __dirname, outDir: '../dist' })
  const { createApp } = require(resolve('./server/main.cjs'))

  app.use('*', async(req, res) => {
    try {
      const url = req.originalUrl

      if (req.method !== 'GET' || url === '/sw.js' || url === '/favicon.ico')
        return

      const context = await createApp(false)
      let html = await render(url, { context })

      html += '\n<!-- From customize server -->'

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    }
    catch (error) {
      console.error(error)
      res.status(500).end(error.stack)
    }
  })

  return { server: app }
}

createServer().then(({ server }) =>
  server.listen(3000, () => {
    // eslint-disable-next-line no-console
    console.info('http://localhost:3000')
  }),
)
