# Vite-SSR-Vue3

![version](https://img.shields.io/npm/v/vite-ssr-vue3)

Vite plugin for vue Server-Side Rendering, Used express to create a server.

## Usage

```ts
import { ViteSSR } from 'vite-ssr-vue3'
import routes from './routes'
import App from './App.vue'

export const createApp = ViteSSR(App, { routes }, (context) => {
  const { app, initialState } = context

  // if (import.meta.env.SSR) {
  //   // Running in server
  // } else {
  //   // Running in browser
  // }

  // Use pinia to store your data
  const pinia = createPinia()

  if (import.meta.env.SSR)
    initialState.pinia = pinia.state.value

  else
    pinia.state.value = initialState.pinia

  // do something
})
```

### Data Fetching

```ts
import { useFetch } from 'vite-ssr-vue3'

const counts = await useFetch('counts', () => Promise.resolve([1, 2, 3]))
```

## Development

There are some examples in the **example** directory, you can execute the **package.json** script to start developing source with the sample.

First, you should install the dependencies with command `pnpm install`, then run the `pnpm basic:dev` command to start developing, run `pnpm basic:serve` to view production environment effects.

+ `example/basic`: Basic usage with data fetching example
+ `example/naive-ui`: Naive UI example

## Thanks

Lots of references to the following repos.

+ [vite playground ssr-vue](https://github.com/vitejs/vite/tree/main/packages/playground/ssr-vue)
+ [vite-ssg](https://github.com/antfu/vite-ssg)
+ [vite-ssr](https://github.com/frandiox/vite-ssr)

## License

[MIT](https://github.com/aliuq/vite-ssr-vue3/blob/master/LICENSE)
