import { spawn } from 'node:child_process'
import { createAppServer } from './app.mjs'

const { server } = createAppServer({ dbPath: process.env.CENTRAL_TI_DB_PATH, serveStatic: false, allowDevelopmentOrigin: true })
let vite
let stopping = false
const stop = () => {
  if (stopping) return
  stopping = true
  if (vite && vite.exitCode === null) vite.kill()
  if (server.listening) server.close()
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
server.on('error', error => { process.stderr.write(`API local: ${error.message}\n`); process.exitCode = 1 })
server.listen(0, '127.0.0.1', () => {
  if (stopping) { server.close(); return }
  const port = server.address().port
  process.stdout.write(`API local: http://127.0.0.1:${port}\n`)
  vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', ...process.argv.slice(2)], { stdio: 'inherit', env: { ...process.env, CENTRAL_TI_API_PORT: String(port) } })
  vite.on('exit', code => { stop(); process.exitCode = code ?? 0 })
})
