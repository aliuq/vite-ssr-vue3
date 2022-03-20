import { ViteSSR } from 'vite-ssr-vue3'
import { setup } from '@css-render/vue3-ssr'
import App from './App.vue'

export const createApp = ViteSSR(App, undefined, (ctx) => {
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
