import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    { input: 'src/index', name: 'index' },
    { input: 'src/node/cli', name: 'node/cli' },
  ],
  clean: true,
  declaration: true,
  externals: [
    'vue',
    'vite',
    'vue/server-renderer',
    'vue/compiler-sfc',
  ],
  rollup: {
    emitCJS: true,
  },
})
