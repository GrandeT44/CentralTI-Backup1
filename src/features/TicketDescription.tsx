import { useRef, useState } from 'react'
import { Bold, Check, Code2, FileText, Italic, Link2, List, ListOrdered, Pencil, Strikethrough, Underline, X } from 'lucide-react'
import type { Data, Ticket } from '../domain'
import { canManageTicket } from './ticketAccess'
import './TicketDescription.css'

type Props = { ticket: Ticket; data: Data; save: (data: Data) => void; active: string }
type Selection = { start: number; end: number }

function InlineText({ value }: { value: string }) {
  const parts = value.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|\+\+[^+\n]+\+\+|~~[^~\n]+~~|`[^`\n]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g)
  return <>{parts.map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/)
    if (link) return <a key={index} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>
    if (part.startsWith('++') && part.endsWith('++')) return <u key={index}>{part.slice(2, -2)}</u>
    if (part.startsWith('~~') && part.endsWith('~~')) return <s key={index}>{part.slice(2, -2)}</s>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>
    return part
  })}</>
}

export function MarkdownDescription({ text }: { text: string }) {
  return <div className="ticket-markdown">{text.split('\n').map((line, index) => {
    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) { const content = <InlineText value={heading[2]} />; return heading[1].length === 1 ? <h3 key={index}>{content}</h3> : <h4 key={index}>{content}</h4> }
    const bullet = line.match(/^\s*[-*]\s+(.+)$/)
    if (bullet) return <p className="markdown-list" key={index}><span aria-hidden="true">•</span><InlineText value={bullet[1]} /></p>
    const numbered = line.match(/^\s*(\d+)\.\s+(.+)$/)
    if (numbered) return <p className="markdown-list" key={index}><span>{numbered[1]}.</span><InlineText value={numbered[2]} /></p>
    const quote = line.match(/^>\s+(.+)$/)
    if (quote) return <blockquote key={index}><InlineText value={quote[1]} /></blockquote>
    return line ? <p key={index}><InlineText value={line} /></p> : <div className="markdown-space" key={index} />
  })}</div>
}

