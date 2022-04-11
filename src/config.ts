import path, { join as _join, resolve as _resolve } from 'path'
import { resolveConfig } from 'vite'
import type { InlineConfig, ResolvedConfig } from 'vite'
import fs from 'fs-extra'

import type { ViteSSROptions } from './types'

let __CONFIG__: ResolvedConfig

export async function getConfig(mode: string | undefined = process.env.NODE_ENV) {
  if (!__CONFIG__)
    __CONFIG__ = await resolveConfig({}, 'build', mode)

  const ssrOptions: ViteSSROptions = Object.assign({
    input: 'index.html',
    entry: 'src/main',
    rootContainerId: 'app',
    useViteMiddleware: process.env.NODE_ENV !== 'production',
    mode: __CONFIG__.mode,
  }, __CONFIG__?.ssrOptions || {})

  const join = (dir: string) => _join(__CONFIG__.root, dir)

  const resolve = (dir: string) => _resolve(__CONFIG__.root, dir)

  return {
    config: __CONFIG__,
    ssrOptions,
    join,
    resolve,
  }
}

export async function getSsrOptions(mode?: string | undefined) {
  const { ssrOptions } = await getConfig(mode)
  return ssrOptions
}

export async function getEntry(mode?: string | undefined) {
  const { join } = await getConfig(mode)
  const html = await getIndexTemplate(mode)
  // <script type="module" src="/src/main.ts"></script>
  const matches = html.match(/<script type="module" src="(.*)"/i)
  const entryFile = matches?.[1] || 'src/main'
  return join(entryFile)
}

export async function getIndexTemplate(mode?: string | undefined) {
  const { join, ssrOptions } = await getConfig(mode)
  return fs.readFileSync(join(ssrOptions.input as string), 'utf-8')
}

// Get main entry file, `src/main`
export async function getEntryPoint(
  ssrOption: ViteSSROptions,
  config?: ResolvedConfig,
  indexHtml?: string,
) {
  if (!config)
    config = await resolveViteConfig()
  if (!indexHtml)
    indexHtml = fs.readFileSync(ssrOption.input || path.resolve(config.root, 'index.html'), 'utf-8')
  // <script type="module" src="/src/main.ts"></script>
  const matches = indexHtml.match(/<script type="module" src="(.*)"/i)
  const entryFile = matches?.[1] || 'src/main'
  return path.join(config.root, entryFile)
}

// Get all vite configurations
export function resolveViteConfig(mode?: string, config: InlineConfig = {}) {
  return resolveConfig(config, 'build', mode || process.env.MODE || process.env.NODE_ENV)
}
