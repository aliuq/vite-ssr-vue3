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

### Full Control Build

`vite-ssr build` command default equals build client and server, so you can customize your build process.

```diff
{
  "scripts": {
+   "build": "vite-ssr build",
-   "build:client": "vite build --ssrManifest --outDir dist/client",
-   "build:server": "vite build --ssr src/main.ts --outDir dist/server",
  },
}
```

vite-ssr support separate options for client and server building, Configure them for separate builds

```ts
import { defineConfig } from 'vite'

export default defineConfig({
  ssrOptions: {
    // Client build options
    clientConfig: {},
    // Server build options
    serverConfig: {},
  },
})
```

Compiled with `vite-ssr build`, there are three ways to start the server:

1. Run `vite-ssr --mode production`
2. Use vite-ssr built-in express server, then run `node ./bin/www`

    ```js
    // ./bin/www.js
    const { startExpressServer: startServer } = require('vite-ssr-vue3/server')
    const { createApp } = require('../dist/server/main.cjs')

    startServer({ createApp })
    ```

3. Customize server

   // TODO

In the above three ways, we need to strongly depend on the server, although we can use `ssr.noExternal` to package dependencies, but the server cannot be packaged in, you must install server package `npm install express`

we can modify the server building entry file to avoid this, create a new file to wrapper your server instance(*`vite-ssr` will not works*), configure `ssr.noExternal: /./` to package all dependencies. if you want to runing anywhere, this is recommended.

```ts
// src/server.ts
import { startExpressServer as startServer } from 'vite-ssr-vue3/server'
import { createApp } from './main'

startServer({ createApp, root: __dirname, outDir: '..' })
```

```ts
// vite.config.noexternal.ts
import type { UserConfig } from 'vite'
import { defineConfig } from 'vite'

export default defineConfig({
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
} as UserConfig)
```

then run `vite-ssr build:noexternal`, wait for a while, now you can run `node dist/server/server.cjs` (Required right path) to start the server anywhere.

## Thanks

Lots of references to the following repos.

+ [vite playground ssr-vue](https://github.com/vitejs/vite/tree/main/packages/playground/ssr-vue)
+ [vite-ssg](https://github.com/antfu/vite-ssg)
+ [vite-ssr](https://github.com/frandiox/vite-ssr)

## License

[MIT](https://github.com/aliuq/vite-ssr-vue3/blob/master/LICENSE)
