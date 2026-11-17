import type { Ticket } from '../domain'

export function ticketCreatorId(ticket: Ticket) { return ticket.createdById ?? ticket.ownerId }
export function canManageTicket(ticket: Ticket, technicianId: string) {
  return ticketCreatorId(ticket) === technicianId || ticket.participants.some(participant => participant.technicianId === technicianId)
}
export function addCollaborator(ticket: Ticket, technicianId: string) {
  if (technicianId === ticket.ownerId || ticket.participants.some(participant => participant.technicianId === technicianId)) return ticket
  return { ...ticket, participants: [...ticket.participants, { technicianId, worked: false }] }
}
