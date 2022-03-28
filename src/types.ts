/* eslint-disable no-use-before-define */
import type { App } from 'vue'
import type { RouteRecordRaw, Router, RouterOptions as VueRouterOptions } from 'vue-router'

type PartialKeys<T, Keys extends keyof T> = Omit<T, Keys> & Partial<Pick<T, Keys>>

export interface ViteSSROptions {
  /**
   * The path of index.html file, relative to the project root
   *
   * @default `index.html`
   */
  input?: string
  /**
   * The path of main entry, relative to the project root
   *
   * @default `src/main.ts`
   */
  entry?: string
  /**
   * The app root container `id`.
   *
   * @default `app`
   */
  rootContainerId?: string
  /**
   * Enable use vite as a middleware
   *
   * @default process.env.NODE_ENV !== 'production'
   */
  useViteMiddleware?: boolean
  /**
   * The mode of the project
   *
   * @default vite.config.mode
   * @see https://cn.vitejs.dev/config/#mode
   */
  mode?: 'development' | 'production'
}

interface RenderHtml {
  appHtml?: string
  preloadLinks?: string
}

export interface ViteSSRContext<HasRouter extends boolean = true> {
  app: App<Element>
  isClient: boolean
  router: HasRouter extends true ? Router : undefined
  routes: HasRouter extends true ? RouteRecordRaw[] : undefined
  redirect: HasRouter extends true ? Router['replace'] : undefined
  initialState: Record<string, any>
  transformState?: (state: any) => any
  /**
   * Before render hooks
   */
  onBeforePageRender?: (context: ViteSSRContext<true>) => Promise<void> | void
  /**
   * After render hooks
   */
  onPageRender?: (renderOptions: { route: string; appHtml: string; preloadLinks: string; appCtx: ViteSSRContext<true> }) => Promise<RenderHtml | undefined> | RenderHtml | undefined
  /**
   * `undefined` on client side.
   */
  routePath?: string
  render?: (url: string, manifest: any) => Promise<{ appHtml: string; preloadLinks: string }>
}

export type RouterOptions = PartialKeys<VueRouterOptions, 'history'> & { base?: string }

export interface ViteSSRClientOptions {
  transformState?: (state: any) => any
  /**
   * The app root container query selector.
   *
   * @default `#app`
   */
  rootContainer?: string | Element
}

// extend vite.config.ts
declare module 'vite' {
  interface UserConfig {
    ssrOptions?: ViteSSROptions
  }
}
