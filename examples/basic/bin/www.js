// Start server
const { startServer } = require('vite-ssr-vue3/express')
const { createApp } = require('../dist/server/main.cjs')

startServer({ createApp })
