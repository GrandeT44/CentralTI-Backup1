import type { Ticket } from '../domain'
import { isAdministrator } from './administrator.ts'

export function ticketCreatorId(ticket: Ticket) { return ticket.createdById ?? ticket.ownerId }
export function ticketParticipants(ticket: Ticket) {
  const seen = new Set<string>()
  return ticket.participants.filter(participant => {
    if (participant.technicianId === ticket.ownerId || seen.has(participant.technicianId)) return false
    seen.add(participant.technicianId)
    return true
  })
}
export function canManageTicket(ticket: Ticket, technicianId: string) {
  return isAdministrator(technicianId) || ticketCreatorId(ticket) === technicianId || ticket.ownerId === technicianId || ticketParticipants(ticket).some(participant => participant.technicianId === technicianId)
}
export function canChangeTicketOwner(ticket: Ticket, technicianId: string) {
  return isAdministrator(technicianId) || ticketCreatorId(ticket) === technicianId
}
export function addCollaborator(ticket: Ticket, technicianId: string) {
  if (technicianId === ticket.ownerId || ticket.participants.some(participant => participant.technicianId === technicianId)) return ticket
  return { ...ticket, participants: [...ticket.participants, { technicianId, worked: false }] }
}
