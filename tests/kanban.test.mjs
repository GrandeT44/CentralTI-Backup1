import test from 'node:test'
import assert from 'node:assert/strict'
import { automaticColumn, columnForTicket, consumeDraft, normalizeBoard } from '../src/features/kanban.ts'

const base = { id: 'TI-1', type: 'long', status: 'Aberto' }
test('colunas padrão existem em todos os quadros', () => {
  assert.deepEqual(normalizeBoard().columns.map(column => column.id), ['todo', 'doing', 'done'])
  assert.deepEqual(normalizeBoard({ columns: [{ id: 'review', name: 'Revisão', custom: true }], placements: {} }).columns.map(column => column.id), ['todo', 'doing', 'done', 'review'])
})
test('chamados novos aparecem na coluna coerente', () => {
  assert.equal(automaticColumn(base), 'todo')
  assert.equal(automaticColumn({ ...base, status: 'Em andamento' }), 'doing')
  assert.equal(automaticColumn({ ...base, type: 'quick', status: 'Concluído' }), 'done')
  assert.equal(automaticColumn({ ...base, status: 'Concluído' }), 'done')
})
test('posição manual só vale enquanto status e coluna permanecerem válidos', () => {
  const board = normalizeBoard({ columns: [], placements: { 'TI-1': { columnId: 'todo', statusAtMove: 'Aberto' } } })
  assert.equal(columnForTicket(base, board), 'todo')
  assert.equal(columnForTicket({ ...base, status: 'Em andamento' }, board), 'doing')
  assert.equal(columnForTicket({ ...base, status: 'Concluído' }, board), 'done')
})
test('quadro pessoal preserva blocos e modo compacto; conversão remove só o bloco usado', () => {
  const board = normalizeBoard({ columns: [], placements: {}, compact: true, drafts: [{ id: 'a', title: 'Revisar rede', createdAt: '2026-11-17T12:00:00Z' }, { id: 'b', title: 'Testar impressora', createdAt: '2026-11-17T13:00:00Z' }] })
  assert.equal(board.compact, true)
  assert.equal(board.drafts.length, 2)
  const next = consumeDraft(board, 'a')
  assert.equal(next.compact, true)
  assert.deepEqual(next.drafts.map(draft => draft.id), ['b'])
  assert.deepEqual(board.drafts.map(draft => draft.id), ['a', 'b'])
})
