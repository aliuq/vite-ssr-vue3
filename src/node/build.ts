/* eslint-disable no-console */
import { isAbsolute, join } from 'path'
import type { ResolvedConfig, UserConfig } from 'vite'
import { mergeConfig, build as viteBuild } from 'vite'
import { getEntryPoint, resolveViteConfig } from '../config'
import { buildLog } from './utils'

export interface CliOptions {
  mode?: string
  format?: string
  config?: string
}

export async function build(cliOptions: CliOptions = {}) {
  const mode = process.env.MODE || process.env.NODE_ENV || cliOptions.mode || 'production'
  const config: ResolvedConfig = await resolveViteConfig(mode, { configFile: cliOptions.config })

  const cwd = process.cwd()
  const root = config.root || cwd
  const outDir = config.build.outDir || 'dist'
  const out = isAbsolute(outDir) ? outDir : join(root, outDir)

  const { input, clientConfig = {}, serverConfig = {} } = Object.assign({}, config.ssrOptions || {}, cliOptions)

  buildLog('Build for client...')
  await viteBuild(mergeConfig({
    build: {
      ssrManifest: true,
      outDir: join(out, 'client'),
      rollupOptions: {
        input: {
          app: join(root, input || 'index.html'),
        },
      },
    },
    mode: config.mode,
  }, clientConfig) as UserConfig)

  buildLog('Build for server...')
  await viteBuild(mergeConfig({
    build: {
      ssr: await getEntryPoint(config.ssrOptions || {}, config),
      outDir: join(out, 'server'),
      minify: false,
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          entryFileNames: '[name].cjs',
          format: 'cjs',
        },
      },
    },
    mode: config.mode,
  }, serverConfig) as UserConfig)
}
