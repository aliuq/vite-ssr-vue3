import { blue, gray, yellow } from 'kolorist'

export function buildLog(text: string, count?: number) {
  // eslint-disable-next-line no-console
  console.log(`\n${gray('[vite-ssr]')} ${yellow(text)}${count ? blue(` (${count})`) : ''}`)
}
