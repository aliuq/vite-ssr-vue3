/* eslint-disable no-console */
import { isAbsolute, join } from 'path'
import { build as viteBuild } from 'vite'
import { getConfig, getEntry } from '../config'
import { buildLog } from './utils'

export interface CliOptions {
  mode?: string
  format?: string
}

export async function build(cliOptions: CliOptions = {}) {
  const mode = process.env.MODE || process.env.NODE_ENV || cliOptions.mode || 'production'
  const { config, ssrOptions } = await getConfig(mode)

  const cwd = process.cwd()
  const root = config.root || cwd
  const outDir = config.build.outDir || 'dist'
  const out = isAbsolute(outDir) ? outDir : join(root, outDir)

  const { format = 'cjs' } = Object.assign({}, ssrOptions || {}, cliOptions)

  // client
  buildLog('Build for client...')
  await viteBuild({
    build: {
      ssrManifest: true,
      outDir: join(out, 'client'),
      rollupOptions: {
        input: {
          app: join(root, ssrOptions.input as string),
        },
      },
    },
    mode: config.mode,
  })

  buildLog('Build for server...')
  await viteBuild({
    build: {
      ssr: await getEntry(),
      outDir: join(out, 'server'),
      minify: false,
      cssCodeSplit: false,
      rollupOptions: {
        output: format === 'esm'
          ? {
            entryFileNames: '[name].mjs',
            format: 'esm',
          }
          : {
            entryFileNames: '[name].cjs',
            format: 'cjs',
          },
      },
    },
    mode: config.mode,
  })
}
