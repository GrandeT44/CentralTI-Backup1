import test from 'node:test'
import assert from 'node:assert/strict'
import { matchesTicket, sortTickets, groupTickets } from '../src/features/ticketView.ts'
import { updateTicket } from '../src/features/ticketOperations.ts'
import { columnForTicket, normalizeBoard } from '../src/features/kanban.ts'
import { contributionIds } from '../src/metrics.ts'

const now = new Date('2026-11-16T15:00:00Z')
const base = { id:'TI-1', type:'long', title:'Rede do financeiro', description:'Sem conexão', employee:'Mariana Lima', ownerId:'ana', participants:[{technicianId:'bruno',worked:true},{technicianId:'carla',worked:false}], category:'Rede', priority:'Alta', status:'Em andamento', openedAt:'2026-11-12T12:00:00Z', dueAt:'2026-11-15T23:59:00Z', progress:[] }
const filters = { query:'', quick:'all', owner:'all', category:'all', priority:'all', type:'all', from:'', to:'' }
test('pesquisa inclui título, ID, descrição e funcionário; filtros se combinam', () => {
 for (const query of ['rede', 'TI-1', 'sem conexão', 'Mariana Lima']) assert.equal(matchesTicket(base,{...filters,query},'ana',now),true)
 assert.equal(matchesTicket(base,{...filters,quick:'mine',category:'Rede',priority:'Alta',type:'long',from:'2026-11-12',to:'2026-11-12'},'bruno',now),true)
 assert.equal(matchesTicket(base,{...filters,quick:'mine'},'carla',now),true)
 assert.equal(matchesTicket(base,{...filters,quick:'overdue'},'ana',now),true)
 assert.equal(matchesTicket(base,{...filters,owner:'bruno'},'ana',now),false)
})
test('ordenação padrão prioriza atraso e agrupamento não duplica registros', () => {
 const done = {...base,id:'TI-2',status:'Concluído',dueAt:undefined}
 assert.equal(sortTickets([done,base],'attention',now)[0].id,'TI-1')
 const groups = groupTickets([base,done],'status',[{id:'ana',name:'Ana',role:'TI',avatar:'A'}])
 assert.equal(groups.flatMap(group=>group.tickets).length,2)
})
test('conclusão conta uma vez e Kanban reflete o status global', () => {
 const completed = updateTicket(base,{status:'Concluído'},'ana',now)
 assert.equal(completed.completedAt,now.toISOString())
 assert.equal(contributionIds(completed).length,1)
 assert.equal(columnForTicket(completed,normalizeBoard()),'done')
 assert.equal(updateTicket(completed,{status:'Concluído'},'ana',now),completed)
 const reopened = updateTicket(completed,{status:'Em andamento'},'ana',now)
 assert.equal(reopened.completedAt,undefined)
 assert.equal(columnForTicket(reopened,normalizeBoard()),'doing')
})
