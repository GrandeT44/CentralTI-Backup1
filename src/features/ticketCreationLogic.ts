import type { Data, Priority, Ticket, TicketStep, WorkSession } from '../domain.ts'
import { fromSaoPaulo } from '../dateTime.ts'

export type TimerState = { elapsedMs: number; runningSince: number | null }
export const emptyTimer = (): TimerState => ({ elapsedMs: 0, runningSince: null })
export const startTimer = (now: number): TimerState => ({ elapsedMs: 0, runningSince: now })
export const pauseTimer = (timer: TimerState, now: number): TimerState => ({ elapsedMs: timerElapsedMs(timer, now), runningSince: null })
export const resumeTimer = (timer: TimerState, now: number): TimerState => timer.runningSince === null ? { ...timer, runningSince: now } : timer
export const timerElapsedMs = (timer: TimerState, now: number) => timer.elapsedMs + (timer.runningSince === null ? 0 : Math.max(0, now - timer.runningSince))

export type QuickInput = { title: string; technicianId: string; now?: Date; durationMinutes?: number }
export type LongInput = { title: string; description: string; creatorId: string; ownerId: string; category: string; priority: Priority; dueDate?: string; openedAt?: string; participantIds: string[]; status: 'Aberto' | 'Em andamento'; steps: TicketStep[] }
const nextId = (data: Data) => `TI-${Math.max(1042, ...data.tickets.map(ticket => Number(ticket.id.replace(/^TI-/, '')) || 0)) + 1}`

export function createQuickTicket(data: Data, input: QuickInput): { data: Data; ticket: Ticket } {
  const title = input.title.trim()
  if (!title) throw new Error('Informe o título do atendimento.')
  if (!data.technicians.some(item => item.id === input.technicianId)) throw new Error('Técnico ativo não encontrado.')
  if (input.durationMinutes !== undefined && (!Number.isFinite(input.durationMinutes) || input.durationMinutes <= 0)) throw new Error('Informe uma duração positiva.')
  const now = input.now ?? new Date()
  const at = now.toISOString()
  const ticket: Ticket = { id: nextId(data), type: 'quick', title, description: '', createdById: input.technicianId, createdAt: at, ownerId: input.technicianId, participants: [], category: 'Não categorizado', priority: 'Média', status: 'Concluído', openedAt: at, completedAt: at, progress: [{ id: crypto.randomUUID(), at, authorId: input.technicianId, text: 'Atendimento registrado como concluído.', kind: 'completion' }] }
  const session: WorkSession[] = input.durationMinutes === undefined ? [] : [{ id: crypto.randomUUID(), ticketId: ticket.id, technicianId: input.technicianId, start: new Date(now.getTime() - input.durationMinutes * 60000).toISOString(), end: at, note: 'Atendimento cronometrado' }]
  if (input.durationMinutes !== undefined) ticket.durationMinutes = input.durationMinutes
  return { ticket, data: { ...data, tickets: [ticket, ...data.tickets], sessions: [...data.sessions, ...session] } }
}

export function createLongTicket(data: Data, input: LongInput, now = new Date()): { data: Data; ticket: Ticket } {
  const title = input.title.trim()
  if (!title) throw new Error('Informe o título da atividade.')
  if (!data.technicians.some(item => item.id === input.creatorId) || !data.technicians.some(item => item.id === input.ownerId)) throw new Error('Técnico não encontrado.')
  const openedAt = input.openedAt ? fromSaoPaulo(input.openedAt) : now.toISOString()
  const dueAt = input.dueDate ? fromSaoPaulo(`${input.dueDate}T23:59`) : undefined
  if (dueAt && new Date(dueAt).getTime() < new Date(openedAt).getTime()) throw new Error('O prazo deve ser posterior à abertura.')
  const participantIds = [...new Set(input.participantIds)].filter(id => id !== input.creatorId && id !== input.ownerId && data.technicians.some(item => item.id === id))
  if (input.steps.some(step => !step.title.trim())) throw new Error('Preencha ou remova as etapas sem nome.')
  const steps = input.steps.map(step => ({ ...step, title: step.title.trim() }))
  const ticket: Ticket = { id: nextId(data), type: 'long', title, description: input.description.trim(), createdById: input.creatorId, createdAt: now.toISOString(), ownerId: input.ownerId, participants: participantIds.map(technicianId => ({ technicianId, worked: false })), category: input.category || 'Não categorizado', priority: input.priority, status: input.status, openedAt, dueAt, progress: [], steps }
  return { ticket, data: { ...data, tickets: [ticket, ...data.tickets] } }
}
