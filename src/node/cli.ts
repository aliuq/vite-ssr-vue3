/* eslint-disable no-unused-expressions */
import { bold, gray, red, reset, underline } from 'kolorist'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { bugs } from '../../package.json'
import { start } from './server'
import { build } from './build'

yargs(hideBin(process.argv))
  .scriptName('vite-ssr')
  .usage('$0 [args]')
  .command(
    'build',
    'Build SSR',
    args => args,
    async(args) => {
      await build(args as any)
    },
  )
  .command(
    '*',
    'development and production environment',
    args => args,
    async(args) => {
      await start(args)
    },
  )
  .fail((msg, err, yargs) => {
    console.error(`\n${gray('[vite-ssr]')} ${bold(red('An internal error occurred.'))}`)
    console.error(`${gray('[vite-ssr]')} ${reset(`Please report an issue, if none already exists: ${underline(bugs)}`)}`)
    yargs.exit(1, err)
  })
  .showHelpOnFail(false)
  .help()
  .argv
