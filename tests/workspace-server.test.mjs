import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createAppServer } from '../server/app.mjs'

const adminPassword = ['Lano', 'TICentral', '#202', '*'].join('')
const headers = { 'Content-Type': 'application/json', 'X-Requested-With': 'CentralTI' }
const ticket = (id, title, author = 'ana') => ({ id, type: 'long', title, description: '', createdById: author, ownerId: author, participants: [], category: 'TI', priority: 'Média', status: 'Aberto', openedAt: '2026-11-18T12:00:00.000Z', progress: [] })
const call = async (base, path, method = 'GET', body, cookie) => {
  const response = await fetch(base + path, { method, headers: { ...headers, ...(cookie ? { Cookie: cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) })
  return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] }
}

test('espaço compartilhado inicia vazio, sincroniza e persiste sem usar armazenamento do navegador', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'central-ti-workspace-'))
  const dbPath = join(directory, 'data.sqlite')
  let instance = createAppServer({ dbPath, serveStatic: false })
  await new Promise(resolve => instance.server.listen(0, '127.0.0.1', resolve))
  let base = `http://127.0.0.1:${instance.server.address().port}`
  try {
    assert.equal((await call(base, '/api/workspace')).status, 401)
    const admin = await call(base, '/api/login', 'POST', { id: 'central-ti-administrador', password: adminPassword })
    const initial = (await call(base, '/api/workspace', 'GET', undefined, admin.cookie)).body
    assert.equal(initial.revision, 1)
    assert.deepEqual(initial.data, { tickets: [], sessions: [], plans: [], articles: [], kanbanBoards: {} })
    assert.equal((await call(base, '/api/workspace/initialize', 'POST', { data: initial.data }, admin.cookie)).status, 404)
    assert.equal((await call(base, '/api/workspace/import', 'POST', { data: initial.data }, admin.cookie)).status, 404)
    assert.equal((await call(base, '/api/admin/import', 'POST', { profiles: [] }, admin.cookie)).status, 404)

    const setup = await call(base, '/api/admin/profiles/ana/code', 'POST', undefined, admin.cookie)
    const ana = await call(base, '/api/setup', 'POST', { id: 'ana', code: setup.body.code, password: 'SenhaInicial#123' })
    const brunoCode = await call(base, '/api/admin/profiles/bruno/code', 'POST', undefined, admin.cookie)
    const bruno = await call(base, '/api/setup', 'POST', { id: 'bruno', code: brunoCode.body.code, password: 'SenhaInicial#456' })
    const first = ticket('TI-1043-A1B2C3D4', 'Chamado do outro computador')
    const added = await call(base, '/api/workspace/changes', 'POST', { changes: { tickets: [{ before: null, after: first }] } }, ana.cookie)
    assert.equal(added.status, 200)
    assert.equal(added.body.revision, 2)
    assert.deepEqual((await call(base, '/api/workspace?since=2', 'GET', undefined, ana.cookie)).body, { revision: 2, unchanged: true })
    assert.equal((await call(base, '/api/workspace', 'GET', undefined, bruno.cookie)).body.data.tickets[0].title, first.title)
    assert.equal((await call(base, '/api/workspace/changes', 'POST', { changes: { tickets: [{ before: first, after: { ...first, title: 'Alteração indevida' } }] } }, bruno.cookie)).status, 403)
    const changed = { ...first, title: 'Título atualizado' }
    assert.equal((await call(base, '/api/workspace/changes', 'POST', { changes: { tickets: [{ before: first, after: changed }] } }, admin.cookie)).status, 200)
    assert.equal((await call(base, '/api/workspace/changes', 'POST', { changes: { tickets: [{ before: first, after: { ...first, status: 'Concluído' } }] } }, ana.cookie)).status, 409)
    await new Promise(resolve => instance.server.close(resolve))
    instance = createAppServer({ dbPath, serveStatic: false })
    await new Promise(resolve => instance.server.listen(0, '127.0.0.1', resolve))
    base = `http://127.0.0.1:${instance.server.address().port}`
    assert.equal((await call(base, '/api/workspace', 'GET', undefined, ana.cookie)).body.data.tickets[0].title, changed.title)
  } finally {
    await new Promise(resolve => instance.server.close(resolve))
    rmSync(directory, { recursive: true, force: true })
  }
})
