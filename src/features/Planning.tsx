import type { Data } from '../domain'
import { NotebookPen } from 'lucide-react'
import { PersonalKanban } from './PersonalKanban'
import { columnForTicket, normalizeBoard } from './kanban'
import './Planning.css'

type Props = { data: Data; save: (data: Data) => void; active: string; notes: string; notesError: string; saveNotes: (notes: string) => void }

export function Planning({ data, save, active, notes, notesError, saveNotes }: Props) {
  const board = normalizeBoard(data.kanbanBoards?.[active])
  const activeTickets = data.tickets.filter(ticket => ticket.ownerId === active && columnForTicket(ticket, board) === 'doing').length

  return <div className="planning-page">
    <header className="planning-hero"><div><span className="section-kicker">ESPAÇO PESSOAL</span><h1>Planejamento</h1><p>Organize ideias e chamados em um só lugar.</p></div><div className="planning-hero-count"><strong>{activeTickets}</strong><span>itens em foco</span></div></header>
    <section className="planning-notes-panel"><div className="planning-section-head"><span className="planning-icon yellow"><NotebookPen size={19} /></span><div><span className="section-kicker">SÓ PARA VOCÊ</span><h2>Bloco de notas</h2></div></div><p>Anote ideias, lembretes e próximos passos. Salvo no seu perfil, no banco local.</p><textarea aria-label="Minhas notas pessoais" placeholder="Comece a escrever suas notas..." value={notes} onChange={event => saveNotes(event.target.value)} />{notesError && <p role="alert" className="planning-notes-error">{notesError}</p>}</section>
    <PersonalKanban data={data} save={save} technicianId={active} />
  </div>
}
