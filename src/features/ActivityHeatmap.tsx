import type { ActivityHeatmapDay } from '../domain'
import './ActivityHeatmap.css'

type Props = { days: ActivityHeatmapDay[]; year: number; onYear: (year: number) => void }
const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export function ActivityHeatmap({ days, year, onYear }: Props) {
  const start = new Date(Date.UTC(year, 0, 1))
  const end = new Date(Date.UTC(year + 1, 0, 1))
  const first = new Date(start)
  first.setUTCDate(first.getUTCDate() - first.getUTCDay())
  const weeks: { date: string; inYear: boolean }[][] = []
  for (let week = new Date(first); week < end; week.setUTCDate(week.getUTCDate() + 7)) {
    weeks.push(Array.from({ length: 7 }, (_, day) => { const current = new Date(week); current.setUTCDate(current.getUTCDate() + day); return { date: current.toISOString().slice(0, 10), inYear: current >= start && current < end } }))
  }
  const byDate = new Map(days.map(day => [day.date, day]))
  const monthPositions = months.map((name, month) => ({ name, column: Math.floor((Date.UTC(year, month, 1) - first.getTime()) / (7 * 86400000)) + 1 }))
  return <section className="panel heat-panel" aria-label={`Atividade de ${year}`}><div className="heat-head"><h2>Atividade no ano</h2><div><button type="button" onClick={() => onYear(year - 1)} aria-label="Ano anterior">‹</button><strong>{year}</strong><button type="button" onClick={() => onYear(year + 1)} aria-label="Próximo ano">›</button></div></div><div className="heat-scroll"><div className="heat-months" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(11px, 1fr))` }}>{monthPositions.map(month => <span key={month.name} style={{ gridColumn: month.column }}>{month.name}</span>)}</div><div className="heat-calendar"><div className="heat-weekdays"><span>dom</span><span>seg</span><span>ter</span><span>qua</span><span>qui</span><span>sex</span><span>sáb</span></div><div className="heat-grid">{weeks.map((week, index) => <div className="heat-week" key={index}>{week.map(({ date, inYear }) => { const data = byDate.get(date); const completed = data?.completed ?? 0; const contributions = data?.contributions ?? 0; const progress = data?.progress ?? 0; const kind = !inYear ? 'outside' : completed && contributions ? 'mixed' : completed ? 'completed' : contributions ? 'contribution' : 'none'; return <button type="button" key={date} className={`heat-cell ${kind} level-${Math.min(completed, 4)} ${progress ? 'progress' : ''}`} disabled={!inYear} aria-label={inYear ? `${date}: ${completed} conclusões, ${contributions} contribuições, ${progress} atualizações de progresso` : undefined} title={inYear ? `${date} · ${completed} conclusões · ${contributions} contribuições · ${progress} progressos` : undefined} /> })}</div>)}</div></div></div><p className="legend"><span className="legend-neutral">■ Sem registro</span><span className="green-text">■ Conclusão</span><span className="yellow-text">■ Contribuição</span><span className="legend-progress">◻ Progresso documentado</span></p></section>
}
