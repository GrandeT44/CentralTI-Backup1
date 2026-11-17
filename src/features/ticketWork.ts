import type { Data, TicketProgressEntry } from '../domain'
import { addCollaborator, canManageTicket } from './ticketAccess.ts'
import { localDateTime } from '../dateTime.ts'

export function recordTicketWork(data: Data, ticketId: string, technicianId: string, start: string, end: string, note = '', recordedAt = new Date()): Data {
  const ticket = data.tickets.find(item => item.id === ticketId)
  if (!ticket || !canManageTicket(ticket, technicianId)) throw new Error('Você não pode registrar trabalho neste chamado.')
  const startMs = new Date(start).getTime(), endMs = new Date(end).getTime()
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) throw new Error('Informe um intervalo com duração maior que zero.')
  if (data.sessions.some(session => session.ticketId === ticketId && session.technicianId === technicianId && session.start === start && session.end === end)) throw new Error('Este intervalo já foi registrado neste chamado.')
  const minutes = Math.round((endMs - startMs) / 60000)
  const linked = addCollaborator(ticket, technicianId)
  const participants = technicianId === ticket.ownerId ? linked.participants : linked.participants.map(participant => participant.technicianId === technicianId ? { ...participant, worked: true } : participant)
  const progress: TicketProgressEntry = { id: crypto.randomUUID(), at: recordedAt.toISOString(), authorId: technicianId, text: `Trabalho registrado: ${minutes} min em ${localDateTime(start).replace('T', ' ')}–${localDateTime(end).slice(11)}${note.trim() ? ` · ${note.trim()}` : ''}`, kind: 'work' }
  return { ...data, sessions: [...data.sessions, { id: crypto.randomUUID(), ticketId, technicianId, start, end, note: note.trim() || undefined }], tickets: data.tickets.map(item => item.id === ticketId ? { ...ticket, participants, progress: [...ticket.progress, progress] } : item) }
}
