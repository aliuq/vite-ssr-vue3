import config from './vite.config'
/**
 * @type {import('vite').UserConfig}
 */
module.exports = Object.assign(config, {
  ssrOptions: {
    serverConfig: {
      build: {
        ssr: './src/server',
      },
      ssr: {
        noExternal: /./,
      },
    },
  },
})
