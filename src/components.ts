import type { App } from 'vue'
import { defineComponent, inject, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

export const ClientOnly = defineComponent({
  name: 'ClientOnly',
  setup(_: any, { slots }: any) {
    const show = ref(false)
    onMounted(() => {
      show.value = true
    })

    return () => (show.value && slots.default ? slots.default() : null)
  },
})

const CONTEXT_SYMBOL = Symbol('unique-context-symbol')
export function provideContext(app: App, context: any) {
  app.provide(CONTEXT_SYMBOL, context)
}

export function useContext() {
  return inject(CONTEXT_SYMBOL) as any
}

export async function useFetch(key: string, fn: () => Promise<any>) {
  const { initialState } = useContext()
  const { name } = useRoute()
  key = `${name as string}_${key}`
  const state = ref(initialState[key] || null)
  // @ts-expect-error Support client side hmr, need to update state
  if (import.meta.hot)
    state.value = await fn()

  if (!state.value) {
    state.value = await fn()
    // @ts-expect-error global variable
    if (import.meta.env.SSR)
      initialState[key] = state.value
  }
  return state
}
