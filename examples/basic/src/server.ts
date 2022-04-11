// Start server
import { startExpressServer as startServer } from 'vite-ssr-vue3/server'
import { createApp } from './main'

startServer({ createApp, root: __dirname, outDir: '..' })
