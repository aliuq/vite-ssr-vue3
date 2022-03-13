import type { Options } from 'tsup'

export default <Options><unknown>{
  entryPoints: [
    'src/index.ts',
    'src/node/cli.ts',
  ],
  dts: true,
  target: 'node14',
  format: [
    'esm',
    'cjs',
  ],
  external: [
    'vue',
    'vue/server-renderer',
    'vue/compiler-sfc',
  ],
  clean: true,
  esbuildOptions: (options: any, { format }: any) => {
    options.outExtension = { '.js': format === 'cjs' ? '.cjs' : format === 'esm' ? '.mjs' : '.js' }
  },
}
