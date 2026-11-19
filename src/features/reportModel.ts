import type { Data, Ticket, WorkSession } from '../domain.ts'
import { dateKey, fromSaoPaulo } from '../dateTime.ts'
import { contributionIds, heatmapDays, overdue, unionMinutes } from '../metrics.ts'

export type ReportPeriod = { from: string; to: string }
export type ReportScope = 'team' | string
export type ReportTrendUnit = 'week' | 'month'
export type KnowledgeContributionEvent = { technicianId: string; at: string }
const active = (ticket: Ticket) => !['Concluído', 'Cancelado'].includes(ticket.status)
const inPeriod = (date: string | undefined, period: ReportPeriod) => !!date && (!period.from || dateKey(date) >= period.from) && (!period.to || dateKey(date) <= period.to)
const involved = (ticket: Ticket, id: string) => (ticket.createdById ?? ticket.ownerId) === id || ticket.ownerId === id || ticket.participants.some(item => item.technicianId === id) || contributionIds(ticket).includes(id)
const nextDay = (key: string) => { const date = new Date(`${key}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + 1); return date.toISOString().slice(0, 10) }
const shiftDay = (key: string, days: number) => { const date = new Date(`${key}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10) }
const contributionCount = (events: KnowledgeContributionEvent[], scope: ReportScope, period: ReportPeriod) => events.filter(event => (scope === 'team' || event.technicianId === scope) && inPeriod(event.at, period)).length

function workMinutes(sessions: WorkSession[], period: ReportPeriod) {
  const lower = period.from ? Date.parse(fromSaoPaulo(`${period.from}T00:00`)) : -Infinity
  const upper = period.to ? Date.parse(fromSaoPaulo(`${nextDay(period.to)}T00:00`)) : Infinity
  const byTechnician = new Map<string, WorkSession[]>()
  for (const session of sessions) {
    const start = Math.max(Date.parse(session.start), lower), end = Math.min(Date.parse(session.end), upper)
    if (!Number.isFinite(start) || !Number.isFinite(end) || !(end > start)) continue
    const records = byTechnician.get(session.technicianId) ?? []
    records.push({ ...session, start: new Date(start).toISOString(), end: new Date(end).toISOString() })
    byTechnician.set(session.technicianId, records)
  }
  return [...byTechnician.values()].reduce((sum, records) => sum + unionMinutes(records), 0)
}

