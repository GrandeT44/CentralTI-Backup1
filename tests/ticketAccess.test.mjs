import test from 'node:test'
import assert from 'node:assert/strict'
import { addCollaborator, canManageTicket, ticketCreatorId, ticketParticipants } from '../src/features/ticketAccess.ts'
import { updateTicket } from '../src/features/ticketOperations.ts'

const base = { id:'TI-9', type:'long', title:'Rede', description:'', ownerId:'ana', createdById:'ana', participants:[{technicianId:'bruno',worked:false}], category:'Rede', priority:'Média', status:'Aberto', openedAt:'2026-11-16T12:00:00Z', progress:[] }
test('somente criador ou colaborador associado administra', () => {
 assert.equal(canManageTicket(base,'ana'),true)
 assert.equal(canManageTicket(base,'bruno'),true)
 assert.equal(canManageTicket(base,'carla'),false)
 assert.equal(updateTicket(base,{status:'Concluído'},'carla'),base)
})
test('só criador muda responsável; novo responsável não entra na lista de participantes', () => {
 assert.equal(updateTicket(base,{ownerId:'carla'},'bruno'),base)
 const updated = updateTicket(base,{ownerId:'carla'},'ana',new Date('2026-11-16T13:00:00Z'))
 assert.equal(updated.ownerId,'carla')
 assert.equal(updated.createdById,'ana')
 assert.equal(updated.participants.some(person=>person.technicianId==='carla'),false)
 assert.equal(ticketParticipants(updated).length,1)
 assert.equal(canManageTicket(updated,'ana'),true)
 assert.equal(canManageTicket(updated,'carla'),true)
})
test('responsável antigo em dados salvos não é contado como participante', () => {
 const legacy={...base,participants:[{technicianId:'ana',worked:true},{technicianId:'bruno',worked:false},{technicianId:'bruno',worked:false}]}
 assert.deepEqual(ticketParticipants(legacy).map(person=>person.technicianId),['bruno'])
 assert.equal(addCollaborator(legacy,'ana'),legacy)
 const promoted=updateTicket(legacy,{ownerId:'bruno'},'ana')
 assert.deepEqual(ticketParticipants(promoted).map(person=>person.technicianId),['ana'])
 assert.equal(canManageTicket(promoted,'bruno'),true)
})
test('dados antigos preservam o criador ao alterar responsável', () => {
 const legacy={...base,createdById:undefined}
 assert.equal(ticketCreatorId(legacy),'ana')
 const updated=updateTicket(legacy,{ownerId:'carla'},'ana')
 assert.equal(updated.createdById,'ana')
})
test('associação não concede contribuição sem trabalho', () => {
 const next=addCollaborator(base,'carla')
 assert.deepEqual(next.participants.at(-1),{technicianId:'carla',worked:false})
 assert.equal(addCollaborator(next,'carla'),next)
})
