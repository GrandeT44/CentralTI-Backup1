import { createId } from '../id.ts'
import { useState } from 'react'
import { Check, Pencil, X } from 'lucide-react'
import type { Data, Ticket, WorkSession } from '../domain'
import { fromSaoPaulo, localDateTime } from '../dateTime'
import { canManageTicket } from './ticketAccess'
import { convertQuickTicket } from './ticketOperations'
import { TicketChecklist } from './TicketChecklist'
import './TicketExtras.css'

type Props = { ticket: Ticket; data: Data; save: (data: Data) => void; active: string }

export function TicketExtras({ ticket, data, save, active }: Props) {
  const canEdit = canManageTicket(ticket, active)
  const [editing, setEditing] = useState(false)
  const [employee, setEmployee] = useState(ticket.employee ?? '')
  const [category, setCategory] = useState(ticket.category)
  const [solution, setSolution] = useState(ticket.solution ?? '')
  const [openedAt, setOpenedAt] = useState(localDateTime(ticket.openedAt))
  const [minutes, setMinutes] = useState('')
  const [error, setError] = useState('')
  const sessions = data.sessions.filter(session => session.ticketId === ticket.id)
  const update = (next: Ticket, nextSessions = data.sessions) => save({ ...data, tickets: data.tickets.map(item => item.id === ticket.id ? next : item), sessions: nextSessions })
  const saveDetails = () => {
    if (!canEdit) return
    try {
      const at = fromSaoPaulo(openedAt)
      const duration = minutes.trim() ? Number(minutes) : undefined
      if (duration !== undefined && (!Number.isInteger(duration) || duration <= 0)) throw new Error('Informe uma duração positiva em minutos.')
      const next: Ticket = { ...ticket, employee: employee.trim() || undefined, category: category.trim() || 'Não categorizado', solution: solution.trim() || undefined, openedAt: at, completedAt: ticket.status === 'Concluído' && ticket.completedAt === ticket.openedAt ? at : ticket.completedAt, progress: [...ticket.progress, { id: createId(), at: new Date().toISOString(), authorId: active, text: 'Detalhes do atendimento atualizados.', kind: 'progress' }] }
      let nextSessions = data.sessions
      if (duration !== undefined && sessions.length === 0) {
        const end = new Date(at)
        const session: WorkSession = { id: createId(), ticketId: ticket.id, technicianId: active, start: new Date(end.getTime() - duration * 60000).toISOString(), end: end.toISOString(), note: 'Duração informada após o registro' }
        nextSessions = [...nextSessions, session]
        next.durationMinutes = duration
        if (active !== ticket.ownerId) next.participants = next.participants.map(item => item.technicianId === active ? { ...item, worked: true } : item)
      }
      update(next, nextSessions)
      setEditing(false)
      setError('')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar os detalhes.') }
  }
  if (ticket.type === 'quick') return <><section className="ticket-extras"><div className="ticket-extras-head"><h2>Dados do atendimento</h2>{canEdit && !editing && <button type="button" onClick={() => { setEmployee(ticket.employee ?? ''); setCategory(ticket.category); setSolution(ticket.solution ?? ''); setOpenedAt(localDateTime(ticket.openedAt)); setEditing(true) }}><Pencil size={15} /> Complementar</button>}</div>{editing ? <div className="ticket-extras-form"><div className="ticket-extras-grid"><label>Funcionário atendido<input value={employee} onChange={event => setEmployee(event.target.value)} /></label><label>Categoria<input value={category} onChange={event => setCategory(event.target.value)} /></label><label>Data e horário do atendimento<input type="datetime-local" value={openedAt} onChange={event => setOpenedAt(event.target.value)} /></label>{sessions.length === 0 && <label>Duração real em minutos<input type="number" min="1" step="1" value={minutes} onChange={event => setMinutes(event.target.value)} placeholder="Opcional" /></label>}</div><label>Solução aplicada<textarea value={solution} onChange={event => setSolution(event.target.value)} rows={3} /></label>{sessions.length > 0 && <small>Há trabalho registrado. Use “Registrar tempo” para acrescentar outro intervalo.</small>}{error && <p role="alert" className="ticket-extras-error">{error}</p>}<div className="ticket-extras-actions"><button type="button" className="button" onClick={() => setEditing(false)}><X size={14} /> Cancelar</button><button type="button" className="button primary" onClick={saveDetails}><Check size={14} /> Salvar dados</button></div></div> : <p>Registrado em {new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }).format(new Date(ticket.openedAt))}{ticket.employee ? ` · ${ticket.employee}` : ''}{ticket.createdAt && ticket.createdAt !== ticket.openedAt ? ' · Data original do registro preservada' : ''}.</p>}</section>{canEdit && <button type="button" className="ticket-convert" onClick={() => { if (window.confirm('Converter este atendimento em atividade prolongada? O histórico e o trabalho registrado serão preservados.')) update(convertQuickTicket(ticket, active)) }}>Converter em atividade prolongada</button>}</>

  return <TicketChecklist ticket={ticket} data={data} save={save} active={active} />
}
