import test from 'node:test'
import assert from 'node:assert/strict'
import { recommendArticles } from '../src/features/knowledgeMatch.ts'

const article = (id, title, symptoms, category = 'Rede') => ({ id, title, category, symptoms, procedures: '', solutions: [{ id: `${id}-solution`, text: 'Reiniciar o equipamento e testar.' }], ticketIds: [] })

test('recomenda artigo por termos do problema e não apenas pela categoria', () => {
  const ticket = { id: 'TI-1', title: 'Impressora sem conexão', description: 'Falha ao imprimir na rede', category: 'Rede' }
  const result = recommendArticles(ticket, [article('a', 'Impressora sem conexão', 'Não imprime na rede'), article('b', 'Trocar senha do Wi-Fi', 'Sem acesso ao roteador')])
  assert.deepEqual(result.map(item => item.article.id), ['a'])
  assert.ok(result[0].matched.includes('impressora'))
})

test('artigo vinculado ao chamado aparece mesmo sem palavras coincidentes', () => {
  const ticket = { id: 'TI-2', title: 'Falha no computador', description: '', category: 'Hardware' }
  const linked = { ...article('a', 'Conexão de rede', 'Porta indisponível'), ticketIds: ['TI-2'] }
  assert.equal(recommendArticles(ticket, [linked])[0].linked, true)
})
