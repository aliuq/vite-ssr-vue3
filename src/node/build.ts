/* eslint-disable no-console */
import { isAbsolute, join } from 'path'
import type { ResolvedConfig, UserConfig } from 'vite'
import { build as viteBuild } from 'vite'
import { getEntryPoint, resolveViteConfig } from '../config'
import { buildLog } from './utils'

export interface CliOptions {
  mode?: string
  format?: string
}

export async function build(cliOptions: CliOptions = {}) {
  const mode = process.env.MODE || process.env.NODE_ENV || cliOptions.mode || 'production'
  const config: ResolvedConfig = await resolveViteConfig(mode)

  const cwd = process.cwd()
  const root = config.root || cwd
  const outDir = config.build.outDir || 'dist'
  const out = isAbsolute(outDir) ? outDir : join(root, outDir)

  const { input } = Object.assign({}, config.ssrOptions || {}, cliOptions)

  buildLog('Build for client...')
  await viteBuild({
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
  } as UserConfig)

  buildLog('Build for server...')
  await viteBuild({
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
  } as UserConfig)
}
