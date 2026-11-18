import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createAppServer } from '../server/app.mjs'

const headers = { 'Content-Type': 'application/json', 'X-Requested-With': 'CentralTI' }
const adminPassword = ['Lano', 'TICentral', '#202', '*'].join('')
const request = async (base, path, method = 'GET', body, cookie) => {
  const response = await fetch(base + path, { method, headers: { ...headers, ...(cookie ? { Cookie: cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) })
  return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] }
}

test('perfis e notas persistem no SQLite e exigem sessão do próprio técnico', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'central-ti-'))
  const dbPath = join(directory, 'test.sqlite')
  let instance = createAppServer({ dbPath, serveStatic: false })
  await new Promise(resolve => instance.server.listen(0, '127.0.0.1', resolve))
  let base = `http://127.0.0.1:${instance.server.address().port}`
  try {
    assert.equal((await request(base, '/api/me/notes', 'PUT', { notes: 'invasão' })).status, 401)
    assert.equal((await request(base, '/api/login', 'POST', { id: 'central-ti-administrador', password: 'errada' })).status, 401)
    const admin = await request(base, '/api/login', 'POST', { id: 'central-ti-administrador', password: adminPassword })
    assert.equal(admin.status, 200)
    assert.equal((await request(base, '/api/me/notes', 'PUT', { notes: 'Notas do administrador' }, admin.cookie)).status, 200)
    assert.equal((await request(base, '/api/session', 'GET', undefined, admin.cookie)).body.notes, 'Notas do administrador')
    const firstCode = await request(base, '/api/admin/profiles/ana/code', 'POST', undefined, admin.cookie)
    assert.equal(firstCode.status, 200)
    const ana = await request(base, '/api/setup', 'POST', { id: 'ana', code: firstCode.body.code, password: 'SenhaInicial#123' })
    assert.equal(ana.status, 200)
    assert.equal((await request(base, '/api/setup', 'POST', { id: 'ana', code: firstCode.body.code, password: 'OutraSenha#123' })).status, 401)
    assert.equal((await request(base, '/api/me/notes', 'PUT', { notes: 'anotações privadas de Ana' }, ana.cookie)).status, 200)
    assert.equal((await request(base, '/api/session', 'GET', undefined, admin.cookie)).body.notes, 'Notas do administrador')
    assert.equal((await request(base, '/api/admin/profiles/ana/password', 'POST', { password: 'NovaSenha#123' }, ana.cookie)).status, 403)
    assert.equal((await request(base, '/api/admin/profiles/ana/password', 'POST', { password: 'NovaSenha#123' }, admin.cookie)).status, 200)
    assert.equal((await request(base, '/api/session', 'GET', undefined, ana.cookie)).status, 401)
    const anaAgain = await request(base, '/api/login', 'POST', { id: 'ana', password: 'NovaSenha#123' })
    assert.equal(anaAgain.body.notes, 'anotações privadas de Ana')
    await new Promise(resolve => instance.server.close(resolve))
    instance = createAppServer({ dbPath, serveStatic: false })
    await new Promise(resolve => instance.server.listen(0, '127.0.0.1', resolve))
    base = `http://127.0.0.1:${instance.server.address().port}`
    assert.equal((await request(base, '/api/session', 'GET', undefined, anaAgain.cookie)).body.notes, 'anotações privadas de Ana')
  } finally {
    await new Promise(resolve => instance.server.close(resolve))
    rmSync(directory, { recursive: true, force: true })
  }
})

test('origem do Vite local é aceita apenas no servidor de desenvolvimento', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'central-ti-origin-'))
  const dbPath = join(directory, 'test.sqlite')
  const instance = createAppServer({ dbPath, serveStatic: false, allowDevelopmentOrigin: true })
  await new Promise(resolve => instance.server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${instance.server.address().port}`
  const login = origin => fetch(base + '/api/login', { method: 'POST', headers: { ...headers, Host: '127.0.0.1:3001', Origin: origin }, body: JSON.stringify({ id: 'central-ti-administrador', password: adminPassword }) })
  try {
    assert.equal((await login('http://localhost:5173')).status, 200)
    assert.equal((await login('http://example.com')).status, 403)
    const production = createAppServer({ dbPath: ':memory:', serveStatic: false })
    await new Promise(resolve => production.server.listen(0, '127.0.0.1', resolve))
    try {
      const response = await fetch(`http://127.0.0.1:${production.server.address().port}/api/login`, { method: 'POST', headers: { ...headers, Host: '127.0.0.1:3001', Origin: 'http://localhost:5173' }, body: JSON.stringify({ id: 'central-ti-administrador', password: adminPassword }) })
      assert.equal(response.status, 403)
    } finally { await new Promise(resolve => production.server.close(resolve)) }
  } finally {
    await new Promise(resolve => instance.server.close(resolve))
    rmSync(directory, { recursive: true, force: true })
  }
})

test('encerramento repetido não tenta fechar o SQLite duas vezes', async () => {
  const instance = createAppServer({ dbPath: ':memory:', serveStatic: false })
  await new Promise(resolve => instance.server.listen(0, '127.0.0.1', resolve))
  await new Promise(resolve => instance.server.close(resolve))
  assert.doesNotThrow(() => instance.store.close())
})
