import { createAppServer } from './app.mjs'

const port = Number(process.env.PORT ?? 3001)
const host = process.env.HOST ?? '127.0.0.1'
const { server } = createAppServer({ dbPath: process.env.CENTRAL_TI_DB_PATH })
server.listen(port, host, () => { process.stdout.write(`Central TI: http://${host}:${port}\n`) })
