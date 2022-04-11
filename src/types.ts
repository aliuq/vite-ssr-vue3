/* eslint-disable no-use-before-define */
import type { UserConfigExport, ViteDevServer } from 'vite'
import type { App } from 'vue'
import type { RouteRecordRaw, Router, RouterOptions as VueRouterOptions } from 'vue-router'

type PartialKeys<T, Keys extends keyof T> = Omit<T, Keys> & Partial<Pick<T, Keys>>
type OmitExcludeKey<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

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
  clientConfig?: UserConfigExport
  serverConfig?: UserConfigExport
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

export interface CreateRenderOptions {
  /**
   * Enable production mode
   *
   * @default `false`
   */
  isProd?: boolean
  /**
   * Resolve the path of the index.html file,
   * it works in  isProd's value is `false` or outDir's value is a relative path
   *
   * @default `process.cwd()`
   */
  root?: string
  /**
   * Build the output directory, only works in production mode
   *
   * @default `dist`
   */
  outDir?: string
  context?: ViteSSRContext
  viteServer?: ViteDevServer
  ssrOptions?: ViteSSROptions
}

export interface RenderOptions {
  context?: ViteSSRContext
}

export type CreateServerOptions = {
  routePath?: string
  createApp: (client: false, routePath?: string) => Promise<ViteSSRContext>
} & CreateRenderOptions

// extend vite.config.ts
declare module 'vite' {
  interface UserConfig {
    ssrOptions?: ViteSSROptions
  }
}

declare global {
  // eslint-disable-next-line vars-on-top, no-var
  var __ssr_start_time: number
  // eslint-disable-next-line vars-on-top, no-var
  var __ssr_ready_time: number
}
