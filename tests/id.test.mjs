import test from 'node:test'
import assert from 'node:assert/strict'
import { createId } from '../src/id.ts'
import { createLongTicket, createQuickTicket } from '../src/features/ticketCreationLogic.ts'
import { updateTicket } from '../src/features/ticketOperations.ts'

const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

test('gera UUID v4 quando randomUUID não existe no navegador HTTP', () => {
  let next = 0
  const source = { getRandomValues: array => { for (let index = 0; index < array.length; index++) array[index] = next++; return array } }
  const first = createId(source)
  const second = createId(source)
  assert.match(first, uuidV4)
  assert.match(second, uuidV4)
  assert.notEqual(first, second)
  assert.match(createId({}), uuidV4)
  assert.match(createId({ randomUUID: () => { throw new Error('indisponível') }, getRandomValues: source.getRandomValues }), uuidV4)
})

test('criação e conclusão funcionam com apenas getRandomValues', () => {
  const original = globalThis.crypto
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: { getRandomValues: original.getRandomValues.bind(original) } })
  try {
    const data = { technicians: [{ id: 'ana', name: 'Ana', role: 'Técnica', avatar: 'AM' }], tickets: [], sessions: [], plans: [], articles: [] }
    const created = createQuickTicket(data, { title: 'Atendimento', technicianId: 'ana' })
    assert.match(created.ticket.progress[0].id, uuidV4)
    const long = createLongTicket(created.data, { title: 'Atividade', description: '', creatorId: 'ana', ownerId: 'ana', category: 'TI', priority: 'Média', participantIds: [], status: 'Em andamento', steps: [] })
    const completed = updateTicket(long.ticket, { status: 'Concluído' }, 'ana')
    assert.match(completed.progress.at(-1).id, uuidV4)
  } finally { Object.defineProperty(globalThis, 'crypto', { configurable: true, value: original }) }
})
