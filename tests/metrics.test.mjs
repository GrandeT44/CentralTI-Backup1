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
test('atualizações de trabalho dos quatro tipos geram um crédito por participante', () => {
 const participants=[{technicianId:'bruno',worked:false},{technicianId:'carla',worked:false},{technicianId:'davi',worked:false}]
 const progress=[
  {authorId:'bruno',kind:'progress',contributionEligible:true},
  {authorId:'bruno',kind:'blocker',contributionEligible:true},
  {authorId:'carla',kind:'milestone',contributionEligible:true},
  {authorId:'davi',kind:'note',contributionEligible:true},
  {authorId:'ana',kind:'progress',contributionEligible:true}
 ]
 assert.deepEqual(contributionIds({...ticket,participants,progress}).sort(),['bruno','carla','davi'])
})
test('eventos administrativos, atualização sem confirmação e etapa sem executor não geram crédito', () => {
 const participants=[{technicianId:'bruno',worked:false}]
 const progress=[{authorId:'bruno',kind:'owner',contributionEligible:true},{authorId:'bruno',kind:'progress'},{authorId:'bruno',kind:'work'}]
 const steps=[{id:'a',done:true},{id:'b',done:false,completedById:'bruno'}]
 assert.deepEqual(contributionIds({...ticket,participants,progress,steps}),[])
})
test('etapa concluída credita seu executor associado até ser reaberta', () => {
 const participants=[{technicianId:'bruno',worked:false}]
 const step={id:'a',done:true,completedById:'bruno'}
 assert.deepEqual(contributionIds({...ticket,participants,steps:[step]}),['bruno'])
 assert.deepEqual(contributionIds({...ticket,participants,steps:[{...step,done:false}]}),[])
 assert.deepEqual(contributionIds({...ticket,participants:[],steps:[step]}),[])
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

