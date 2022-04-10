import path from 'path'
import fs from 'fs-extra'
import { renderToString } from 'vue/server-renderer'
import { serializeState } from '../utils/state'
import type { CreateRenderOptions, RenderOptions, ViteSSROptions } from '../types'

/**
 * Create a render function environment to avoid regenerate variables in request.
 * it will returns a render function for every request.
 *
 * @returns a render function
 */
export async function createRender({
  isProd = false,
  root = process.cwd(),
  outDir = 'dist',
  context: _context,
  viteServer,
  ssrOptions = {},
}: CreateRenderOptions) {
  const out = path.isAbsolute(outDir) ? outDir : path.join(root, outDir)
  const resolve = (dir: string) => path.resolve((isProd ? out : root) as string, dir)
  const templatePath = resolve(isProd ? './client/index.html' : 'index.html')

  const getTemplate = () => {
    return fs.existsSync(templatePath)
      ? fs.readFileSync(templatePath, 'utf-8')
      : getDefaultTemplate(ssrOptions as ViteSSROptions)
  }
  const _template = getTemplate()
  const manifest = isProd
    ? (await fs.readJSON(resolve('./client/ssr-manifest.json')), 'utf-8')
    : {}

  // Polyfill window.fetch
  if (!globalThis.fetch) {
    const fetch = await import('node-fetch')
    // @ts-expect-error global variable
    globalThis.fetch = fetch.default || fetch
  }

  const render = async(url: string, opts?: RenderOptions) => {
    const context = _context || opts?.context
    if (!context)
      throw new Error('context is required')

    const {
      router,
      transformState = serializeState,
      initialState,
      onBeforePageRender,
      onPageRender,
      app,
    } = context

    await router.push(url)
    await router.isReady()

    // Before page render hook
    await onBeforePageRender?.(context)

    const ctx: any = {}
    let appHtml = await renderToString(app, ctx)

    let preloadLinks = await renderPreloadLinks(ctx.modules, manifest)

    let template = _template
    if (!isProd) {
      template = getTemplate()
      template = (await viteServer?.transformIndexHtml(url, template)) as string
    }

    // After page render hook
    const pageRenderResult = await onPageRender?.({
      route: url,
      appCtx: context,
      appHtml,
      preloadLinks,
    })
    appHtml = pageRenderResult?.appHtml || appHtml
    preloadLinks = pageRenderResult?.preloadLinks || preloadLinks

    const state = transformState(initialState)
    const stateScript = state
      ? `\n\t<script>window.__INITIAL_STATE__=${state}</script>`
      : ''

    const html = template
      .replace('</title>', `</title>\n${preloadLinks}`)
      .replace(
        '<div id="app"></div>',
        `<div id="app">${appHtml}</div>${stateScript}`,
      )

    return html
  }

  return render
}

export async function renderPreloadLinks(modules: any, manifest: any) {
  let links = ''
  const seen = new Set()
  const { basename } = await import('path')

  modules && modules.forEach((id: any) => {
    const files = manifest[id]
    if (files) {
      files.forEach((file: any) => {
        if (!seen.has(file)) {
          seen.add(file)
          const filename = basename(file)
          if (manifest[filename]) {
            for (const depFile of manifest[filename]) {
              links += renderPreloadLink(depFile)
              seen.add(depFile)
            }
          }
          links += renderPreloadLink(file)
        }
      })
    }
  })
  return links
}

function renderPreloadLink(file: string) {
  if (file.endsWith('.js')) {
    return `<link rel="modulepreload" crossorigin href="${file}">`
  }
  else if (file.endsWith('.css')) {
    return `<link rel="stylesheet" href="${file}">`
  }
  else if (file.endsWith('.woff')) {
    return ` <link rel="preload" href="${file}" as="font" type="font/woff" crossorigin>`
  }
  else if (file.endsWith('.woff2')) {
    return ` <link rel="preload" href="${file}" as="font" type="font/woff2" crossorigin>`
  }
  else if (file.endsWith('.gif')) {
    return ` <link rel="preload" href="${file}" as="image" type="image/gif">`
  }
  else if (file.endsWith('.jpg') || file.endsWith('.jpeg')) {
    return ` <link rel="preload" href="${file}" as="image" type="image/jpeg">`
  }
  else if (file.endsWith('.png')) {
    return ` <link rel="preload" href="${file}" as="image" type="image/png">`
  }
  else {
    // TODO
    return ''
  }
}

function getDefaultTemplate(ssrOptions: ViteSSROptions) {
  const { rootContainerId = 'app', entry = 'src/main.ts' } = ssrOptions
  const template = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>Vite SSR</title>
        <style>
          body {
            margin: 0;
            padding: 0;
          }
        </style>
      </head>
      <body>
        <div id="${rootContainerId}"></div>
        <script type="module" src="${entry}"></script>
      </body>
    </html>
  `
  return template
}
