/* eslint-disable @typescript-eslint/no-var-requires, no-console */
import { performance } from 'perf_hooks'
import path from 'path'
import type { ViteDevServer } from 'vite'
import express from 'express'
import { getEntryPoint, resolveViteConfig } from '../config'
import type { ViteSSRContext, ViteSSROptions } from '../types'
import { createStartServer } from '../server/common'
import { createRender } from './render'

const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITE_TEST_BUILD

async function createSSRServer(cliOptions: ViteSSROptions) {
  const viteConfig = await resolveViteConfig(cliOptions.mode)
  const mode = process.env.MODE || process.env.NODE_ENV || viteConfig.mode || 'production'
  const ssrOptions = Object.assign({}, viteConfig.ssrOptions, cliOptions)

  const root = viteConfig?.root || process.cwd()
  const outDir = viteConfig?.build?.outDir || 'dist'
  const out = path.isAbsolute(outDir) ? outDir : path.join(root, outDir)

  const isProduction = mode === 'production'
  const resolve = (dir: string) => path.resolve((isProduction ? out : root) as string, dir)

  const app = express()

  let vite: ViteDevServer = {} as any
  if (!isProduction) {
    vite = await require('vite').createServer({
      logLevel: isTest ? 'error' : 'info',
      server: {
        middlewareMode: 'ssr',
        watch: { usePolling: true, interval: 100 },
      },
    })
    app.use(vite.middlewares)
  }
  else {
    app.use(express.static(resolve('./client'), { index: false, maxAge: 600 }))
  }

  let entryModule = null
  if (!isProduction) {
    const entryFile = await getEntryPoint(ssrOptions, viteConfig)
    entryModule = await vite.ssrLoadModule(entryFile)
  }
  else {
    entryModule = require(resolve('./server/main.cjs'))
  }

  const createApp = entryModule.createApp
  // const context: ViteSSRContext = await createApp()

  const render = await createRender({
    isProd: isProduction,
    root,
    outDir,
    viteServer: vite,
    ssrOptions,
  })

  app.use('*', async(req, res, next) => {
    try {
      const url = req.originalUrl || req.url
      if (req.method !== 'GET' || url === '/favicon.ico')
        return next()

      globalThis.__ssr_start_time = performance.now()
      const context: ViteSSRContext = await createApp()

      let html = await render(url, { context })

      const time = Math.round(performance.now() - globalThis.__ssr_start_time)
      html += `\n<!-- 用时${time}ms -->\n`

      return res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    }
    catch (error: any) {
      vite?.ssrFixStacktrace?.(error as Error)
      console.error(error)
      res.status(500).end(error.stack)
    }
  })

  return { server: app, vite }
}

export const startServer = createStartServer(createSSRServer)
