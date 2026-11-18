import { createId } from '../id.ts'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CalendarDays, GripVertical, LayoutGrid, List, Plus, Pencil, Trash2, Users } from 'lucide-react'
import type { Data, KanbanBoard, Ticket } from '../domain'
import { columnForTicket, normalizeBoard } from './kanban'
import { canManageTicket, ticketCreatorId, ticketParticipants } from './ticketAccess'
import { updateTicket } from './ticketOperations'
import { CreateTicketButton } from './TicketCreation'
import { useTicketCreation } from './ticketCreationContext'

type Props = { data: Data; save: (data: Data) => void; technicianId: string }
const tone = (id: string) => id === 'done' ? 'done' : id === 'doing' ? 'doing' : id === 'todo' ? 'todo' : 'custom'
const date = (value: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'short' }).format(new Date(value))

export function PersonalKanban({ data, save, technicianId }: Props) {
  const navigate = useNavigate()
  const creation = useTicketCreation()
  const board = normalizeBoard(data.kanbanBoards?.[technicianId])
  const tickets = data.tickets.filter(ticket => ticketCreatorId(ticket) === technicianId || ticket.ownerId === technicianId || ticket.participants.some(person => person.technicianId === technicianId))
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [dragging, setDragging] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [editingDraft, setEditingDraft] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const saveBoard = (next: KanbanBoard, nextTickets = data.tickets) => save({ ...data, tickets: nextTickets, kanbanBoards: { ...data.kanbanBoards, [technicianId]: next } })
  const addColumn = (event: React.FormEvent) => { event.preventDefault(); const name = newName.trim(); if (!name) return; saveBoard({ ...board, columns: [...board.columns, { id: createId(), name, custom: true }] }); setAdding(false); setNewName('') }
  const addDraft = (event: React.FormEvent) => { event.preventDefault(); const title = draftTitle.trim(); if (!title) return; saveBoard({ ...board, drafts: [...(board.drafts ?? []), { id: createId(), title, createdAt: new Date().toISOString() }] }); setDraftTitle('') }
  const renameDraft = (id: string) => { const title = editingTitle.trim(); if (title) saveBoard({ ...board, drafts: board.drafts?.map(draft => draft.id === id ? { ...draft, title } : draft) }); setEditingDraft(null) }
  const removeDraft = (id: string) => saveBoard({ ...board, drafts: board.drafts?.filter(draft => draft.id !== id) })
  const reorder = (columnId: string, index: number) => { const from = board.columns.findIndex(column => column.id === columnId); if (from < 0 || index < 0 || index >= board.columns.length || from === index) return; const columns = [...board.columns]; const [column] = columns.splice(from, 1); columns.splice(index, 0, column); saveBoard({ ...board, columns }) }
  const moveTicket = (ticket: Ticket, columnId: string) => {
    if (!canManageTicket(ticket, technicianId) || ticket.type === 'quick' || ticket.status === 'Cancelado') return
    if (columnId === 'done' && ticket.status !== 'Concluído') { navigate(`/chamados/${ticket.id}?concluir=1`); return }
    const status = columnId === 'todo' ? 'Aberto' : columnId === 'doing' ? 'Em andamento' : columnId === 'done' ? 'Concluído' : ticket.status
    const updated = status === ticket.status ? ticket : updateTicket(ticket, { status }, technicianId)
    saveBoard({ ...board, placements: { ...board.placements, [ticket.id]: { columnId, statusAtMove: status } } }, data.tickets.map(item => item.id === ticket.id ? updated : item))
  }
  const deleteColumn = (columnId: string) => { const placements = Object.fromEntries(Object.entries(board.placements).filter(([, placement]) => placement.columnId !== columnId)); saveBoard({ ...board, columns: board.columns.filter(column => column.id !== columnId), placements }) }
  const renameColumn = (columnId: string) => { const name = renameValue.trim(); if (!name) return; saveBoard({ ...board, columns: board.columns.map(column => column.id === columnId ? { ...column, name } : column) }); setRenaming(null) }
  const drop = (event: React.DragEvent, columnId: string) => { event.preventDefault(); const payload = event.dataTransfer.getData('text/plain'); const [kind, id] = payload.split(':'); if (kind === 'ticket') { const ticket = tickets.find(item => item.id === id); if (ticket) moveTicket(ticket, columnId) } else if (kind === 'column') reorder(id, board.columns.findIndex(column => column.id === columnId)); setDragging(null) }
  return <section className={board.compact ? 'personal-kanban is-compact' : 'personal-kanban'}><div className="profile-section-heading"><div><span className="section-kicker">ORGANIZE SEU FLUXO</span><h2>Meu quadro</h2><p>Chamados e ideias de trabalho, no ritmo do seu dia.</p></div><div className="planning-board-actions"><button type="button" className="button planning-compact-toggle" aria-pressed={!!board.compact} onClick={() => saveBoard({ ...board, compact: !board.compact })}>{board.compact ? <LayoutGrid size={16} /> : <List size={16} />}{board.compact ? 'Modo confortável' : 'Modo compacto'}</button><CreateTicketButton className="button primary"><Plus size={16} /> Novo chamado</CreateTicketButton></div></div>
    <div className="kanban-board">{board.columns.map((column, index) => { const items = tickets.filter(ticket => columnForTicket(ticket, board) === column.id); const count = items.length + (column.id === 'todo' ? (board.drafts?.length ?? 0) : 0); return <div className={`kanban-column ${dragging === `column:${column.id}` ? 'dragging' : ''}`} key={column.id} onDragOver={event => event.preventDefault()} onDrop={event => drop(event, column.id)}>
      <div className="kanban-column-head" draggable onDragStart={event => { event.dataTransfer.setData('text/plain', `column:${column.id}`); setDragging(`column:${column.id}`) }} onDragEnd={() => setDragging(null)}><span className={`column-dot ${tone(column.id)}`} /><div className="column-title">{renaming === column.id ? <form onSubmit={event => { event.preventDefault(); renameColumn(column.id) }}><input autoFocus aria-label="Nome da coluna" value={renameValue} onChange={event => setRenameValue(event.target.value)} onBlur={() => renameColumn(column.id)} /></form> : <strong>{column.name}</strong>}<span>{count}</span></div><GripVertical size={15} className="drag-grip" aria-hidden /></div>
      <div className="column-actions"><button title="Mover coluna para a esquerda" aria-label={`Mover ${column.name} para a esquerda`} disabled={index === 0} onClick={() => reorder(column.id, index - 1)}><ArrowLeft size={15} /></button><button title="Mover coluna para a direita" aria-label={`Mover ${column.name} para a direita`} disabled={index === board.columns.length - 1} onClick={() => reorder(column.id, index + 1)}><ArrowRight size={15} /></button>{column.custom && <><button title="Renomear coluna" aria-label={`Renomear ${column.name}`} onClick={() => { setRenaming(column.id); setRenameValue(column.name) }}><Pencil size={14} /></button><button title="Excluir coluna" aria-label={`Excluir ${column.name}`} onClick={() => deleteColumn(column.id)}><Trash2 size={14} /></button></>}</div>
      <div className="kanban-items">
        {column.id === 'todo' && <>
          {(board.drafts ?? []).map(draft => <article className="kanban-draft" key={draft.id}>
            <span className="kanban-draft-label">BLOCO PESSOAL</span>
            {editingDraft === draft.id ? <form className="kanban-draft-edit" onSubmit={event => { event.preventDefault(); renameDraft(draft.id) }}><input autoFocus aria-label="Nome do bloco" value={editingTitle} onChange={event => setEditingTitle(event.target.value)} /><button type="submit">Salvar</button></form> : <strong>{draft.title}</strong>}
            <div className="kanban-draft-actions"><button type="button" onClick={() => creation.open('long', { title: draft.title, sourceDraftId: draft.id })}><Plus size={14} /> Criar chamado</button><button type="button" aria-label={`Editar ${draft.title}`} title="Editar bloco" onClick={() => { setEditingDraft(draft.id); setEditingTitle(draft.title) }}><Pencil size={14} /></button><button type="button" aria-label={`Excluir ${draft.title}`} title="Excluir bloco" onClick={() => removeDraft(draft.id)}><Trash2 size={14} /></button></div>
          </article>)}
          <form className="kanban-draft-add" onSubmit={addDraft}><input aria-label="Novo bloco em A fazer" value={draftTitle} onChange={event => setDraftTitle(event.target.value)} placeholder="Adicionar um bloco..." /><button type="submit" disabled={!draftTitle.trim()} aria-label="Adicionar bloco"><Plus size={17} /></button></form>
        </>}
        {items.map(ticket => <article className={`kanban-card ${ticket.ownerId !== technicianId ? 'shared' : ''}`} key={ticket.id} draggable={canManageTicket(ticket, technicianId) && ticket.type !== 'quick' && ticket.status !== 'Cancelado'} onDragStart={event => { event.dataTransfer.setData('text/plain', `ticket:${ticket.id}`); setDragging(`ticket:${ticket.id}`) }} onDragEnd={() => setDragging(null)}><div className="kanban-card-top"><span>{ticket.id}</span><span className={`kanban-type ${ticket.type}`}>{ticket.type === 'quick' ? 'Rápido' : 'Prolongado'}</span></div><Link to={`/chamados/${ticket.id}`} className="kanban-card-title">{ticket.title}</Link>{ticket.description && <p>{ticket.description}</p>}<div className="kanban-card-meta"><span>{ticket.category}</span><span>{ticket.priority}</span>{ticket.dueAt && <span className="due"><CalendarDays size={12} />{date(ticket.dueAt)}</span>}</div>{ticketParticipants(ticket).length > 0 && <div className="kanban-collaborators"><Users size={13} /> {ticketParticipants(ticket).length} participante(s)</div>}{ticket.ownerId !== technicianId && <span className="kanban-shared">Participação em chamado de outro técnico</span>}<label className="kanban-move-label">Mover para<select aria-label={`Mover ${ticket.title} para outra coluna`} value={column.id} disabled={!canManageTicket(ticket, technicianId) || ticket.type === 'quick' || ticket.status === 'Cancelado'} onChange={event => moveTicket(ticket, event.target.value)}>{board.columns.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label></article>)}{count === 0 && <div className="kanban-empty"><span className={`column-dot ${tone(column.id)}`} /><strong>Sem chamados aqui</strong><p>Arraste um card ou use o seletor para organizar esta coluna.</p></div>}</div></div> })}
      <div className="kanban-add-column">{adding ? <form onSubmit={addColumn}><label>Nova coluna<input autoFocus value={newName} onChange={event => setNewName(event.target.value)} placeholder="Ex.: Aguardando revisão" /></label><div><button className="button primary">Adicionar</button><button type="button" className="button" onClick={() => setAdding(false)}>Cancelar</button></div></form> : <button className="add-column-button" onClick={() => setAdding(true)}><Plus size={18} /> Adicionar coluna</button>}</div></div><p className="kanban-hint">Blocos pessoais ficam em “A fazer” até virarem chamados. Chamados concluídos entram em “Feitos”. Mover um chamado entre colunas padrão atualiza seu status para todos os participantes. Colunas personalizadas organizam sem alterar o status.</p>
  </section>
}



