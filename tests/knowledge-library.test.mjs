import test from 'node:test'
import assert from 'node:assert/strict'
import { articleDate, filterArticles, prepareArticle } from '../src/features/knowledgeLibrary.ts'

const old = { id: 'legacy', title: 'Impressora falha', category: 'Periféricos', symptoms: 'Erro de impressão', procedures: 'Verificar driver', solutions: [{ id: 'sol-1', text: 'Reinstalar driver' }], ticketIds: ['TI-1'] }

test('biblioteca pesquisa título, sintomas, procedimento, solução e etiquetas', () => {
  const newArticle = { ...old, id: 'new', title: 'Rede Wi-Fi', tags: ['roteador'], updatedAt: '2026-11-18T12:00:00Z' }
  const articles = [old, newArticle]
  for (const query of ['impressora', 'impressão', 'verificar', 'reinstalar']) assert.equal(filterArticles(articles, query, 'Todas', 'alphabetical').length, query === 'impressora' ? 1 : 2)
  assert.deepEqual(filterArticles(articles, 'roteador', 'Todas', 'recent').map(item => item.id), ['new'])
  assert.deepEqual(filterArticles(articles, '', 'Periféricos', 'recent').map(item => item.id), ['new', 'legacy'])
  assert.ok(articleDate(newArticle.updatedAt))
  assert.equal(articleDate(undefined), '')
})

test('edição mantém IDs e autoria antigos, registra novas soluções e elimina vínculos duplicados', () => {
  const draft = { ...old, title: ' Impressora falha ', ticketIds: ['TI-1', 'TI-1', 'TI-2'], solutions: [...old.solutions, { id: 'sol-2', text: ' Limpar fila ', verified: true }, { id: 'empty', text: '  ' }] }
  const next = prepareArticle(draft, old, 'driver, windows, driver', 'ana', '2026-11-18T12:00:00Z')
  assert.equal(next.id, old.id)
  assert.equal(next.solutions[0].id, 'sol-1')
  assert.equal(next.solutions[0].verified, undefined)
  assert.equal(next.solutions[1].authorId, 'ana')
  assert.equal(next.solutions[1].verified, true)
  assert.equal(next.solutions.length, 2)
  assert.deepEqual(next.ticketIds, ['TI-1', 'TI-2'])
  assert.deepEqual(next.tags, ['driver', 'windows'])
  assert.equal(next.authorId, 'ana')
  assert.equal(next.history[0].action, '1 solução(ões) adicionada(s) e artigo atualizado')
  assert.equal(old.solutions.length, 1)
})
