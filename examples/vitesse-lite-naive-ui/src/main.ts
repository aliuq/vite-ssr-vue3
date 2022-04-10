import routes from 'virtual:generated-pages'
import { ViteSSR } from 'vite-ssr-vue3'
import { setup } from '@css-render/vue3-ssr'
import App from './App.vue'

import '@unocss/reset/tailwind.css'
import './styles/main.css'
import 'uno.css'

export const createApp = ViteSSR(App, { routes }, (ctx) => {
  if (!ctx.isClient) {
    let collect: any
    ctx.onBeforePageRender = () => {
      collect = setup(ctx.app).collect
    }
    ctx.onPageRender = ({ preloadLinks }) => {
      preloadLinks += collect()
      return { preloadLinks }
    }
  }
})
