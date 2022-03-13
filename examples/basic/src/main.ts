import routes from 'virtual:generated-pages'
import { ViteSSR } from 'vite-ssr-vue3'
import App from './App.vue'

export const createApp = ViteSSR(App, { routes })