export function TicketDescription({ ticket, data, save, active }: Props) {
  const canEdit = canManageTicket(ticket, active)
  const [editing, setEditing] = useState(() => window.location.hash === '#detalhes' && canEdit)
  const [draft, setDraft] = useState(ticket.description ?? '')
  const [selection, setSelection] = useState<Selection | null>(null)
  const [error, setError] = useState('')
  const textarea = useRef<HTMLTextAreaElement>(null)
  const showEditor = () => { setDraft(ticket.description ?? ''); setError(''); setEditing(true); requestAnimationFrame(() => textarea.current?.focus()) }
  const cancel = () => { setDraft(ticket.description ?? ''); setSelection(null); setEditing(false); setError('') }
  const saveDescription = () => { if (!canEdit) return; try { const value = draft.trim(); if (value === (ticket.description ?? '')) { setEditing(false); return } const next: Ticket = { ...ticket, description: value, progress: [...ticket.progress, { id: crypto.randomUUID(), at: new Date().toISOString(), authorId: active, text: 'Descrição atualizada.', kind: 'progress' }] }; save({ ...data, tickets: data.tickets.map(item => item.id === ticket.id ? next : item) }); setEditing(false); setSelection(null); setError('') } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a descrição.') } }
  const rememberSelection = () => { const field = textarea.current; if (!field) return; setSelection(field.selectionStart < field.selectionEnd ? { start: field.selectionStart, end: field.selectionEnd } : null) }
  const replaceSelection = (replacement: string, selectStart: number, selectEnd: number) => { const range = selection; if (!range) return; setDraft(current => current.slice(0, range.start) + replacement + current.slice(range.end)); setSelection(null); requestAnimationFrame(() => { textarea.current?.focus(); textarea.current?.setSelectionRange(selectStart, selectEnd) }) }
  const wrap = (before: string, after = before) => { if (!selection) return; const selected = draft.slice(selection.start, selection.end); replaceSelection(before + selected + after, selection.start + before.length, selection.end + before.length) }
  const list = (ordered: boolean) => { if (!selection) return; const selected = draft.slice(selection.start, selection.end); const replacement = selected.split('\n').map((line, index) => `${ordered ? `${index + 1}.` : '-'} ${line}`).join('\n'); replaceSelection(replacement, selection.start, selection.start + replacement.length) }
  const heading = () => { if (!selection) return; const start = draft.lastIndexOf('\n', selection.start - 1) + 1; const endFound = draft.indexOf('\n', selection.end); const end = endFound < 0 ? draft.length : endFound; const line = draft.slice(start, end).replace(/^#{1,3}\s+/, ''); const replacement = `## ${line}`; setDraft(draft.slice(0, start) + replacement + draft.slice(end)); setSelection(null); requestAnimationFrame(() => { textarea.current?.focus(); textarea.current?.setSelectionRange(start + 3, start + replacement.length) }) }
  const link = () => { if (!selection) return; const url = window.prompt('Endereço do link (https://)'); if (!url) return; if (!/^https?:\/\/\S+$/i.test(url)) { setError('Use um endereço que comece com http:// ou https://.'); return } const selected = draft.slice(selection.start, selection.end); replaceSelection(`[${selected}](${url})`, selection.start + 1, selection.end + 1); setError('') }
  return <section id="detalhes" className="ticket-description ticket-description-panel"><div className="ticket-description-heading"><div><span className="ticket-description-icon"><FileText size={17} /></span><div><h2>Descrição</h2><small>{ticket.type === 'long' ? 'Contexto e objetivo da atividade' : 'Detalhes do atendimento'}</small></div></div>{canEdit && !editing && <button type="button" className="ticket-description-edit" onClick={showEditor}><Pencil size={15} /> Editar</button>}</div><div className={editing ? 'ticket-description-surface editing' : 'ticket-description-surface'}>{editing ? <><div className="ticket-description-editor"><div className="ticket-description-editor-hint">Selecione o texto para formatar. Use Markdown para títulos, listas e links.</div>{selection && <div className="description-selection-toolbar" role="toolbar" aria-label="Formatar texto selecionado" onMouseDown={event => event.preventDefault()}><button type="button" onClick={heading} title="Título" aria-label="Transformar em título">H2</button><span className="toolbar-divider" /><button type="button" onClick={() => wrap('**')} title="Negrito" aria-label="Negrito"><Bold size={15} /></button><button type="button" onClick={() => wrap('*')} title="Itálico" aria-label="Itálico"><Italic size={15} /></button><button type="button" onClick={() => wrap('++')} title="Sublinhado" aria-label="Sublinhado"><Underline size={15} /></button><button type="button" onClick={() => wrap('~~')} title="Riscado" aria-label="Riscado"><Strikethrough size={15} /></button><button type="button" onClick={() => wrap('`')} title="Código" aria-label="Código"><Code2 size={15} /></button><span className="toolbar-divider" /><button type="button" onClick={() => list(false)} title="Lista" aria-label="Lista com marcadores"><List size={15} /></button><button type="button" onClick={() => list(true)} title="Lista numerada" aria-label="Lista numerada"><ListOrdered size={15} /></button><button type="button" onClick={link} title="Link" aria-label="Inserir link"><Link2 size={15} /></button></div>}<textarea ref={textarea} aria-label="Descrição do chamado" value={draft} onChange={event => setDraft(event.target.value)} onSelect={rememberSelection} onKeyUp={rememberSelection} onMouseUp={rememberSelection} rows={8} placeholder="Escreva o contexto, o objetivo e os detalhes importantes..." /></div>{error && <p className="ticket-description-error" role="alert">{error}</p>}<div className="ticket-description-actions"><button type="button" className="button" onClick={cancel}><X size={14} /> Cancelar</button><button type="button" className="button primary" onClick={saveDescription}><Check size={14} /> Salvar descrição</button></div></> : ticket.description ? <MarkdownDescription text={ticket.description} /> : <p className="ticket-description-empty">Nenhuma descrição registrada.{canEdit && <button type="button" onClick={showEditor}>Adicionar descrição</button>}</p>}</div></section>
}
