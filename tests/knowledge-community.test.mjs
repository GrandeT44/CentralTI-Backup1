import test from 'node:test'
import assert from 'node:assert/strict'
import { createAppServer } from '../server/app.mjs'
import { openStore } from '../server/store.mjs'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const headers = { 'Content-Type': 'application/json', 'X-Requested-With': 'CentralTI' }
const call = async (base, path, method = 'GET', body, cookie) => { const response = await fetch(base + path, { method, headers: { ...headers, ...(cookie ? { Cookie: cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) }); return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] } }
const article = { id: 'guide-1', title: 'Windows falha', category: 'Sistemas', symptoms: 'Falha ao iniciar', procedures: 'Verificar logs', solutions: [{ id: 's1', text: 'Reiniciar' }], ticketIds: [], authorId: 'ana' }

test('favoritos são pessoais; sugestão só entra no guia após aprovação do criador e gera um crédito', async () => {
  const instance = createAppServer({ dbPath: ':memory:', serveStatic: false })
  await new Promise(resolve => instance.server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${instance.server.address().port}`
  try {
    const admin = await call(base, '/api/login', 'POST', { id: 'central-ti-administrador', password: ['Lano', 'TICentral', '#202', '*'].join('') })
    const codeAna = await call(base, '/api/admin/profiles/ana/code', 'POST', undefined, admin.cookie)
    const ana = await call(base, '/api/setup', 'POST', { id: 'ana', code: codeAna.body.code, password: 'SenhaInicial#123' })
    const codeBruno = await call(base, '/api/admin/profiles/bruno/code', 'POST', undefined, admin.cookie)
    const bruno = await call(base, '/api/setup', 'POST', { id: 'bruno', code: codeBruno.body.code, password: 'SenhaInicial#456' })
    assert.equal((await call(base, '/api/workspace/changes', 'POST', { changes: { articles: [{ before: null, after: { ...article, id: 'guide-long', title: 'T'.repeat(101) } }] } }, ana.cookie)).status, 400)
    assert.equal((await call(base, '/api/workspace/changes', 'POST', { changes: { articles: [{ before: null, after: article }] } }, ana.cookie)).status, 200)
    assert.equal((await call(base, '/api/knowledge/guide-1/favorite', 'PUT', { favorite: true }, bruno.cookie)).status, 200)
    assert.deepEqual((await call(base, '/api/me/favorites', 'GET', undefined, bruno.cookie)).body.ids, ['guide-1'])
    assert.deepEqual((await call(base, '/api/me/favorites', 'GET', undefined, ana.cookie)).body.ids, [])
    assert.equal((await call(base, '/api/workspace/changes', 'POST', { changes: { articles: [{ before: article, after: { ...article, title: 'Alterado sem aprovação' } }] } }, bruno.cookie)).status, 403)
    const proposed = { ...article, title: 'Windows falha ao iniciar', solutions: [...article.solutions, { id: 's2', text: 'Reparar inicialização' }] }
    const submitted = await call(base, '/api/knowledge/guide-1/requests', 'POST', { proposed }, bruno.cookie)
    assert.equal(submitted.status, 201)
    assert.equal((await call(base, '/api/workspace', 'GET', undefined, ana.cookie)).body.data.articles[0].title, article.title)
    assert.equal((await call(base, `/api/knowledge/guide-1/requests/${submitted.body.request.id}/approve`, 'POST', undefined, bruno.cookie)).status, 403)
    assert.equal((await call(base, `/api/knowledge/guide-1/requests/${submitted.body.request.id}/approve`, 'POST', undefined, ana.cookie)).status, 200)
    const updated = (await call(base, '/api/workspace', 'GET', undefined, bruno.cookie)).body.data.articles[0]
    assert.equal(updated.title, proposed.title)
    assert.equal(updated.authorId, 'ana')
    assert.equal(updated.solutions[1].authorId, 'bruno')
    assert.equal((await call(base, '/api/me/knowledge-contributions', 'GET', undefined, bruno.cookie)).body.count, 1)
    const reportContributions = (await call(base, '/api/reports/knowledge-contributions', 'GET', undefined, ana.cookie)).body
    assert.equal(reportContributions.counts.bruno, 1)
    assert.equal(reportContributions.events.length, 1)
    assert.equal(reportContributions.events[0].technicianId, 'bruno')
    assert.ok(reportContributions.events[0].at)
    assert.equal((await call(base, `/api/knowledge/guide-1/requests/${submitted.body.request.id}/approve`, 'POST', undefined, ana.cookie)).status, 409)
    const second = await call(base, '/api/knowledge/guide-1/requests', 'POST', { proposed: { ...updated, symptoms: 'Outro sintoma' } }, bruno.cookie)
    assert.equal(second.status, 201)
    assert.equal((await call(base, `/api/knowledge/guide-1/requests/${second.body.request.id}/reject`, 'POST', undefined, ana.cookie)).status, 200)
    assert.equal((await call(base, '/api/me/knowledge-contributions', 'GET', undefined, bruno.cookie)).body.count, 1)
    assert.deepEqual((await call(base, '/api/me/favorites', 'GET', undefined, bruno.cookie)).body.ids, ['guide-1'])
    const pending = await call(base, '/api/knowledge/guide-1/requests', 'POST', { proposed: { ...updated, notes: 'Revisão pendente' } }, bruno.cookie)
    assert.equal(pending.status, 201)
    assert.equal((await call(base, '/api/knowledge/guide-1', 'DELETE', { expectedUpdatedAt: updated.updatedAt ?? null }, bruno.cookie)).status, 403)
    assert.equal((await call(base, '/api/knowledge/guide-1', 'DELETE', { expectedUpdatedAt: '2020-01-01T00:00:00Z' }, ana.cookie)).status, 409)
    assert.equal((await call(base, '/api/knowledge/guide-1', 'DELETE', { expectedUpdatedAt: updated.updatedAt ?? null }, admin.cookie)).status, 200)
    assert.deepEqual((await call(base, '/api/workspace', 'GET', undefined, ana.cookie)).body.data.articles, [])
    assert.deepEqual((await call(base, '/api/me/favorites', 'GET', undefined, bruno.cookie)).body.ids, [])
    assert.equal((await call(base, '/api/me/knowledge-contributions', 'GET', undefined, bruno.cookie)).body.count, 1)
    assert.equal((await call(base, '/api/knowledge/guide-1', 'DELETE', { expectedUpdatedAt: null }, ana.cookie)).status, 404)
    const ownArticle = { ...article, id: 'guide-2' }
    assert.equal((await call(base, '/api/workspace/changes', 'POST', { changes: { articles: [{ before: null, after: ownArticle }] } }, ana.cookie)).status, 200)
    assert.equal((await call(base, '/api/knowledge/guide-2', 'DELETE', { expectedUpdatedAt: null }, ana.cookie)).status, 200)
  } finally { await new Promise(resolve => instance.server.close(resolve)) }
})

test('favoritos e créditos aprovados persistem no SQLite após reinício', () => {
  const directory = mkdtempSync(join(tmpdir(), 'central-ti-guides-'))
  const file = join(directory, 'data.sqlite')
  try {
    let store = openStore(file)
    store.applyWorkspaceChanges({ articles: [{ before: null, after: article }] }, 'ana')
    store.setArticleFavorite('bruno', article.id, true)
    const proposed = { ...article, symptoms: 'Falha ao iniciar com tela azul' }
    const request = store.submitArticleRequest(article.id, 'bruno', proposed)
    store.resolveArticleRequest(article.id, request.id, 'ana', true)
    store.close()
    store = openStore(file)
    assert.deepEqual(store.favoriteArticles('bruno'), [article.id])
    assert.equal(store.articleContributionCount('bruno'), 1)
    assert.equal(store.workspace().data.articles[0].symptoms, proposed.symptoms)
    store.close()
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test('texto único e fotos vinculadas persistem no artigo e em propostas aprovadas', () => {
  const directory = mkdtempSync(join(tmpdir(), 'central-ti-guide-images-'))
  const file = join(directory, 'data.sqlite')
  const image = { id: 'image-one', alt: 'Tela de erro', dataUrl: 'data:image/png;base64,aGVsbG8=' }
  const guide = { ...article, id: 'guide-images', body: '# Diagnóstico\n\nPasso inicial', images: [], solutions: [] }
  try {
    let store = openStore(file)
    store.applyWorkspaceChanges({ articles: [{ before: null, after: guide }] }, 'ana')
    const proposal = { ...guide, body: '# Diagnóstico\n\n![Tela de erro](article-image:image-one)', images: [image] }
    const request = store.submitArticleRequest(guide.id, 'bruno', proposal)
    assert.equal(store.workspace().data.articles[0].images.length, 0)
    store.resolveArticleRequest(guide.id, request.id, 'ana', true)
    store.close()
    store = openStore(file)
    assert.equal(store.workspace().data.articles[0].body, proposal.body)
    assert.deepEqual(store.workspace().data.articles[0].images, [image])
    assert.equal(store.articleContributionCount('bruno'), 1)
    const next = { ...store.workspace().data.articles[0], body: 'Outra versão' }
    const declined = store.submitArticleRequest(guide.id, 'bruno', next)
    store.resolveArticleRequest(guide.id, declined.id, 'ana', false)
    assert.equal(store.workspace().data.articles[0].body, proposal.body)
    store.close()
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
