import type { Data } from '../domain'
import { NotebookPen } from 'lucide-react'
import { PersonalKanban } from './PersonalKanban'
import './Planning.css'

type Props = { data: Data; save: (data: Data) => void; active: string }

export function Planning({ data, save, active }: Props) {
  const activeTickets = data.tickets.filter(ticket => ticket.ownerId === active && !['Concluído', 'Cancelado'].includes(ticket.status)).length
  const drafts = data.kanbanBoards?.[active]?.drafts?.length ?? 0

  return <div className="planning-page">
    <header className="planning-hero"><div><span className="section-kicker">ESPAÇO PESSOAL</span><h1>Planejamento</h1><p>Organize ideias e chamados em um só lugar.</p></div><div className="planning-hero-count"><strong>{activeTickets + drafts}</strong><span>itens em foco</span></div></header>
    <section className="planning-notes-panel"><div className="planning-section-head"><span className="planning-icon yellow"><NotebookPen size={19} /></span><div><span className="section-kicker">SÓ PARA VOCÊ</span><h2>Bloco de notas</h2></div></div><p>Anote ideias, lembretes e próximos passos. Salvo automaticamente neste navegador para o perfil ativo.</p><textarea aria-label="Minhas notas pessoais" placeholder="Comece a escrever suas notas..." value={data.personalNotes?.[active] ?? ''} onChange={event => save({ ...data, personalNotes: { ...data.personalNotes, [active]: event.target.value } })} /></section>
    <PersonalKanban data={data} save={save} technicianId={active} />
  </div>
}