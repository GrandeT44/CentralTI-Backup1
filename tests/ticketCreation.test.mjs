import test from 'node:test'
import assert from 'node:assert/strict'
import { createQuickTicket, createLongTicket, startTimer, pauseTimer, resumeTimer, timerElapsedMs } from '../src/features/ticketCreationLogic.ts'
import { automaticColumn, columnForTicket, normalizeBoard } from '../src/features/kanban.ts'
import { contributionIds, heatmapDays, unionMinutes } from '../src/metrics.ts'
import { convertQuickTicket } from '../src/features/ticketOperations.ts'

const data = { technicians: [{ id: 'ana', name: 'Ana' }, { id: 'bruno', name: 'Bruno' }, { id: 'carla', name: 'Carla' }], tickets: [], sessions: [], plans: [], articles: [] }
const now = new Date('2026-11-17T15:00:00Z')

test('atendimento rápido exige só título, é concluído e não inventa duração ou solução', () => {
  const { data: next, ticket } = createQuickTicket(data, { title: '  Impressora configurada  ', technicianId: 'ana', now })
  assert.equal(ticket.title, 'Impressora configurada')
  assert.equal(ticket.status, 'Concluído')
  assert.equal(ticket.category, 'Não categorizado')
  assert.equal(ticket.createdAt, now.toISOString())
  assert.equal(ticket.openedAt, now.toISOString())
  assert.equal(ticket.solution, undefined)
  assert.equal(ticket.durationMinutes, undefined)
  assert.equal(next.sessions.length, 0)
  assert.equal(ticket.progress[0].kind, 'completion')
  assert.equal(automaticColumn(ticket), 'done')
  assert.equal(heatmapDays(next, 'ana').find(day => day.date === '2026-11-17')?.completed, 1)
  assert.throws(() => createQuickTicket(data, { title: ' ', technicianId: 'ana' }), /título/)
})

test('cronômetro usa timestamps e não conta pausas; duração cria uma sessão', () => {
  const started = startTimer(1000)
  const paused = pauseTimer(started, 61_000)
  assert.equal(timerElapsedMs(paused, 200_000), 60_000)
  const resumed = resumeTimer(paused, 201_000)
  assert.equal(timerElapsedMs(resumed, 231_000), 90_000)
  const result = createQuickTicket(data, { title: 'Rede', technicianId: 'ana', now, durationMinutes: 1.5 })
  assert.equal(result.data.sessions.length, 1)
  assert.equal(unionMinutes(result.data.sessions), 2)
  assert.equal(result.data.sessions[0].ticketId, result.ticket.id)
})

test('criação em sequência gera IDs diferentes e preserva registros anteriores', () => {
  const first = createQuickTicket(data, { title: 'Primeiro', technicianId: 'ana', now })
  const second = createQuickTicket(first.data, { title: 'Segundo', technicianId: 'ana', now })
  assert.notEqual(first.ticket.id, second.ticket.id)
  assert.equal(second.data.tickets.length, 2)
  assert.equal(second.data.tickets[1].title, 'Primeiro')
})

test('atividade prolongada preserva participantes, etapas, prazo e status do Kanban', () => {
  const input = { title: 'Datasul', description: '**Objetivo**', creatorId: 'ana', ownerId: 'bruno', category: 'Sistemas', priority: 'Alta', dueDate: '2026-11-25', participantIds: ['bruno', 'ana', 'carla', 'carla'], status: 'Em andamento', steps: [{ id: 'a', title: 'Diagnóstico', done: true }, { id: 'b', title: 'Teste', done: false }] }
  const { ticket, data: next } = createLongTicket(data, input, now)
  assert.equal(ticket.status, 'Em andamento')
  assert.equal(automaticColumn(ticket), 'doing')
  assert.equal(ticket.participants.length, 1)
  assert.equal(ticket.participants[0].technicianId, 'carla')
  assert.equal(ticket.participants[0].worked, false)
  assert.deepEqual(contributionIds(ticket), [])
  assert.equal(ticket.steps.length, 2)
  assert.ok(ticket.dueAt)
  assert.equal(next.tickets.length, 1)
  const open = createLongTicket(data, { ...input, ownerId: 'ana', dueDate: '', status: 'Aberto', participantIds: [], steps: [] }, now).ticket
  assert.equal(automaticColumn(open), 'todo')
  assert.equal(open.dueAt, undefined)
  const board = normalizeBoard({ columns: [{ id: 'review', name: 'Revisão', custom: true }], placements: { [open.id]: { columnId: 'review', statusAtMove: 'Aberto' } } })
  assert.equal(columnForTicket(open, board), 'review')
})

test('conversão preserva histórico e trabalho e reabre no Kanban', () => {
  const first = createQuickTicket(data, { title: 'Configuração', technicianId: 'ana', now, durationMinutes: 15 })
  const converted = convertQuickTicket(first.ticket, 'ana', new Date('2026-11-17T16:00:00Z'))
  assert.equal(converted.type, 'long')
  assert.equal(converted.status, 'Em andamento')
  assert.equal(converted.completedAt, undefined)
  assert.equal(converted.progress.length, first.ticket.progress.length + 1)
  assert.equal(automaticColumn(converted), 'doing')
  assert.equal(first.data.sessions.length, 1)
  assert.equal(convertQuickTicket(first.ticket, 'bruno'), first.ticket)
})
