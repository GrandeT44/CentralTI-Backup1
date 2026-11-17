import type { Ticket } from '../domain'
import { addCollaborator, canManageTicket, ticketCreatorId } from './ticketAccess.ts'

type Patch = Partial<Pick<Ticket, 'status' | 'ownerId' | 'priority'>>
export function updateTicket(ticket: Ticket, patch: Patch, authorId: string, now = new Date()): Ticket {
  if (!canManageTicket(ticket, authorId)) return ticket
  if (patch.ownerId && ticketCreatorId(ticket) !== authorId) return ticket
  const changed = Object.entries(patch).filter(([key, value]) => ticket[key as keyof Ticket] !== value)
  if (!changed.length) return ticket
  const status = patch.status ?? ticket.status
  const completedAt = status === 'Concluído' ? ticket.completedAt ?? now.toISOString() : undefined
  const text = changed.map(([key, value]) => key === 'status' ? `Status alterado para ${value}` : key === 'ownerId' ? `Responsável alterado para ${value}` : `Prioridade alterada para ${value}`).join('; ')
  const updated = { ...(patch.ownerId ? addCollaborator(ticket, patch.ownerId) : ticket), createdById: ticketCreatorId(ticket), ...patch, completedAt }
  return { ...updated, progress: [...updated.progress, { id: crypto.randomUUID(), at: now.toISOString(), authorId, text, kind: patch.status === 'Concluído' ? 'completion' : patch.status ? 'status' : patch.ownerId ? 'owner' : 'priority' }] }
}
