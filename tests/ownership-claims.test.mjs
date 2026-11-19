import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { openStore, ADMIN_ID } from '../server/store.mjs'
import { createAppServer } from '../server/app.mjs'
import { DatabaseSync } from 'node:sqlite'

const ticket = (id, participants = [], status = 'Aberto') => ({ id, type: 'long', title: id, description: '', createdById: 'ana', ownerId: 'ana', participants: participants.map(technicianId => ({ technicianId, worked: false })), category: 'Sistemas', priority: 'Média', status, openedAt: '2026-11-19T10:00:00.000Z', progress: [] })
const article = { id: 'guide-1', title: 'Guia de teste', category: 'Sistemas', symptoms: '', procedures: '', solutions: [], body: 'Conteúdo de teste', ticketIds: [], authorId: 'ana' }

test('exclusão de perfil preserva histórico, transfere chamados ativos e deixa artigo disponível para reclamação aprovada', () => {
  const directory = mkdtempSync(join(tmpdir(), 'central-ti-claims-'))
  const file = join(directory, 'data.sqlite')
  try {
    let store = openStore(file)
    const tickets = [ticket('TI-1', ['bruno', 'carla']), ticket('TI-2'), ticket('TI-3', [], 'Concluído')]
    store.applyWorkspaceChanges({ tickets: tickets.map(after => ({ before: null, after })), articles: [{ before: null, after: article }] }, 'ana')
    store.saveNotes('ana', 'Nota privada')
    assert.throws(() => store.deleteProfile(ADMIN_ID), /administrador/)
    store.deleteProfile('ana')
    const state = store.workspace().data
    assert.equal(state.tickets.find(item => item.id === 'TI-1').ownerId, 'bruno')
    assert.deepEqual(state.tickets.find(item => item.id === 'TI-1').participants.map(item => item.technicianId), ['carla'])
    assert.equal(state.tickets.find(item => item.id === 'TI-2').ownerId, '')
    assert.equal(state.tickets.find(item => item.id === 'TI-3').ownerId, 'ana')
    assert.equal(state.articles[0].ownerId, null)
    assert.equal(state.articles[0].authorId, 'ana')
    assert.equal(store.profile('ana').deleted, 1)
    assert.equal(store.notes('ana'), '')
    assert.equal(store.login('ana', 'qualquer senha'), null)
    assert.equal(store.listProfiles(false).some(item => item.id === 'ana'), false)
    const guideClaim = store.submitOwnershipClaim('article', 'guide-1', 'bruno')
    assert.throws(() => store.submitOwnershipClaim('article', 'guide-1', 'bruno'), /já enviou/)
    assert.throws(() => store.resolveOwnershipClaim(guideClaim.id, 'carla', true), /administrador/)
    store.resolveOwnershipClaim(guideClaim.id, ADMIN_ID, true)
    assert.equal(store.workspace().data.articles[0].ownerId, 'bruno')
    assert.equal(store.workspace().data.articles[0].authorId, 'ana')
    const ticketClaim = store.submitOwnershipClaim('ticket', 'TI-2', 'carla')
    store.resolveOwnershipClaim(ticketClaim.id, ADMIN_ID, true)
    assert.equal(store.workspace().data.tickets.find(item => item.id === 'TI-2').ownerId, 'carla')
    assert.equal(store.ownershipClaims(ADMIN_ID).length, 0)
    store.close()
    store = openStore(file)
    assert.equal(store.profile('ana').deleted, 1)
    assert.equal(store.workspace().data.articles[0].ownerId, 'bruno')
    assert.equal(store.workspace().data.tickets.find(item => item.id === 'TI-2').ownerId, 'carla')
    store.close()
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test('perfis iniciais excluídos não são recriados na reinicialização', () => {
  const directory = mkdtempSync(join(tmpdir(), 'central-ti-seeds-'))
  const file = join(directory, 'data.sqlite')
  try {
    let store = openStore(file)
    for (const id of ['ana', 'bruno', 'carla']) store.deleteProfile(id)
    store.close()
    store = openStore(file)
    assert.deepEqual(store.listProfiles(false).map(item => item.id), [ADMIN_ID])
    store.close()
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test('banco de perfis existente recebe a coluna de exclusão sem perder usuários', () => {
  const directory = mkdtempSync(join(tmpdir(), 'central-ti-profile-migration-'))
  const file = join(directory, 'data.sqlite')
  try {
    const legacy = new DatabaseSync(file)
    legacy.exec("CREATE TABLE profiles (id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, avatar TEXT NOT NULL, photo_data_url TEXT, archived INTEGER NOT NULL DEFAULT 0, notes TEXT NOT NULL DEFAULT '', password_salt TEXT, password_hash TEXT, setup_salt TEXT, setup_hash TEXT)")
    legacy.prepare('INSERT INTO profiles (id,name,role,avatar) VALUES (?,?,?,?)').run('ana', 'Ana Martins', 'Técnica', 'AM')
    legacy.close()
    const store = openStore(file)
    assert.equal(store.profile('ana').deleted, 0)
    assert.equal(store.listProfiles(true).some(item => item.id === 'ana'), true)
    store.close()
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test('API exige administrador para excluir perfis e aprovar pedidos', async () => {
  const instance = createAppServer({ dbPath: ':memory:', serveStatic: false })
  await new Promise(resolve => instance.server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${instance.server.address().port}`
  const call = async (path, method = 'GET', body, cookie) => {
    const response = await fetch(base + path, { method, headers: { 'X-Requested-With': 'CentralTI', 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) })
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] }
  }
  try {
    const admin = await call('/api/login', 'POST', { id: ADMIN_ID, password: ['Lano', 'TICentral', '#202', '*'].join('') })
    const code = await call('/api/admin/profiles/bruno/code', 'POST', undefined, admin.cookie)
    const bruno = await call('/api/setup', 'POST', { id: 'bruno', code: code.body.code, password: 'SenhaBruno#123' })
    assert.equal((await call('/api/admin/profiles/ana', 'DELETE', undefined, bruno.cookie)).status, 403)
    assert.equal((await call('/api/workspace/changes', 'POST', { changes: { articles: [{ before: null, after: article }] } }, admin.cookie)).status, 200)
    assert.equal((await call('/api/admin/profiles/ana', 'DELETE', undefined, admin.cookie)).status, 200)
    const claim = await call('/api/ownership-claims', 'POST', { kind: 'article', resourceId: article.id }, bruno.cookie)
    assert.equal(claim.status, 201)
    assert.equal((await call(`/api/admin/ownership-claims/${claim.body.claim.id}/approve`, 'POST', undefined, bruno.cookie)).status, 403)
    assert.equal((await call(`/api/admin/ownership-claims/${claim.body.claim.id}/approve`, 'POST', undefined, admin.cookie)).status, 200)
    assert.equal((await call('/api/workspace', 'GET', undefined, bruno.cookie)).body.data.articles[0].ownerId, 'bruno')
  } finally { await new Promise(resolve => instance.server.close(resolve)) }
})
