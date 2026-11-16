import { useState } from 'react'
import type { Data } from '../domain'
import { dateKey } from '../dateTime'
import { contributionIds, overdue, unionMinutes } from '../metrics'
import { Evolution, type Period } from './Evolution'
type Props = { data: Data }
export function Reports({ data }: Props) {
  const [technician, setTechnician] = useState('Todos')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [period, setPeriod] = useState<Period>('week')
  const inRange = (date: string) => (!from || dateKey(date) >= from) && (!to || dateKey(date) <= to)
  const tickets = data.tickets.filter(t => (technician === 'Todos' || t.ownerId === technician || contributionIds(t).includes(technician)) && inRange(t.openedAt))
  const sessions = data.sessions.filter(s => (technician === 'Todos' || s.technicianId === technician) && inRange(s.start))
  const minutes = technician === 'Todos' ? data.technicians.reduce((n, t) => n + unionMinutes(sessions.filter(s => s.technicianId === t.id)), 0) : unionMinutes(sessions)
  const categories = [...new Set(tickets.map(t => t.category))].map(name => ({ name, value: tickets.filter(t => t.category === name).length }))
  const contributions = tickets.reduce((n, t) => n + (technician === 'Todos' ? contributionIds(t).length : Number(contributionIds(t).includes(technician))), 0)
  const csv = () => { const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`; const rows = [['ID', 'Título', 'Status', 'Categoria', 'Responsável', 'Abertura', 'Conclusão', 'Prazo', 'Participações'], ...tickets.map(t => [t.id, t.title, t.status, t.category, data.technicians.find(x => x.id === t.ownerId)?.name, dateKey(t.openedAt), t.completedAt ? dateKey(t.completedAt) : '', t.dueAt ? dateKey(t.dueAt) : '', contributionIds(t).map(id => data.technicians.find(x => x.id === id)?.name).join(', ')])]; const blob = new Blob(['\ufeff', rows.map(row => row.map(escape).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'relatorio-ti.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000) }
  return <><div className="title"><span className="eyebrow">GESTÃO / RELATÓRIOS</span><h1>Relatórios</h1><p>Indicadores da equipe e dos atendimentos, sem comparação competitiva.</p></div><section className="panel"><div className="filters"><label>Técnico<select value={technician} onChange={e => setTechnician(e.target.value)}><option>Todos</option>{data.technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label>De<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label><label>Até<input type="date" value={to} onChange={e => setTo(e.target.value)} /></label><button className="button" onClick={csv}>Exportar CSV</button></div><div className="report-grid"><div><strong>{tickets.length}</strong><span>Chamados relacionados</span></div><div><strong>{tickets.filter(t => t.status === 'Concluído').length}</strong><span>Concluídos</span></div><div><strong>{tickets.filter(t => overdue(t)).length}</strong><span>Atrasados</span></div><div><strong>{minutes} min</strong><span>Tempo efetivo</span></div></div><p>{contributions} participação(ões) efetivas em chamados compartilhados.</p><h2>Distribuição por categoria</h2>{categories.map(item => <div className="bar-row" key={item.name}><span>{item.name}</span><div className="track"><div style={{ width: `${item.value / Math.max(tickets.length, 1) * 100}%` }} /></div><b>{item.value}</b></div>)}{!categories.length && <p className="empty">Nenhum chamado neste período.</p>}</section><section className="panel"><div className="filters"><h2>Evolução dos chamados</h2><select value={period} onChange={e => setPeriod(e.target.value as Period)}><option value="week">Semanal</option><option value="month">Mensal</option></select></div><Evolution tickets={tickets} period={period} /></section></>
}

