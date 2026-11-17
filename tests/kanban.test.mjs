import test from 'node:test'
import assert from 'node:assert/strict'
import { automaticColumn, columnForTicket, normalizeBoard } from '../src/features/kanban.ts'

const base = { id: 'TI-1', type: 'long', status: 'Aberto' }
test('colunas padrão existem em todos os quadros', () => {
  assert.deepEqual(normalizeBoard().columns.map(column => column.id), ['todo', 'doing', 'done'])
  assert.deepEqual(normalizeBoard({ columns: [{ id: 'review', name: 'Revisão', custom: true }], placements: {} }).columns.map(column => column.id), ['todo', 'doing', 'done', 'review'])
})
test('chamados novos aparecem na coluna coerente', () => {
  assert.equal(automaticColumn(base), 'doing')
  assert.equal(automaticColumn({ ...base, type: 'quick', status: 'Concluído' }), 'done')
  assert.equal(automaticColumn({ ...base, status: 'Concluído' }), 'done')
})
test('posição manual só vale enquanto status e coluna permanecerem válidos', () => {
  const board = normalizeBoard({ columns: [], placements: { 'TI-1': { columnId: 'todo', statusAtMove: 'Aberto' } } })
  assert.equal(columnForTicket(base, board), 'todo')
  assert.equal(columnForTicket({ ...base, status: 'Em andamento' }, board), 'doing')
  assert.equal(columnForTicket({ ...base, status: 'Concluído' }, board), 'done')
})
