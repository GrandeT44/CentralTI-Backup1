import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Ticket } from '../domain'
import { dateKey } from '../dateTime'
export type Period = 'week' | 'month'
function evolution(tickets: Ticket[], period: Period, count = 8, now = new Date()) {
  const anchor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  if (period === 'week') anchor.setUTCDate(anchor.getUTCDate() - ((anchor.getUTCDay() + 6) % 7))
  else anchor.setUTCDate(1)
  return Array.from({ length: count }, (_, i) => {
    const start = new Date(anchor)
    if (period === 'week') start.setUTCDate(start.getUTCDate() - (count - 1 - i) * 7)
    else start.setUTCMonth(start.getUTCMonth() - (count - 1 - i))
    const end = new Date(start)
    if (period === 'week') end.setUTCDate(end.getUTCDate() + 7)
    else end.setUTCMonth(end.getUTCMonth() + 1)
    const a = start.toISOString().slice(0, 10), b = end.toISOString().slice(0, 10)
    return { name: period === 'week' ? `${start.getUTCDate()}/${start.getUTCMonth() + 1}` : `${start.getUTCMonth() + 1}/${start.getUTCFullYear()}`, abertos: tickets.filter(t => dateKey(t.openedAt) >= a && dateKey(t.openedAt) < b).length, concluídos: tickets.filter(t => t.status === 'Concluído' && t.completedAt && dateKey(t.completedAt) >= a && dateKey(t.completedAt) < b).length }
  })
}
export function Evolution({ tickets, period }: { tickets: Ticket[]; period: Period }) {
  const rows = evolution(tickets, period)
  return <div className="chart" role="img" aria-label={`Evolução ${period === 'week' ? 'semanal' : 'mensal'} de chamados abertos e concluídos`}><ResponsiveContainer width="100%" height="100%"><BarChart data={rows}><CartesianGrid stroke="#354254" vertical={false} /><XAxis dataKey="name" stroke="#a6b4c3" /><YAxis allowDecimals={false} stroke="#a6b4c3" /><Tooltip contentStyle={{ background: '#1b2430', border: '1px solid #405065' }} /><Legend /><Bar dataKey="abertos" fill="#6098ec" radius={[3, 3, 0, 0]} /><Bar dataKey="concluídos" fill="#47b985" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div>
}


