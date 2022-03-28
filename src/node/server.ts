/* eslint-disable @typescript-eslint/no-var-requires, no-console */
import { performance } from 'perf_hooks'
import type { AddressInfo, Server } from 'net'
import type { InlineConfig, ViteDevServer } from 'vite'
import { bold, cyan } from 'kolorist'
import fs from 'fs-extra'
import express from 'express'
import { getConfig, getEntry, getIndexTemplate } from '../config'
import type { ViteSSRContext, ViteSSROptions } from '../types'
import { serializeState } from '../utils/state'

const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITE_TEST_BUILD

export async function createSSRServer(cliOptions: ViteSSROptions) {
  const { ssrOptions, resolve } = await getConfig()
  const { useViteMiddleware, rootContainerId, mode }: ViteSSROptions = Object.assign({}, ssrOptions, cliOptions)

  const isProd = (process.env.MODE || process.env.NODE_ENV || mode) === 'production'

  const app = express()

  let vite: ViteDevServer = {} as any
  if (useViteMiddleware || !isProd) {
    vite = await require('vite').createServer({
      logLevel: isTest ? 'error' : 'info',
      server: {
        middlewareMode: 'ssr',
        watch: !isProd && {
          // During tests we edit the files too fast and sometimes chokidar
          // misses change events, so enforce polling for consistency
          usePolling: true,
          interval: 100,
        },
      },
    } as InlineConfig)
    // use vite's connect instance as middleware
    app.use(vite.middlewares)
  }
  if (isProd) {
    app.use(require('compression')())
    app.use(require('serve-static')(resolve('dist/client'), { index: false }))
  }
  // Polyfill window.fetch
  if (!globalThis.fetch) {
    const fetch = await import('node-fetch')
    // @ts-expect-error global variable
    globalThis.fetch = fetch.default || fetch
  }

  const container = `<div id="${rootContainerId}"></div>`
  let template: string
  let manifest: object = {}
  let createApp: any
  if (!isProd) {
    template = await getIndexTemplate()
    const entryFile = await getEntry()
    createApp = (await vite.ssrLoadModule(entryFile)).createApp
  }
  else {
    template = fs.readFileSync(resolve('./dist/client/index.html'), 'utf-8')
    manifest = fs.readJsonSync(resolve('./dist/client/ssr-manifest.json'))
    createApp = require(resolve('./dist/server/main.cjs')).createApp
  }

  app.use('*', async(req, res, next) => {
    try {
      const url = req.originalUrl
      if (req.method !== 'GET' || url === '/favicon.ico')
        return next()

      // @ts-expect-error global variable
      globalThis.__ssr_start_time = performance.now()

      if (!isProd) {
        template = await getIndexTemplate()
        template = await vite.transformIndexHtml(url, template)
      }
      const appCtx: ViteSSRContext = await createApp()
      const { render, transformState = serializeState, initialState, onBeforePageRender, onPageRender } = appCtx
      await onBeforePageRender?.(appCtx)
      let { appHtml, preloadLinks } = await render?.(url, manifest) as any

      // Hook `onPageRender`
      const { appHtml: _appHtml, preloadLinks: _preloadLinks } = (await onPageRender?.({
        route: url,
        appHtml,
        preloadLinks,
        appCtx,
      })) || {}
      appHtml = _appHtml || appHtml
      preloadLinks = _preloadLinks || preloadLinks

      const state = transformState(initialState)
      const stateScript = state
        ? `\n\t<script>window.__INITIAL_STATE__=${state}</script>`
        : ''
      let html = template
        .replace('</title>', `</title>\n${preloadLinks}`)
        .replace(container, `<div id="${ssrOptions.rootContainerId}">${appHtml}</div>${stateScript}`)

      // @ts-expect-error global variable
      const time = Math.round(performance.now() - globalThis.__ssr_start_time)
      // inject spent times
      html += `\n<!-- 用时${time}ms -->\n`

      return res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    }
    catch (e: any) {
      vite?.ssrFixStacktrace(e as Error)
      console.error(e)
      res.status(500).end(e.stack)
    }
  })
  return { app, vite }
}

export async function start(args: any) {
  // @ts-expect-error global variable
  globalThis.__ssr_ready = performance.now()
  return await createSSRServer(args).then(({ app, vite }) => {
    const server = app.listen(args.port)
    printInfo(server, vite)
  })
}

function printInfo(server: Server, vite: ViteDevServer) {
  const info = vite.config ? vite.config.logger.info : console.info

  const address = server.address()
  const isAddressInfo = (x: any): x is AddressInfo => x?.address
  if (isAddressInfo(address)) {
    const ad = cyan(`http://localhost:${bold(address.port)}`)

    let msg = `\n  express v${require('express/package.json').version}`
    if (vite.config)
      msg += `  +  vite v${require('vite/package.json').version}`

    info(
      cyan(msg),
      vite.config ? { clear: !vite.config.logger.hasWarned } : '',
    )

    info('\n  -- SSR mode \n')

    info(`  >  Running at:  ${ad}`)

    if (vite.config && vite.config.plugins.find(p => p.name.includes('unocss:inspector')))
      info(`  >  Unocss:      ${ad}${cyan('/__unocss')}`)

    if (vite.config && vite.config.plugins.find(p => p.name.includes('vite-plugin-inspect')))
      info(`  >  Inspect:     ${ad}${cyan('/__inspect')}`)

    // @ts-expect-error global variable
    const time = Math.round(performance.now() - globalThis.__ssr_ready)
    info(cyan(`\n  ready in ${time}ms.\n`))
  }
}
