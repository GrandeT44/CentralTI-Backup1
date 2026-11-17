import type { Technician, Ticket } from '../domain'
import { dayKey, overdue } from '../metrics.ts'

export type QuickFilter = 'all' | 'mine' | 'working' | 'waiting' | 'overdue' | 'done'
export type SortKey = 'attention' | 'recent' | 'oldest' | 'due' | 'priority' | 'updated'
export type GroupKey = 'none' | 'status' | 'owner' | 'category'
export type TicketFilters = { query: string; quick: QuickFilter; owner: string; category: string; priority: string; type: string; from: string; to: string }
const priority = { Alta: 3, Média: 2, Baixa: 1 }
const latest = (ticket: Ticket) => ticket.progress.at(-1)?.at ?? ticket.completedAt ?? ticket.openedAt
export function matchesTicket(ticket: Ticket, filters: TicketFilters, active: string, now = new Date()) {
  const query = filters.query.trim().toLocaleLowerCase('pt-BR')
  const text = `${ticket.title} ${ticket.id} ${ticket.description} ${ticket.employee ?? ''}`.toLocaleLowerCase('pt-BR')
  if (query && !text.includes(query)) return false
  if (filters.quick === 'mine' && ticket.ownerId !== active && !ticket.participants.some(person => person.technicianId === active)) return false
  if (filters.quick === 'working' && ticket.status !== 'Em andamento') return false
  if (filters.quick === 'waiting' && ticket.status !== 'Aguardando terceiros') return false
  if (filters.quick === 'overdue' && !overdue(ticket, now)) return false
  if (filters.quick === 'done' && ticket.status !== 'Concluído') return false
  if (filters.owner !== 'all' && ticket.ownerId !== filters.owner) return false
  if (filters.category !== 'all' && ticket.category !== filters.category) return false
  if (filters.priority !== 'all' && ticket.priority !== filters.priority) return false
  if (filters.type !== 'all' && ticket.type !== filters.type) return false
  if (filters.from && dayKey(ticket.openedAt) < filters.from) return false
  if (filters.to && dayKey(ticket.openedAt) > filters.to) return false
  return true
}
export function sortTickets(tickets: Ticket[], sort: SortKey, now = new Date()) {
  return [...tickets].sort((a, b) => {
    if (sort === 'recent') return b.openedAt.localeCompare(a.openedAt)
    if (sort === 'oldest') return a.openedAt.localeCompare(b.openedAt)
    if (sort === 'updated') return latest(b).localeCompare(latest(a))
    if (sort === 'priority') return priority[b.priority] - priority[a.priority] || b.openedAt.localeCompare(a.openedAt)
    if (sort === 'due') return (a.dueAt ?? '9999').localeCompare(b.dueAt ?? '9999') || b.openedAt.localeCompare(a.openedAt)
    const score = (ticket: Ticket) => ticket.status === 'Concluído' || ticket.status === 'Cancelado' ? 0 : overdue(ticket, now) ? 4 : ticket.priority === 'Alta' ? 3 : ticket.status === 'Aguardando terceiros' ? 2 : 1
    return score(b) - score(a) || (a.dueAt ?? '9999').localeCompare(b.dueAt ?? '9999') || b.openedAt.localeCompare(a.openedAt)
  })
}
export function groupTickets(tickets: Ticket[], group: GroupKey, technicians: Technician[]) {
  if (group === 'none') return [{ key: 'all', label: 'Chamados', tickets }]
  const labels = new Map(technicians.map(technician => [technician.id, technician.name]))
  const result = new Map<string, Ticket[]>()
  for (const ticket of tickets) { const key = group === 'status' ? ticket.status : group === 'owner' ? ticket.ownerId : ticket.category; result.set(key, [...(result.get(key) ?? []), ticket]) }
  return [...result.entries()].map(([key, items]) => ({ key, label: group === 'owner' ? labels.get(key) ?? 'Sem responsável' : key, tickets: items }))
}

