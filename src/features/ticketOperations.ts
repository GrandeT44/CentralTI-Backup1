import type { Ticket } from '../domain'
import { canChangeTicketOwner, canManageTicket, ticketCreatorId } from './ticketAccess.ts'

type Patch = Partial<Pick<Ticket, 'status' | 'ownerId' | 'priority'>>
export function updateTicket(ticket: Ticket, patch: Patch, authorId: string, now = new Date()): Ticket {
  if (!canManageTicket(ticket, authorId)) return ticket
  if (patch.ownerId && !canChangeTicketOwner(ticket, authorId)) return ticket
  const changed = Object.entries(patch).filter(([key, value]) => ticket[key as keyof Ticket] !== value)
  if (!changed.length) return ticket
  const status = patch.status ?? ticket.status
  const completedAt = status === 'Concluído' ? ticket.completedAt ?? now.toISOString() : undefined
  const text = changed.map(([key, value]) => key === 'status' ? `Status alterado para ${value}` : key === 'ownerId' ? `Responsável alterado para ${value}` : `Prioridade alterada para ${value}`).join('; ')
  const updated = { ...ticket, createdById: ticketCreatorId(ticket), ...patch, completedAt }
  return { ...updated, progress: [...updated.progress, { id: crypto.randomUUID(), at: now.toISOString(), authorId, text, kind: patch.status === 'Concluído' ? 'completion' : patch.status ? 'status' : patch.ownerId ? 'owner' : 'priority' }] }
}
export function convertQuickTicket(ticket: Ticket, authorId: string, now = new Date()): Ticket {
  if (ticket.type !== 'quick' || !canManageTicket(ticket, authorId)) return ticket
  return { ...ticket, type: 'long', status: 'Em andamento', completedAt: undefined, createdById: ticketCreatorId(ticket), steps: ticket.steps ?? [], progress: [...ticket.progress, { id: crypto.randomUUID(), at: now.toISOString(), authorId, text: 'Atendimento rápido convertido em atividade prolongada.', kind: 'status' }] }
}
