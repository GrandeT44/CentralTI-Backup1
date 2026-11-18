import test from 'node:test'
import assert from 'node:assert/strict'
import { ADMIN_ID, createTechnician, deleteTechnician, ensureAdministrator, verifyAdministratorPassword } from '../src/features/administrator.ts'
import { canChangeTicketOwner, canManageTicket } from '../src/features/ticketAccess.ts'
import { updateTicket } from '../src/features/ticketOperations.ts'

const base = { technicians: [{ id: 'ana', name: 'Ana Martins', role: 'Técnica', avatar: 'AM' }], tickets: [], sessions: [], plans: [], articles: [] }

test('administrador é permanente e senha incorreta não libera acesso', async () => {
  const first = ensureAdministrator(base)
  assert.equal(first.technicians.filter(person => person.id === ADMIN_ID).length, 1)
  assert.equal(ensureAdministrator(first).technicians.filter(person => person.id === ADMIN_ID).length, 1)
  assert.throws(() => deleteTechnician(first, ADMIN_ID), /não pode ser excluído/)
  assert.equal(await verifyAdministratorPassword('senha-incorreta'), false)
})

test('administrador gerencia qualquer chamado e troca o responsável', () => {
  const ticket = { id: 'TI-1', type: 'long', title: 'Teste', description: '', createdById: 'ana', ownerId: 'ana', participants: [], priority: 'Média', status: 'Aberto', progress: [] }
  assert.equal(canManageTicket(ticket, ADMIN_ID), true)
  assert.equal(canChangeTicketOwner(ticket, ADMIN_ID), true)
  assert.equal(updateTicket(ticket, { ownerId: ADMIN_ID }, ADMIN_ID).ownerId, ADMIN_ID)
})

test('perfil novo pode ser removido; perfil com histórico é desativado', () => {
  const created = createTechnician(ensureAdministrator(base), ' Bruno Costa ', ' Suporte ')
  const bruno = created.technicians.find(person => person.name === 'Bruno Costa')
  assert.equal(bruno.role, 'Suporte')
  assert.equal(deleteTechnician(created, bruno.id).technicians.some(person => person.id === bruno.id), false)
  const withHistory = { ...created, tickets: [{ id: 'TI-2', ownerId: bruno.id, participants: [], progress: [] }] }
  const archived = deleteTechnician(withHistory, bruno.id)
  assert.equal(archived.technicians.find(person => person.id === bruno.id).archived, true)
  assert.equal(archived.tickets[0].ownerId, bruno.id)
})
