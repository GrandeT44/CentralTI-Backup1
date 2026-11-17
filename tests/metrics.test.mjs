import test from 'node:test'
import assert from 'node:assert/strict'
import { overdue, contributionIds, dayKey, unionMinutes, heatmapDays } from '../src/metrics.ts'

const ticket = { type:'long', id:'1', ownerId:'ana', status:'Aberto', dueAt:'2026-11-15T12:00:00Z', participants:[], progress:[] }
test('atraso exige prazo e estado ativo', () => {
 assert.equal(overdue(ticket, new Date('2026-11-16T12:00:00Z')), true)
 assert.equal(overdue({...ticket,dueAt:undefined}, new Date('2026-11-16T12:00:00Z')), false)
 assert.equal(overdue({...ticket,status:'Concluído'}, new Date('2026-11-16T12:00:00Z')), false)
})
test('contribuição exige trabalho e não duplica técnico', () => {
 assert.deepEqual(contributionIds({...ticket,participants:[{technicianId:'bruno',worked:true},{technicianId:'bruno',worked:true},{technicianId:'carla',worked:false},{technicianId:'ana',worked:true}]}),['bruno'])
})
test('data respeita São Paulo e heatmap conta conclusão e progresso', () => {
 assert.equal(dayKey('2026-01-01T01:30:00Z'),'2025-12-31')
 const data={tickets:[{...ticket,status:'Concluído',completedAt:'2026-02-28T12:00:00Z',progress:[{authorId:'ana',at:'2026-02-28T11:00:00Z'}]}]}
 assert.deepEqual(heatmapDays(data,'ana'),[{date:'2026-02-28',completed:1,contributions:0,progress:1}])
})
test('intervalos efetivos sobrepostos contam uma vez', () => {
 assert.equal(unionMinutes([{start:'2026-11-16T10:00:00Z',end:'2026-11-16T12:00:00Z'},{start:'2026-11-16T11:00:00Z',end:'2026-11-16T13:00:00Z'}]),180)
})
test('heatmap distingue progresso manual de mudanças automáticas', () => {
 const data={tickets:[{...ticket,progress:[{authorId:'ana',at:'2026-11-16T12:00:00Z',text:'Status alterado para Em andamento'},{authorId:'ana',at:'2026-11-16T13:00:00Z',text:'Diagnóstico documentado'}]}]}
 assert.equal(heatmapDays(data,'ana')[0].progress,1)
})

