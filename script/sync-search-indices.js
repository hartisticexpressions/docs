#!/usr/bin/env node
import searchSync from './search/sync.js'
import 'make-promises-safe'

// [start-readme]
//
// This script is run automatically via GitHub Actions on every push to `main` to generate searchable data.
// It can also be run manually. For more info see [contributing/search.md](contributing/search.md)
//
// [end-readme]

main()

async function main () {
  const sync = searchSync
  const opts = {
    dryRun: 'DRY_RUN' in process.env,
    language: process.env.LANGUAGE,
    version: process.env.VERSION
  }
  await sync(opts)
}
