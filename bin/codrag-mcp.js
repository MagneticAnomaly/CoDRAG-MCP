#!/usr/bin/env node

const { spawn } = require('child_process')

function main() {
  const args = process.argv.slice(2)

  // Important: stdout is reserved for MCP JSON-RPC.
  // Only print errors to stderr.
  const child = spawn('codrag', ['mcp', ...args], {
    stdio: 'inherit',
    env: process.env,
  })

  child.on('error', (err) => {
    if (err && err.code === 'ENOENT') {
      console.error('[codrag-mcp] Error: `codrag` not found on PATH.')
      console.error('[codrag-mcp] Install CoDRAG first (engine binary), then retry.')
      console.error('')
      console.error('macOS: brew install --cask codrag')
      console.error('Windows: winget install MagneticAnomaly.CoDRAG')
      process.exit(1)
    }

    console.error(`[codrag-mcp] Failed to launch CoDRAG: ${String(err)}`)
    process.exit(1)
  })

  child.on('exit', (code, signal) => {
    if (typeof code === 'number') process.exit(code)
    // When terminated by signal, propagate a non-zero exit.
    if (signal) process.exit(1)
    process.exit(1)
  })
}

main()
