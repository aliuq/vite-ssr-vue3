/* eslint-disable @typescript-eslint/no-var-requires */
import type { AddressInfo, Server } from 'net'
import { performance } from 'perf_hooks'
import type { ViteDevServer } from 'vite'
import { bold, cyan } from 'kolorist'
import type { CreateServerOptions } from '../types'

function printInfo(server: Server, vite?: ViteDevServer | null) {
  // eslint-disable-next-line no-console
  const info = vite?.config ? vite.config.logger.info : console.info

  const address = server.address()
  const isAddressInfo = (x: any): x is AddressInfo => x?.address
  if (isAddressInfo(address)) {
    const ad = cyan(`http://localhost:${bold(address.port)}`)
    try {
      let msg = `\n  express v${require('express/package.json').version}`
      if (vite?.config)
        msg += `  +  vite v${require('vite/package.json').version}`

      info(
        cyan(msg),
        vite?.config ? { clear: !vite.config.logger.hasWarned } : '',
      )
    }
    finally {
      info('\n  -- SSR mode \n')

      info(`  >  Running at:  ${ad}`)

      if (vite?.config && vite.config.plugins.find(p => p.name.includes('unocss:inspector')))
        info(`  >  Unocss:      ${ad}${cyan('/__unocss')}`)

      if (vite?.config && vite.config.plugins.find(p => p.name.includes('vite-plugin-inspect')))
        info(`  >  Inspect:     ${ad}${cyan('/__inspect')}`)

      const time = Math.round(performance.now() - globalThis.__ssr_ready_time)
      info(cyan(`\n  ready in ${time}ms.\n`))
    }
  }
}

export function createStartServer(createServer: any) {
  return async(args: CreateServerOptions | any) => {
    globalThis.__ssr_ready_time = performance.now()
    const { server, vite = null } = await createServer(args)
    const ser = server.listen(args.port || 3000, () => {
      printInfo(ser, vite)
    })
  }
}
