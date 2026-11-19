import test from 'node:test'
import assert from 'node:assert/strict'
import { reportSummary, profileSnapshot, reportTrend, reportComparisons } from '../src/features/reportModel.ts'
import { buildReportPdf } from '../src/features/reportPdf.ts'

const technicians = [
  { id: 'ana', name: 'Ana Martins', role: 'Infraestrutura', avatar: 'AM' },
  { id: 'bruno', name: 'Bruno Costa', role: 'Suporte', avatar: 'BC' },
]
const tickets = [
  { id: 'TI-1', type: 'long', title: 'Rede do financeiro', description: '', createdById: 'ana', ownerId: 'ana', participants: [{ technicianId: 'bruno', worked: true }], category: 'Rede', priority: 'Alta', status: 'Concluído', openedAt: '2026-11-10T12:00:00Z', completedAt: '2026-11-19T12:00:00Z', progress: [] },
  { id: 'TI-2', type: 'long', title: 'Impressora sem resposta', description: '', createdById: 'ana', ownerId: 'ana', participants: [], category: 'Periféricos', priority: 'Média', status: 'Aberto', openedAt: '2026-11-19T12:00:00Z', dueAt: '2026-11-19T13:00:00Z', progress: [] },
]
const sessions = [
  { id: 's1', technicianId: 'ana', ticketId: 'TI-1', start: '2026-11-19T02:30:00Z', end: '2026-11-19T04:30:00Z' },
  { id: 's2', technicianId: 'ana', ticketId: 'TI-1', start: '2026-11-19T03:00:00Z', end: '2026-11-19T04:00:00Z' },
  { id: 's3', technicianId: 'bruno', ticketId: 'TI-1', start: '2026-11-19T03:00:00Z', end: '2026-11-19T04:00:00Z' },
]
const data = { technicians, tickets, sessions, plans: [], articles: [] }
const period = { from: '2026-11-19', to: '2026-11-19' }
const now = new Date('2026-11-19T15:00:00Z')

test('relatório separa abertura, conclusão e pendência; corta trabalho no fuso e não soma sobreposição', () => {
  const team = reportSummary(data, 'team', period, now)
  assert.equal(team.opened.length, 1)
  assert.equal(team.completed.length, 1)
  assert.equal(team.activeTickets.length, 1)
  assert.equal(team.overdueTickets.length, 1)
  assert.equal(team.contributions, 1)
  assert.equal(team.workMinutes, 150)
  assert.deepEqual(team.categories, [{ name: 'Periféricos', count: 1 }])
  assert.equal(reportSummary(data, 'ana', period, now).workMinutes, 90)
  assert.equal(reportSummary(data, 'bruno', period, now).contributions, 1)
  assert.equal(profileSnapshot(data, 'bruno', 2, now).contributed.length, 1)
  assert.equal(reportTrend(data, 'team', period, 'week', now).at(-1).concluídos, 1)
})

test('chamado transferido mantém a abertura com o criador e a pendência com o responsável atual', () => {
  const transferred = { ...tickets[1], ownerId: 'bruno' }
  const sample = { ...data, tickets: [tickets[0], transferred] }
  assert.equal(reportSummary(sample, 'ana', period, now).opened.length, 1)
  assert.equal(reportSummary(sample, 'ana', period, now).activeTickets.length, 0)
  assert.equal(reportSummary(sample, 'bruno', period, now).activeTickets.length, 1)
})

test('compara semana e mês no fuso de São Paulo e inclui guias aprovados na data da aprovação', () => {
  const events = [{ technicianId: 'bruno', at: '2026-11-19T02:30:00Z' }, { technicianId: 'bruno', at: '2026-11-19T03:30:00Z' }, { technicianId: 'ana', at: '2026-10-20T12:00:00Z' }]
  const [week, month] = reportComparisons(data, 'team', events, now)
  assert.deepEqual(week.current, { from: '2026-11-16', to: '2026-11-19' })
  assert.deepEqual(week.previous, { from: '2026-11-09', to: '2026-11-15' })
  assert.deepEqual(week.currentMetrics, { opened: 1, completed: 1, contributions: 3 })
  assert.equal(week.previousMetrics.opened, 1)
  assert.deepEqual(month.previous, { from: '2026-10-01', to: '2026-10-31' })
  assert.equal(month.previousMetrics.contributions, 1)
  assert.equal(reportComparisons(data, 'bruno', events, now)[0].currentMetrics.contributions, 3)
  assert.equal(reportTrend(data, 'team', { from: '', to: '' }, 'week', now, events).at(-1).contribuições, 3)
})

test('comparações atravessam dezembro e janeiro sem deslocar a semana', () => {
  const [week, month] = reportComparisons(data, 'team', [], new Date('2027-01-01T15:00:00Z'))
  assert.deepEqual(week.current, { from: '2026-12-28', to: '2027-01-01' })
  assert.deepEqual(week.previous, { from: '2026-12-21', to: '2026-12-27' })
  assert.deepEqual(month.previous, { from: '2026-12-01', to: '2026-12-31' })
})

test('PDF da equipe contém visão global e uma página por perfil; PDF individual não tem campos de formulário', () => {
  const team = Buffer.from(buildReportPdf(data, 'team', period, { bruno: 2 }, now)).toString('latin1')
  const personal = Buffer.from(buildReportPdf(data, 'ana', period, {}, now)).toString('latin1')
  assert.ok(team.startsWith('%PDF-1.4'))
  assert.match(team, /\/Type \/Pages \/Count 4/)
  assert.match(team, /Relat.rio da equipe/)
  assert.match(team, /Ana Martins/)
  assert.match(team, /Bruno Costa/)
  assert.match(personal, /\/Type \/Pages \/Count 2/)
  assert.match(team, /Comparativo de atividade/)
  assert.match(team, /Evolu..o em ondas/i)
  assert.match(team, / c /)
  assert.doesNotMatch(team, /\/AcroForm|\/Annots/)
  const offset = Number(team.match(/startxref\n(\d+)/)?.[1])
  assert.equal(team.slice(offset, offset + 4), 'xref')
})
