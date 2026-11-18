import test from 'node:test'
import assert from 'node:assert/strict'
import { diffWorkspace, hasWorkspaceChanges, mergeWorkspace, workspaceFromData } from '../src/workspaceSync.ts'
import { createLongTicket } from '../src/features/ticketCreationLogic.ts'

const empty = () => ({ technicians: [{ id: 'ana', name: 'Ana', role: 'TI', avatar: 'AM' }], tickets: [], sessions: [], plans: [], articles: [], kanbanBoards: {}, personalNotes: { ana: 'Privado' } })

test('diferenças enviam apenas registros alterados e preservam notas pessoais', () => {
  const before = empty()
  const created = createLongTicket(before, { title: 'Rede', description: '', creatorId: 'ana', ownerId: 'ana', category: 'TI', priority: 'Média', participantIds: [], status: 'Aberto', steps: [] })
  const after = { ...created.data, kanbanBoards: { ana: { columns: [], placements: {} } }, personalNotes: { ana: 'Outra nota' } }
  const changes = diffWorkspace(before, after)
  assert.equal(changes.tickets.length, 1)
  assert.equal(changes.tickets[0].before, null)
  assert.equal(changes.kanbanBoards.length, 1)
  assert.equal(changes.sessions.length, 0)
  assert.equal('personalNotes' in workspaceFromData(after), false)
  assert.equal('technicians' in workspaceFromData(after), false)
  assert.equal(mergeWorkspace(before, workspaceFromData(after)).personalNotes.ana, 'Privado')
  assert.equal(hasWorkspaceChanges(changes), true)
})

test('dois computadores criam IDs de chamado distintos partindo do mesmo estado', () => {
  const data = empty()
  const input = { title: 'Novo atendimento', description: '', creatorId: 'ana', ownerId: 'ana', category: 'TI', priority: 'Média', participantIds: [], status: 'Aberto', steps: [] }
  const first = createLongTicket(data, input).ticket
  const second = createLongTicket(data, input).ticket
  assert.match(first.id, /^TI-\d+-[0-9A-F]{8}$/)
  assert.notEqual(first.id, second.id)
})
