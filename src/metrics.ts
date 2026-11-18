import type { ActivityHeatmapDay, Data, Ticket, WorkSession } from './domain'
export const dayKey = (date: string | Date) => new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(date))
export const overdue = (ticket: Ticket, now = new Date()) => !!ticket.dueAt && !['Concluído','Cancelado'].includes(ticket.status) && new Date(ticket.dueAt).getTime() < now.getTime()
export const contributionIds = (ticket: Ticket) => {
  const participants = new Set(ticket.participants.map(person => person.technicianId))
  const eligible = new Set(ticket.participants.filter(person => person.worked).map(person => person.technicianId))
  for (const entry of ticket.progress) {
    if (entry.contributionEligible && ['progress', 'blocker', 'milestone', 'note'].includes(entry.kind ?? '')) eligible.add(entry.authorId)
  }
  for (const step of ticket.steps ?? []) {
    if (step.done && step.completedById) eligible.add(step.completedById)
  }
  return [...eligible].filter(id => id !== ticket.ownerId && participants.has(id))
}
export function unionMinutes(sessions: WorkSession[]) { const ranges = sessions.map(s => [new Date(s.start).getTime(),new Date(s.end).getTime()]).filter(([a,b])=>b>a).sort((a,b)=>a[0]-b[0]); let total=0, end=-Infinity; for (const [a,b] of ranges) { total += Math.max(0,b-Math.max(a,end)); end=Math.max(end,b) } return Math.round(total/60000) }
export function heatmapDays(data: Data, technicianId: string): ActivityHeatmapDay[] { const map = new Map<string,ActivityHeatmapDay>(); const get=(date:string)=>{const key=dayKey(date); if(!map.has(key))map.set(key,{date:key,completed:0,contributions:0,progress:0});return map.get(key)!}; for(const t of data.tickets){if(t.completedAt && t.status==='Concluído'){if(t.ownerId===technicianId)get(t.completedAt).completed++;if(contributionIds(t).includes(technicianId))get(t.completedAt).contributions++} for(const p of t.progress)if(t.type==='long' && p.authorId===technicianId && !/^(Status alterado|Responsável alterado|Prazo alterado|Trabalho registrado|Solução atualizada)/.test(p.text??''))get(p.at).progress++} return [...map.values()] }


