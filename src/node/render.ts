import type { App } from 'vue'
import type { Router } from 'vue-router'
import { renderToString } from 'vue/server-renderer'

export function generateRenderFn(app: App, router: Router) {
  return async(url: string, manifest: any) => {
    await router.push(url)
    await router.isReady()

    const ctx: any = {}
    const html = await renderToString(app, ctx)
    const preloadLinks = await renderPreloadLinks(ctx.modules, manifest)

    return { appHtml: html, preloadLinks }
  }
}

export async function renderPreloadLinks(modules: any, manifest: any) {
  let links = ''
  const seen = new Set()
  const { basename } = await import('path')
  modules.forEach((id: any) => {
    const files = manifest[id]
    if (files) {
      files.forEach((file: any) => {
        if (!seen.has(file)) {
          seen.add(file)
          const filename = basename(file)
          if (manifest[filename]) {
            for (const depFile of manifest[filename]) {
              links += renderPreloadLink(depFile)
              seen.add(depFile)
            }
          }
          links += renderPreloadLink(file)
        }
      })
    }
  })
  return links
}

function renderPreloadLink(file: string) {
  if (file.endsWith('.js')) {
    return `<link rel="modulepreload" crossorigin href="${file}">`
  }
  else if (file.endsWith('.css')) {
    return `<link rel="stylesheet" href="${file}">`
  }
  else if (file.endsWith('.woff')) {
    return ` <link rel="preload" href="${file}" as="font" type="font/woff" crossorigin>`
  }
  else if (file.endsWith('.woff2')) {
    return ` <link rel="preload" href="${file}" as="font" type="font/woff2" crossorigin>`
  }
  else if (file.endsWith('.gif')) {
    return ` <link rel="preload" href="${file}" as="image" type="image/gif">`
  }
  else if (file.endsWith('.jpg') || file.endsWith('.jpeg')) {
    return ` <link rel="preload" href="${file}" as="image" type="image/jpeg">`
  }
  else if (file.endsWith('.png')) {
    return ` <link rel="preload" href="${file}" as="image" type="image/png">`
  }
  else {
    // TODO
    return ''
  }
}
