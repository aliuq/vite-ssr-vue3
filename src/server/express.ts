/* eslint-disable @typescript-eslint/no-var-requires, no-console */
import path from 'path'
import express from 'express'
import type { CreateServerOptions, ViteSSRContext } from '../types'
import { createRender } from '../node/render'
import { createStartServer } from './common'
const { performance } = require('perf_hooks')

export async function createServer({
  createApp,
  routePath,
  root = process.cwd(),
  outDir = 'dist',
}: CreateServerOptions) {
  const out = path.isAbsolute(outDir) ? outDir : path.join(root, outDir)
  const resolve = (dir: string) => path.resolve(out, dir)

  const app = express()
  app.use(express.static(resolve('./client'), {
    index: false,
    maxAge: '1y',
  }))

  const render = await createRender({ isProd: true, root, outDir })

  app.use('*', async(req, res, next) => {
    try {
      const url = req.originalUrl || req.url
      if (req.method !== 'GET' || url === '/favicon.ico')
        return next()

      globalThis.__ssr_start_time = performance.now()
      const context: ViteSSRContext = await createApp(false, routePath)
      let html = await render(url, { context })

      const time = Math.round(performance.now() - globalThis.__ssr_start_time)
      html += `\n<!-- 用时${time}ms -->\n`

      return res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    }
    catch (error: any) {
      console.error(error)
      res.status(500).end(error.stack)
    }
  })

  return { server: app }
}

export const startServer = createStartServer(createServer)
