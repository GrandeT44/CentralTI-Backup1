import { existsSync } from 'node:fs'
import { resolve, dirname, basename, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const source = resolve(process.env.CENTRAL_TI_DB_PATH ?? 'local-data/central-ti.sqlite')
if (!existsSync(source)) throw new Error(`Banco não encontrado: ${source}`)
const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_')
const target = join(dirname(source), `${basename(source, '.sqlite')}-backup-${stamp}.sqlite`)
const db = new DatabaseSync(source)
try {
  db.exec('PRAGMA busy_timeout = 5000')
  db.exec(`VACUUM INTO '${target.replaceAll("'", "''")}'`)
  process.stdout.write(`Cópia criada: ${target}\n`)
} finally { db.close() }
