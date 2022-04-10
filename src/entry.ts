import type { Component } from 'vue'
import { createApp as createClientApp, createSSRApp } from 'vue'
import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'
import type { RouterOptions, ViteSSRClientOptions, ViteSSRContext } from './types'
import { provideContext } from './components'
import { documentReady } from './utils/document-ready'
import { deserializeState } from './utils/state'
export { ClientOnly, useContext, useFetch } from './components'
export * from './types'

export function ViteSSR(
  App: Component,
  routerOptions: RouterOptions = { base: '/', routes: [] },
  fn?: (context: ViteSSRContext<true>) => Promise<void> | void,
  options: ViteSSRClientOptions = {},
): (client: boolean, routePath?: string) => Promise<ViteSSRContext> {
  const { transformState, rootContainer = '#app' } = options
  const isClient = typeof window !== 'undefined'

  // client - `true` is client side, `false` is server side
  async function createApp(client = false, routePath?: string) {
    const app = client ? createClientApp(App) : createSSRApp(App)

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
      routePath,
      render: undefined,
      onBeforePageRender: undefined,
      onPageRender: undefined,
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
      // context.render = createRender(app, context) as any
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
