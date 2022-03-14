import type { Component } from 'vue'
import { createApp as createClientApp, createSSRApp } from 'vue'
import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'
import { renderToString } from 'vue/server-renderer'
import { provideContext } from './components'
import type { RouterOptions, ViteSSRClientOptions, ViteSSRContext } from './types'
import { documentReady } from './utils/document-ready'
import { deserializeState } from './utils/state'

export { ClientOnly, useContext, useFetch } from './components'
export * from './types'

export function ViteSSR(
  App: Component,
  routerOptions: RouterOptions,
  fn?: (context: ViteSSRContext<true>) => Promise<void> | void,
  options: ViteSSRClientOptions = {},
) {
  const { transformState, rootContainer = '#app' } = options
  const isClient = typeof window !== 'undefined'

  async function createApp(client = false, routePath?: string) {
    const app = client ? createSSRApp(App) : createClientApp(App)

    const router = createRouter({
      history: client ? createWebHistory(routerOptions.base) : createMemoryHistory(routerOptions.base),
      ...routerOptions,
    })

    const { routes } = routerOptions

    const context: ViteSSRContext<true> = {
      app,
      isClient,
      router,
      routes,
      redirect: router.replace,
      initialState: {},
      transformState,
      serverRender: undefined,
      cache: new Map(),
      routePath,
    }

    if (client) {
      await documentReady()
      // @ts-expect-error global variable
      context.initialState = transformState?.(window.__INITIAL_STATE__ || {}) || deserializeState(window.__INITIAL_STATE__)
    }

    provideContext(app, context)

    await fn?.(context)

    app.use(router)

    let entryRoutePath: string | undefined
    let isFirstRoute = true
    router.beforeEach((to, from, next) => {
      if (isFirstRoute || (entryRoutePath && entryRoutePath === to.path)) {
        // The first route is rendered in the server and its state is provided globally.
        isFirstRoute = false
        entryRoutePath = to.path
        to.meta.state = context.initialState
      }

      next()
    })

    if (!client) {
      const route = context.routePath ?? routerOptions.base ?? '/'
      router.push(route)

      await router.isReady()
      context.initialState = router.currentRoute.value.meta.state as Record<string, any> || {}

      context.serverRender = async(url: string, manifest: any) => {
        await router.push(url)
        await router.isReady()

        const ctx: any = {}
        const html = await renderToString(app, ctx)
        const preloadLinks = await renderPreloadLinks(ctx.modules, manifest)

        return [html, preloadLinks]
      }
    }

    const initialState = context.initialState

    return { ...context, initialState } as ViteSSRContext<true>
  }

  if (isClient) {
    (async() => {
      const { app, router } = await createApp(true)
      // wait until page component is fetched before mounting
      await router.isReady()
      app.mount(rootContainer, true)
    })()
  }

  return createApp
}

async function renderPreloadLinks(modules: any, manifest: any) {
  let links = ''
  const seen = new Set()
  const { basename } = await import('path')
  modules.forEach((id: any) => {
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
