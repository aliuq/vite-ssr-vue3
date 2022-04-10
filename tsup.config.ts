import type { Options } from 'tsup'

export default <Options><unknown>{
  entryPoints: {
    'index': 'src/index.ts',
    'express': 'src/server/express.ts',
    'node/cli': 'src/node/cli.ts',
  },
  dts: true,
  target: 'node14',
  format: [
    'esm',
    'cjs',
  ],
  external: [
    'vue',
    'vite',
    'vue/server-renderer',
    'vue/compiler-sfc',
  ],
  clean: true,
  esbuildOptions: (options: any, { format }: any) => {
    options.outExtension = { '.js': format === 'cjs' ? '.cjs' : format === 'esm' ? '.mjs' : '.js' }
  },
}
