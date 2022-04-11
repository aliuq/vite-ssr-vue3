const { startExpressServer: startServer } = require('vite-ssr-vue3/server')
const { createApp } = require('../dist/server/main.cjs')

startServer({ createApp })
