import { useState } from 'react'
import type { Data, PlannedActivity } from '../domain'
import { dateKey, fromSaoPaulo, timeLabel } from '../dateTime'
import { unionMinutes } from '../metrics'
import { canManageTicket } from './ticketAccess'
import { recordTicketWork } from './ticketWork'
import './Planning.css'

type Props = { data: Data; save: (data: Data) => void; active: string }
const newId = () => crypto.randomUUID()
const shift = (day: string, amount: number) => { const d = new Date(`${day}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + amount); return d.toISOString().slice(0, 10) }
const coordinate = (time: string) => { const [h, m] = time.split(':').map(Number); return ((h * 60 + m) / 1440) * 100 }
export function Planning({ data, save, active }: Props) {
  const [day, setDay] = useState(dateKey(new Date()))
  const [editing, setEditing] = useState<string | null>(null)
  const [ticketId, setTicket] = useState(data.tickets.find(ticket => canManageTicket(ticket, active))?.id ?? '')
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('10:00')
  const [note, setNote] = useState('')
  const [weekly, setWeekly] = useState(false)
  const [error, setError] = useState('')
  const plans = data.plans.filter(p => p.technicianId === active && dateKey(p.start) === day)
  const sessions = data.sessions.filter(s => s.technicianId === active && dateKey(s.start) === day)
  const ticketName = (id: string) => data.tickets.find(t => t.id === id)?.title ?? 'Chamado removido'
  const edit = (p: PlannedActivity) => { setEditing(p.id); setTicket(p.ticketId); setStart(timeLabel(p.start)); setEnd(timeLabel(p.end)); setNote(p.note ?? ''); setWeekly(false) }
  const reset = () => { setEditing(null); setNote(''); setError('') }
  const addPlan = (event: React.FormEvent) => {
    event.preventDefault()
    const selectedTicket = data.tickets.find(ticket => ticket.id === ticketId)
    if (!selectedTicket || !canManageTicket(selectedTicket, active)) { setError('Você não pode planejar trabalho neste chamado.'); return }
    if (end <= start) { setError('O fim deve ser posterior ao início.'); return }
    try {
      const days = weekly ? Array.from({ length: 5 }, (_, index) => shift(day, index)) : [day]
      const entries = days.map(date => ({ id: editing ?? newId(), technicianId: active, ticketId, start: fromSaoPaulo(`${date}T${start}`), end: fromSaoPaulo(`${date}T${end}`), note }))
      save({ ...data, plans: [...data.plans.filter(p => p.id !== editing), ...entries] })
      reset()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o plano.') }
  }
  return <><div className="title"><span className="eyebrow">PLANEJAMENTO / BARRA DO DIA</span><h1>Planejamento</h1><p>Blocos previstos e trabalho realizado, sem somar o mesmo intervalo duas vezes.</p></div>
    <section className="panel"><div className="filters"><button className="button" onClick={() => setDay(shift(day, -1))}>← Dia anterior</button><label>Dia<input type="date" value={day} onChange={e => setDay(e.target.value)} /></label><button className="button" onClick={() => setDay(shift(day, 1))}>Próximo dia →</button></div>
      <div className="time-scale">{Array.from({ length: 13 }, (_, i) => <span key={i}>{String(i * 2).padStart(2, '0')}h</span>)}</div>
      <div className="day-lanes"><div className="day-lane"><strong>Planejado</strong><div className="lane-track">{plans.map(p => <div key={p.id} className="lane-block planned" title={`${timeLabel(p.start)}–${timeLabel(p.end)} · ${ticketName(p.ticketId)}`} style={{ left: `${coordinate(timeLabel(p.start))}%`, width: `${coordinate(timeLabel(p.end)) - coordinate(timeLabel(p.start))}%` }} />)}</div></div><div className="day-lane"><strong>Realizado</strong><div className="lane-track">{sessions.map(s => <div key={s.id} className="lane-block actual" title={`${timeLabel(s.start)}–${timeLabel(s.end)} · ${ticketName(s.ticketId)}`} style={{ left: `${coordinate(timeLabel(s.start))}%`, width: `${coordinate(timeLabel(s.end)) - coordinate(timeLabel(s.start))}%` }} />)}</div></div></div>
      {plans.map(p => <div className="plan planned" key={p.id}><span>{timeLabel(p.start)}–{timeLabel(p.end)} · {ticketName(p.ticketId)} {p.note && `· ${p.note}`}</span><span><button onClick={() => edit(p)}>Editar</button><button onClick={() => save({ ...data, plans: data.plans.filter(x => x.id !== p.id) })}>Excluir</button></span></div>)}
      {sessions.map(s => <div className="plan actual" key={s.id}>{timeLabel(s.start)}–{timeLabel(s.end)} · {ticketName(s.ticketId)} · {s.note ?? 'Trabalho realizado'}</div>)}
      {!plans.length && !sessions.length && <p className="empty">Nenhuma atividade registrada neste dia.</p>}<p>Tempo efetivo: {unionMinutes(sessions)} minutos.</p></section>
    <form className="panel form" onSubmit={addPlan}><h2>{editing ? 'Editar bloco' : 'Planejar atividade'}</h2><div className="form-grid"><label>Chamado<select value={ticketId} onChange={e => setTicket(e.target.value)}>{data.tickets.filter(t => canManageTicket(t, active)).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label><label>Observação<input value={note} onChange={e => setNote(e.target.value)} /></label><label>Início<input type="time" value={start} onChange={e => setStart(e.target.value)} /></label><label>Fim<input type="time" value={end} onChange={e => setEnd(e.target.value)} /></label></div>{!editing && <label className="check"><input type="checkbox" checked={weekly} onChange={e => setWeekly(e.target.checked)} /> Repetir por cinco dias a partir da data selecionada</label>}{error && <p className="danger" role="alert">{error}</p>}<div className="filters"><button className="button primary" disabled={!ticketId}>Salvar planejamento</button>{editing && <button type="button" className="button" onClick={reset}>Cancelar edição</button>}</div></form>
    <WorkForm data={data} save={save} active={active} day={day} /></>
}
function WorkForm({ data, save, active, day }: Props & { day: string }) {
  const [ticketId, setTicket] = useState(data.tickets.find(ticket => canManageTicket(ticket, active))?.id ?? '')
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('10:00')
  const [note, setNote] = useState('Atendimento imprevisto')
  const [error, setError] = useState('')
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (end <= start) { setError('O fim deve ser posterior ao início.'); return } try { const startIso = fromSaoPaulo(`${day}T${start}`), endIso = fromSaoPaulo(`${day}T${end}`); const ticket = data.tickets.find(t => t.id === ticketId); if (!ticket || !canManageTicket(ticket, active)) { setError('Você não pode registrar trabalho neste chamado.'); return } save(recordTicketWork(data, ticketId, active, startIso, endIso, note)); setError('') } catch (cause) { setError(cause instanceof Error ? cause.message : 'Horário inválido.') } }
  return <form className="panel form" onSubmit={submit}><h2>Registrar trabalho realizado</h2><p>Use esta área também para atendimentos imprevistos e registros retroativos.</p><div className="form-grid"><label>Chamado<select value={ticketId} onChange={e => setTicket(e.target.value)}>{data.tickets.filter(t => canManageTicket(t, active)).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label><label>Descrição<input value={note} onChange={e => setNote(e.target.value)} /></label><label>Início<input type="time" value={start} onChange={e => setStart(e.target.value)} /></label><label>Fim<input type="time" value={end} onChange={e => setEnd(e.target.value)} /></label></div>{error && <p className="danger" role="alert">{error}</p>}<button className="button primary" disabled={!ticketId}>Registrar trabalho</button></form>
}