export function reportSummary(data: Data, scope: ReportScope, period: ReportPeriod, now = new Date()) {
  const selected = scope === 'team' ? data.tickets : data.tickets.filter(ticket => involved(ticket, scope))
  const opened = selected.filter(ticket => inPeriod(ticket.openedAt, period) && (scope === 'team' || (ticket.createdById ?? ticket.ownerId) === scope))
  const completed = selected.filter(ticket => ticket.status === 'Concluído' && inPeriod(ticket.completedAt, period) && (scope === 'team' || ticket.ownerId === scope))
  const activeTickets = selected.filter(ticket => active(ticket) && (scope === 'team' || ticket.ownerId === scope || ticket.participants.some(item => item.technicianId === scope)))
  const contributions = selected.filter(ticket => ticket.status === 'Concluído' && inPeriod(ticket.completedAt, period)).reduce((sum, ticket) => sum + (scope === 'team' ? contributionIds(ticket).length : Number(contributionIds(ticket).includes(scope))), 0)
  const sessions = scope === 'team' ? data.sessions : data.sessions.filter(item => item.technicianId === scope)
  const categories = [...new Set(opened.map(ticket => ticket.category))].map(name => ({ name, count: opened.filter(ticket => ticket.category === name).length })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR'))
  const statuses = (['Aberto', 'Em andamento', 'Aguardando terceiros'] as const).map(name => ({ name, count: activeTickets.filter(ticket => ticket.status === name).length }))
  const overdueTickets = activeTickets.filter(ticket => overdue(ticket, now)).sort((a, b) => (a.dueAt ?? '').localeCompare(b.dueAt ?? ''))
  return { opened, completed, activeTickets, overdueTickets, contributions, workMinutes: workMinutes(sessions, period), categories, statuses, selected }
}

export function profileSnapshot(data: Data, id: string, guideContributions: number, now = new Date()) {
  const owned = data.tickets.filter(ticket => ticket.ownerId === id)
  const contributed = data.tickets.filter(ticket => ticket.status === 'Concluído' && contributionIds(ticket).includes(id)).sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
  const activeOwned = owned.filter(active)
  const sharedActive = data.tickets.filter(ticket => ticket.ownerId !== id && active(ticket) && ticket.participants.some(item => item.technicianId === id))
  const recent = data.tickets.filter(ticket => ticket.ownerId === id || contributionIds(ticket).includes(id)).sort((a, b) => (b.completedAt ?? b.openedAt).localeCompare(a.completedAt ?? a.openedAt)).slice(0, 4)
  const recentSessions = data.sessions.filter(session => session.technicianId === id && Date.parse(session.start) >= now.getTime() - 7 * 86400000)
  const year = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', year: 'numeric' }).format(now))
  const days = heatmapDays(data, id).filter(day => day.date.startsWith(String(year)))
  return { activeOwned, completed: owned.filter(ticket => ticket.status === 'Concluído'), contributed, guideContributions, recent, focus: [...activeOwned, ...sharedActive].slice(0, 4), workMinutes7: unionMinutes(recentSessions), days, year }
}

export function reportComparisons(data: Data, scope: ReportScope, events: KnowledgeContributionEvent[] = [], now = new Date()) {
  const today = dateKey(now)
  const weekday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7
  const weekStart = shiftDay(today, -weekday)
  const monthStart = `${today.slice(0, 7)}-01`
  const previousMonthStart = `${shiftDay(monthStart, -1).slice(0, 7)}-01`
  const periods = [
    { label: 'Semana', current: { from: weekStart, to: today }, previous: { from: shiftDay(weekStart, -7), to: shiftDay(weekStart, -1) } },
    { label: 'Mês', current: { from: monthStart, to: today }, previous: { from: previousMonthStart, to: shiftDay(monthStart, -1) } },
  ]
  return periods.map(item => {
    const metrics = (period: ReportPeriod) => { const summary = reportSummary(data, scope, period, now); return { opened: summary.opened.length, completed: summary.completed.length, contributions: summary.contributions + contributionCount(events, scope, period) } }
    return { ...item, currentMetrics: metrics(item.current), previousMetrics: metrics(item.previous) }
  })
}

export function reportTrend(data: Data, scope: ReportScope, period: ReportPeriod, unit: ReportTrendUnit, now = new Date(), events: KnowledgeContributionEvent[] = []) {
  const endKey = period.to || dateKey(now)
  const anchor = new Date(`${endKey}T00:00:00Z`)
  if (unit === 'week') anchor.setUTCDate(anchor.getUTCDate() - ((anchor.getUTCDay() + 6) % 7))
  else anchor.setUTCDate(1)
  return Array.from({ length: 8 }, (_, index) => {
    const start = new Date(anchor)
    if (unit === 'week') start.setUTCDate(start.getUTCDate() - (7 - index) * 7)
    else start.setUTCMonth(start.getUTCMonth() - (7 - index))
    const end = new Date(start)
    if (unit === 'week') end.setUTCDate(end.getUTCDate() + 7)
    else end.setUTCMonth(end.getUTCMonth() + 1)
    const first = start.toISOString().slice(0, 10), last = end.toISOString().slice(0, 10)
    const within = (value: string | undefined) => inPeriod(value, period) && !!value && dateKey(value) >= first && dateKey(value) < last
    const ticketContributions = data.tickets.filter(ticket => ticket.status === 'Concluído' && within(ticket.completedAt)).reduce((sum, ticket) => sum + (scope === 'team' ? contributionIds(ticket).length : Number(contributionIds(ticket).includes(scope))), 0)
    return { label: unit === 'week' ? `${start.getUTCDate()}/${start.getUTCMonth() + 1}` : `${start.getUTCMonth() + 1}/${start.getUTCFullYear()}`, abertos: data.tickets.filter(ticket => within(ticket.openedAt) && (scope === 'team' || (ticket.createdById ?? ticket.ownerId) === scope)).length, concluídos: data.tickets.filter(ticket => ticket.status === 'Concluído' && within(ticket.completedAt) && (scope === 'team' || ticket.ownerId === scope)).length, contribuições: ticketContributions + events.filter(event => within(event.at) && (scope === 'team' || event.technicianId === scope)).length }
  })
}
