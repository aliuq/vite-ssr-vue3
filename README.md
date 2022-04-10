# Vite-SSR-Vue3

![version](https://img.shields.io/npm/v/vite-ssr-vue3)

Vite plugin for vue Server-Side Rendering, Used express to create a server.

## Usage

### Install

```bash
# npm
npm install -D vite-ssr-vue3 vue-router

# yarn
yarn add -D vite-ssr-vue3 vue-router

# pnpm
pnpm add -D vite-ssr-vue3 vue-router

# pnpm workspaces
pnpm add -D vite-ssr-vue3 vue-router -F <Repo Name> 
```

Modify `package.json` scripts to:

```diff
{
  "scripts": {
-   "dev": "vite --port 3333",
+   "dev": "vite-ssr --port 3333",
-   "build": "vite build",
+   "build": "vite-ssr build",
+   "serve": "vite-ssr --mode production"
  },
}
```

```ts
// src/main.ts
import { ViteSSR } from 'vite-ssr-vue3'
import routes from './routes'
import App from './App.vue'

// Export `createApp` function is required by vite-ssr
export const createApp = ViteSSR(App, { routes }, (context) => {
  // if (import.meta.env.SSR) {
  //   // Running in server
  // } else {
  //   // Running in browser
  // }
})
```

### Initial State

```ts
// src/main.ts
import { ViteSSR } from 'vite-ssr-vue3'
import routes from './routes'
import App from './App.vue'

export const createApp = ViteSSR(App, { routes }, (context) => {
  const { app, initialState } = context

  // Use pinia to store your data
  const pinia = createPinia()

  if (import.meta.env.SSR)
    initialState.pinia = pinia.state.value
  else
    pinia.state.value = initialState.pinia

})
```

### Data Fetching

```ts
import { useFetch } from 'vite-ssr-vue3'

const counts = await useFetch('counts', () => Promise.resolve([1, 2, 3]))
```

## Thanks

Lots of references to the following repos.

+ [vite playground ssr-vue](https://github.com/vitejs/vite/tree/main/packages/playground/ssr-vue)
+ [vite-ssg](https://github.com/antfu/vite-ssg)
+ [vite-ssr](https://github.com/frandiox/vite-ssr)

## License

[MIT](https://github.com/aliuq/vite-ssr-vue3/blob/master/LICENSE)
