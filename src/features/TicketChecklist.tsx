import { createId } from '../id.ts'
import { useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Check, ClipboardCheck, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Data, Ticket, TicketStep } from '../domain'
import { addCollaborator, canManageTicket } from './ticketAccess'
import './TicketChecklist.css'

type Props = { ticket: Ticket; data: Data; save: (data: Data) => void; active: string }
type RowProps = { step: TicketStep; index: number; total: number; canEdit: boolean; executorName?: string; onToggle: (done: boolean) => void; onRename: (title: string) => void; onMove: (delta: number) => void; onDelete: () => void }

function StepRow({ step, index, total, canEdit, executorName, onToggle, onRename, onMove, onDelete }: RowProps) {
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState(step.title)
  const skipBlur = useRef(false)
  const startRename = () => { setDraft(step.title); setRenaming(true) }
  const finishRename = () => { if (skipBlur.current) { skipBlur.current = false; return } const value = draft.trim(); if (value && value !== step.title) onRename(value); setRenaming(false) }
  return <div className={step.done ? 'work-step is-done' : 'work-step'}>
    <span className="work-step-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
    <input className="work-step-check" type="checkbox" checked={step.done} disabled={!canEdit} aria-label={step.done ? `Reabrir ${step.title}` : `Marcar ${step.title} como executada por mim`} title={step.done ? 'Reabrir etapa' : 'Concluir como executor desta etapa'} onChange={event => onToggle(event.target.checked)} />
    <div className="work-step-content">{renaming ? <input className="work-step-rename" autoFocus aria-label={`Nome da etapa ${index + 1}`} value={draft} onChange={event => setDraft(event.target.value)} onBlur={finishRename} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); if (event.key === 'Escape') { skipBlur.current = true; setRenaming(false) } }} /> : canEdit ? <button className="work-step-title" type="button" onClick={startRename} title="Clique para renomear">{step.title}</button> : <strong className="work-step-title">{step.title}</strong>}<small>{step.done ? executorName ? `Concluída por ${executorName}` : 'Concluída · executor não informado' : 'Pendente'}</small></div>
    {canEdit && <div className="work-step-actions"><button type="button" aria-label={`Renomear ${step.title}`} title="Renomear" onClick={startRename}><Pencil size={14} /></button><button type="button" aria-label={`Mover ${step.title} para cima`} title="Mover para cima" disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp size={14} /></button><button type="button" aria-label={`Mover ${step.title} para baixo`} title="Mover para baixo" disabled={index === total - 1} onClick={() => onMove(1)}><ArrowDown size={14} /></button><button type="button" className="delete" aria-label={`Excluir ${step.title}`} title="Excluir" onClick={onDelete}><Trash2 size={14} /></button></div>}
  </div>
}

export function TicketChecklist({ ticket, data, save, active }: Props) {
  const canEdit = canManageTicket(ticket, active)
  const steps = ticket.steps ?? []
  const done = steps.filter(step => step.done).length
  const [newStep, setNewStep] = useState('')
  const updateSteps = (next: TicketStep[], message: string, recognizeExecutor = false) => { if (!canEdit) return; const linked = recognizeExecutor ? addCollaborator(ticket, active) : ticket; const updated: Ticket = { ...linked, steps: next, progress: [...linked.progress, { id: createId(), at: new Date().toISOString(), authorId: active, text: message, kind: 'milestone' }] }; save({ ...data, tickets: data.tickets.map(item => item.id === ticket.id ? updated : item) }) }
  const move = (index: number, delta: number) => { const next = [...steps]; const target = index + delta; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; updateSteps(next, 'Ordem das etapas atualizada.') }
  const add = () => { const title = newStep.trim(); if (!title) return; updateSteps([...steps, { id: createId(), title, done: false }], `Etapa adicionada: ${title}`); setNewStep('') }
  return <section className="work-checklist"><div className="work-checklist-header"><span className="work-checklist-symbol"><ClipboardCheck size={19} /></span><div><h2>Etapas da atividade</h2><p>Acompanhe o que já foi concluído.</p></div><span className="work-checklist-count">{done} de {steps.length}</span></div>
    <div className="work-checklist-progress" role="progressbar" aria-label="Progresso das etapas" aria-valuemin={0} aria-valuemax={steps.length || 1} aria-valuenow={done}><span style={{ width: `${steps.length ? done / steps.length * 100 : 0}%` }} /></div>
    {steps.length ? <div className="work-step-list">{steps.map((step, index) => <StepRow key={step.id} step={step} index={index} total={steps.length} canEdit={canEdit} executorName={data.technicians.find(person => person.id === step.completedById)?.name} onToggle={value => updateSteps(steps.map(item => item.id === step.id ? { ...item, done: value, completedById: value ? active : undefined } : item), `${value ? 'Etapa concluída' : 'Etapa reaberta'}: ${step.title}`, value)} onRename={value => updateSteps(steps.map(item => item.id === step.id ? { ...item, title: value } : item), `Etapa renomeada: ${value}`)} onMove={delta => move(index, delta)} onDelete={() => updateSteps(steps.filter(item => item.id !== step.id), `Etapa removida: ${step.title}`)} />)}</div> : <div className="work-checklist-empty"><ClipboardCheck size={20} /><span>Nenhuma etapa definida ainda.</span></div>}
    {canEdit && <form className="work-checklist-add" onSubmit={event => { event.preventDefault(); add() }}><input aria-label="Nova etapa" value={newStep} onChange={event => setNewStep(event.target.value)} placeholder="Adicionar uma etapa..." /><button type="submit" disabled={!newStep.trim()}><Plus size={15} /> Adicionar</button></form>}
    {steps.length > 0 && done === steps.length && <p className="work-checklist-note"><Check size={14} /> Todas as etapas foram concluídas. O encerramento do chamado é uma ação separada.</p>}
  </section>
}
