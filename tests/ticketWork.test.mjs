import test from 'node:test'
import assert from 'node:assert/strict'
import { recordTicketWork } from '../src/features/ticketWork.ts'
import { contributionIds, unionMinutes } from '../src/metrics.ts'

const ticket = { id: 'TI-7', type: 'long', title: 'Rede', description: '', createdById: 'ana', ownerId: 'ana', participants: [{ technicianId: 'bruno', worked: false }], category: 'Rede', priority: 'Média', status: 'Concluído', openedAt: '2026-11-16T12:00:00Z', completedAt: '2026-11-17T14:00:00Z', progress: [] }
const data = { technicians: [], tickets: [ticket], sessions: [], plans: [], articles: [] }
const start = '2026-11-17T12:00:00Z', end = '2026-11-17T13:00:00Z'
test('somente associado registra seu trabalho e recebe um crédito', () => {
 assert.throws(() => recordTicketWork(data, 'TI-7', 'carla', start, end), /não pode registrar/)
 const next = recordTicketWork(data, 'TI-7', 'bruno', start, end, 'Diagnóstico')
 assert.equal(next.sessions.length, 1)
 assert.equal(next.sessions[0].technicianId, 'bruno')
 assert.deepEqual(contributionIds(next.tickets[0]), ['bruno'])
 assert.equal(next.tickets[0].progress.at(-1).kind, 'work')
 assert.throws(() => recordTicketWork(next, 'TI-7', 'bruno', start, end), /já foi registrado/)
})
test('rejeita duração inválida e soma sobreposição uma vez', () => {
 assert.throws(() => recordTicketWork(data, 'TI-7', 'ana', start, start), /maior que zero/)
 const first = recordTicketWork(data, 'TI-7', 'ana', start, end)
 const second = recordTicketWork(first, 'TI-7', 'ana', '2026-11-17T12:30:00Z', '2026-11-17T13:30:00Z')
 assert.equal(unionMinutes(second.sessions), 90)
})
