import type { Data, Technician, Ticket } from '../domain.ts'
import { dateKey } from '../dateTime.ts'
import { profileSnapshot, reportComparisons, reportSummary, reportTrend, type KnowledgeContributionEvent, type ReportPeriod, type ReportScope } from './reportModel.ts'

type Photo = { data: string; width: number; height: number }
type Page = { draw: string[]; photo?: Photo }
const W = 595, H = 842
const blue = [0.19, 0.39, 0.63], ink = [0.12, 0.17, 0.23], muted = [0.42, 0.49, 0.57], line = [0.82, 0.86, 0.9]
const seriesColors = { opened: [0.27, 0.55, 0.86], completed: [0.22, 0.66, 0.44], contributions: [0.86, 0.62, 0.18] }
const rgb = (color: number[]) => color.map(value => value.toFixed(3)).join(' ')
const textBytes = (value: string) => [...value.replace(/[–—]/g, '-').replace(/[•·]/g, '-').replace(/✦/g, '*')].map(char => char.charCodeAt(0) <= 255 ? char : '?').join('')
const escape = (value: string) => textBytes(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/[\r\n]/g, ' ')
const truncate = (value: string, max: number) => value.length > max ? `${value.slice(0, Math.max(0, max - 3))}...` : value
const addText = (page: Page, value: string, x: number, top: number, size = 10, bold = false, color = ink) => page.draw.push(`${rgb(color)} rg BT /${bold ? 'F2' : 'F1'} ${size} Tf 1 0 0 1 ${x.toFixed(1)} ${(H - top).toFixed(1)} Tm (${escape(value)}) Tj ET`)
const rect = (page: Page, x: number, top: number, width: number, height: number, color: number[]) => page.draw.push(`${rgb(color)} rg ${x.toFixed(1)} ${(H - top - height).toFixed(1)} ${width.toFixed(1)} ${height.toFixed(1)} re f`)
const stroke = (page: Page, x: number, top: number, width: number, height: number, color = line) => page.draw.push(`${rgb(color)} RG 0.7 w ${x.toFixed(1)} ${(H - top - height).toFixed(1)} ${width.toFixed(1)} ${height.toFixed(1)} re S`)
const separator = (page: Page, top: number) => rect(page, 42, top, W - 84, 0.7, line)
const section = (page: Page, title: string, top: number) => { addText(page, title.toUpperCase(), 42, top, 9, true, blue); separator(page, top + 8) }
const dateLabel = (value?: string) => value ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : '-'
const timeLabel = (minutes: number) => `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}min`
const ticketLine = (ticket: Ticket, label: string) => `${ticket.id}  ${truncate(ticket.title, 53)}  -  ${label}`
const formatPeriod = (period: ReportPeriod) => period.from || period.to ? `${period.from || 'início'} a ${period.to || 'hoje'}` : 'todo o histórico'

function overviewPage(data: Data, people: Technician[], period: ReportPeriod, counts: Record<string, number>, now: Date): Page[] {
  const pages: Page[] = []
  const report = reportSummary(data, 'team', period, now)
  const first: Page = { draw: [] }
  pages.push(first)
  rect(first, 0, 0, W, 12, blue)
  addText(first, 'CENTRAL TI  /  LANOBRASIL', 42, 52, 10, true, blue)
  addText(first, 'Relatório da equipe', 42, 89, 26, true)
  addText(first, `Período de análise: ${formatPeriod(period)}  |  Gerado em ${dateLabel(now.toISOString())}`, 42, 111, 10, false, muted)
  section(first, 'Visão técnica', 151)
  const metrics = [
    ['Abertos no período', report.opened.length], ['Concluídos no período', report.completed.length],
    ['Ativos agora', report.activeTickets.length], ['Atrasados agora', report.overdueTickets.length],
    ['Trabalho efetivo', timeLabel(report.workMinutes)], ['Contribuições em chamados', report.contributions],
  ]
  metrics.forEach(([label, value], index) => { const col = index % 3, row = Math.floor(index / 3), x = 42 + col * 174, top = 174 + row * 74; rect(first, x, top, 162, 62, [0.94, 0.96, 0.98]); addText(first, String(value), x + 11, top + 27, 18, true); addText(first, String(label), x + 11, top + 47, 8, false, muted) })
  section(first, 'Situação dos chamados ativos', 338)
  report.statuses.forEach((item, index) => { const top = 358 + index * 26; addText(first, item.name, 42, top, 10); addText(first, String(item.count), 525, top, 10, true); rect(first, 263, top - 8, Math.max(0, 245 * item.count / Math.max(report.activeTickets.length, 1)), 7, index === 0 ? [0.53, 0.62, 0.71] : index === 1 ? [0.34, 0.59, 0.86] : [0.82, 0.62, 0.34]) })
  section(first, 'Categorias mais abertas no período', 460)
  report.categories.slice(0, 5).forEach((item, index) => { const top = 480 + index * 23; addText(first, truncate(item.name, 32), 42, top, 10); addText(first, String(item.count), 525, top, 10, true) })
  if (!report.categories.length) addText(first, 'Nenhum chamado aberto neste período.', 42, 485, 10, false, muted)
  section(first, 'Equipe e próximos perfis', 620)
  addText(first, `${people.length} perfis ativos incluídos nas páginas seguintes.`, 42, 641, 10, false, muted)
  const teamGuide = people.reduce((sum, person) => sum + (counts[person.id] ?? 0), 0)
  addText(first, `Contribuições aprovadas em guias (histórico): ${teamGuide}`, 42, 659, 10)
  const unit = period.from && period.to && (Date.parse(period.to) - Date.parse(period.from)) <= 90 * 86400000 ? 'week' : 'month'
  const trend = reportTrend(data, 'team', period, unit, now)
  section(first, unit === 'week' ? 'Últimas oito semanas' : 'Últimos oito meses', 697)
  trend.forEach((item, index) => { const x = 44 + index * 64; addText(first, item.label, x, 719, 8, false, muted); rect(first, x, 730, 7, Math.min(34, Math.max(2, item.abertos * 3)), [0.34, 0.59, 0.86]); rect(first, x + 12, 730, 7, Math.min(34, Math.max(2, item.concluídos * 3)), [0.32, 0.72, 0.52]); addText(first, `${item.abertos}/${item.concluídos}`, x, 776, 8) })
  return pages
}

function comparisonPage(data: Data, scope: ReportScope, period: ReportPeriod, events: KnowledgeContributionEvent[], now: Date): Page {
  const page: Page = { draw: [] }
  rect(page, 0, 0, W, 12, blue)
  addText(page, 'CENTRAL TI  /  EVOLUÇÃO TÉCNICA', 42, 50, 10, true, blue)
  addText(page, 'Comparativo de atividade', 42, 87, 25, true)
  addText(page, 'Semana: segunda a domingo  |  Mês: primeiro ao último dia  |  Atual até hoje', 42, 109, 9, false, muted)
  addText(page, `Filtro principal do relatório: ${formatPeriod(period)}. Comparações ancoradas em ${dateLabel(now.toISOString())}.`, 42, 126, 8, false, muted)
  const labels = [
    { key: 'opened', title: 'Chamados abertos', color: seriesColors.opened },
    { key: 'completed', title: 'Conclusões', color: seriesColors.completed },
    { key: 'contributions', title: 'Contribuições', color: seriesColors.contributions },
  ] as const
  reportComparisons(data, scope, events, now).forEach((comparison, index) => {
    const base = index === 0 ? 164 : 337
    section(page, `${comparison.label} anterior x ${comparison.label.toLowerCase()} atual`, base)
    addText(page, `${comparison.previous.from} a ${comparison.previous.to}`, 246, base + 24, 9, false, muted)
    addText(page, `${comparison.current.from} a ${comparison.current.to}`, 401, base + 24, 9, false, muted)
    addText(page, 'Indicador', 42, base + 24, 9, true, muted)
    labels.forEach((item, row) => {
      const top = base + 56 + row * 31
      rect(page, 42, top - 10, 7, 7, item.color)
      addText(page, item.title, 57, top, 10)
      addText(page, String(comparison.previousMetrics[item.key]), 265, top, 11, true)
      addText(page, String(comparison.currentMetrics[item.key]), 424, top, 11, true)
      if (row < 2) separator(page, top + 9)
    })
  })
  section(page, 'Evolução em ondas: últimas oito semanas', 514)
  addText(page, 'Cada ponto conta eventos na semana; inclui contribuições em chamados e guias aprovados.', 42, 534, 8, false, muted)
  const trend = reportTrend(data, scope, { from: '', to: '' }, 'week', now, events)
  const max = Math.max(1, ...trend.flatMap(item => [item.abertos, item.concluídos, item.contribuições]))
  const x = (index: number) => 53 + index * 69
  const y = (value: number) => 710 - value / max * 140
  for (let grid = 0; grid <= 4; grid++) rect(page, 53, 570 + grid * 35, 483, 0.5, line)
  const waves = [
    { key: 'abertos', color: seriesColors.opened },
    { key: 'concluídos', color: seriesColors.completed },
    { key: 'contribuições', color: seriesColors.contributions },
  ] as const
  waves.forEach(wave => {
    const points = trend.map((item, index) => ({ x: x(index), y: y(item[wave.key]) }))
    let path = `${points[0].x.toFixed(1)} ${(H - points[0].y).toFixed(1)} m `
    for (let index = 1; index < points.length; index++) {
      const previous = points[index - 1], current = points[index], middle = (previous.x + current.x) / 2
      path += `${middle.toFixed(1)} ${(H - previous.y).toFixed(1)} ${middle.toFixed(1)} ${(H - current.y).toFixed(1)} ${current.x.toFixed(1)} ${(H - current.y).toFixed(1)} c `
    }
    page.draw.push(`${rgb(wave.color)} RG 2.2 w ${path}S`)
    points.forEach(point => rect(page, point.x - 2, point.y - 2, 4, 4, wave.color))
  })
  trend.forEach((item, index) => addText(page, item.label, x(index) - 11, 733, 8, false, muted))
  labels.forEach((item, index) => { const left = 84 + index * 154; rect(page, left, 761, 12, 3, item.color); addText(page, item.title, left + 17, 766, 9, false, muted) })
  return page
}

function profilePage(data: Data, person: Technician, guideCount: number, period: ReportPeriod, now: Date, photo?: Photo): Page {
  const page: Page = { draw: [], photo }
  const profile = profileSnapshot(data, person.id, guideCount, now)
  rect(page, 0, 0, W, 12, blue)
  addText(page, 'CENTRAL TI  /  PERFIL TÉCNICO', 42, 48, 10, true, blue)
  if (photo) page.draw.push(`q 66 0 0 66 42 ${(H - 126).toFixed(1)} cm /Photo Do Q`)
  else { rect(page, 42, 60, 66, 66, [0.84, 0.9, 0.96]); addText(page, person.avatar, 59, 101, 19, true, blue) }
  addText(page, truncate(person.name, 42), 122, 80, 20, true)
  addText(page, truncate(person.role + (person.deleted ? '  -  perfil excluído' : ''), 65), 122, 102, 10, false, muted)
  addText(page, `Dados até ${dateLabel(now.toISOString())}`, 122, 119, 9, false, muted)
  section(page, 'Resumo do perfil', 153)
  const cards = [
    ['Chamados ativos', profile.activeOwned.length], ['Concluídos como responsável', profile.completed.length],
    ['Contribuições registradas', profile.contributed.length + guideCount], ['Trabalho efetivo - 7 dias', timeLabel(profile.workMinutes7)],
  ]
  cards.forEach(([label, value], index) => { const x = 42 + index * 131, top = 175; rect(page, x, top, 123, 67, [0.94, 0.96, 0.98]); addText(page, String(value), x + 8, top + 28, 17, true); addText(page, truncate(String(label), 24), x + 8, top + 48, 7.3, false, muted) })
  addText(page, `Contribuições: ${profile.contributed.length} em chamados + ${guideCount} em guias aprovados.`, 42, 261, 9, false, muted)
  section(page, 'Atividade recente', 288)
  profile.recent.forEach((ticket, index) => addText(page, ticketLine(ticket, `${ticket.ownerId === person.id ? 'Responsável' : 'Contribuição'} / ${dateLabel(ticket.completedAt ?? ticket.openedAt)}`), 42, 309 + index * 21, 9))
  if (!profile.recent.length) addText(page, 'Nenhuma atividade registrada.', 42, 310, 9, false, muted)
  section(page, 'Chamados em andamento', 415)
  profile.focus.forEach((ticket, index) => addText(page, ticketLine(ticket, ticket.ownerId === person.id ? 'Responsável' : 'Participante'), 42, 436 + index * 21, 9))
  if (!profile.focus.length) addText(page, 'Nenhum chamado em andamento.', 42, 437, 9, false, muted)
  section(page, 'Contribuições em chamados', 542)
  profile.contributed.slice(0, 3).forEach((ticket, index) => addText(page, ticketLine(ticket, dateLabel(ticket.completedAt)), 42, 563 + index * 21, 9))
  if (!profile.contributed.length) addText(page, 'Nenhuma contribuição concluída.', 42, 564, 9, false, muted)
  section(page, `Atividade no ano de ${profile.year}`, 653)
  addText(page, `${profile.days.reduce((sum, day) => sum + day.completed, 0)} conclusões  |  ${profile.days.reduce((sum, day) => sum + day.contributions, 0)} contribuições`, 42, 675, 9, false, muted)
  const daily = new Map(profile.days.map(day => [day.date, day]))
  const yearStart = new Date(Date.UTC(profile.year, 0, 1))
  const first = new Date(yearStart); first.setUTCDate(first.getUTCDate() - first.getUTCDay())
  for (let column = 0; column < 53; column++) for (let row = 0; row < 7; row++) {
    const current = new Date(first); current.setUTCDate(current.getUTCDate() + column * 7 + row)
    if (current.getUTCFullYear() !== profile.year) continue
    const item = daily.get(current.toISOString().slice(0, 10))
    const color = item?.completed && item?.contributions ? [0.48, 0.65, 0.4] : item?.completed ? [0.31, 0.72, 0.53] : item?.contributions ? [0.87, 0.7, 0.34] : [0.89, 0.92, 0.95]
    const x = 42 + column * 9.5, top = 691 + row * 9.5
    rect(page, x, top, 7, 7, color)
    if (item?.progress) stroke(page, x - 0.5, top - 0.5, 8, 8, blue)
  }
  addText(page, 'Verde: conclusão  |  Amarelo: contribuição  |  Contorno: progresso', 42, 774, 8, false, muted)
  const selected = reportSummary(data, person.id, period, now)
  addText(page, truncate(`No período (${formatPeriod(period)}): ${selected.opened.length} abertos, ${selected.completed.length} concluídos, ${selected.contributions} contribuições e ${timeLabel(selected.workMinutes)} de trabalho.`, 115), 42, 795, 8, false, muted)
  return page
}

function photoObject(photo: Photo) { return `<< /Type /XObject /Subtype /Image /Width ${photo.width} /Height ${photo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${photo.data.length} >>\nstream\n${photo.data}\nendstream` }
function serialize(pages: Page[]) {
  const objects: string[] = []
  const add = (value: string) => { objects.push(value); return objects.length }
  const regular = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  const bold = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')
  const pagesId = add('')
  const pageIds = pages.map((page, index) => {
    addText(page, `Central TI  |  ${index + 1} / ${pages.length}`, 42, 811, 8, false, muted)
    const photoId = page.photo ? add(photoObject(page.photo)) : 0
    const content = page.draw.join('\n') + '\n'
    const contentId = add(`<< /Length ${content.length} >>\nstream\n${content}endstream`)
    return add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${regular} 0 R /F2 ${bold} 0 R >> ${photoId ? `/XObject << /Photo ${photoId} 0 R >>` : ''} >> /Contents ${contentId} 0 R >>`)
  })
  objects[pagesId - 1] = `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] >>`
  const catalog = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`)
  let binary = '%PDF-1.4\n%âãÏÓ\n'
  const offsets = [0]
  objects.forEach((object, index) => { offsets.push(binary.length); binary += `${index + 1} 0 obj\n${object}\nendobj\n` })
  const xref = binary.length
  binary += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach(offset => { binary += `${String(offset).padStart(10, '0')} 00000 n \n` })
  binary += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`
  return Uint8Array.from(binary, char => char.charCodeAt(0) & 255)
}

export function buildReportPdf(data: Data, scope: ReportScope, period: ReportPeriod, guideCounts: Record<string, number>, now = new Date(), photos: Record<string, Photo> = {}, events: KnowledgeContributionEvent[] = []) {
  const people = scope === 'team' ? data.technicians.filter(person => !person.archived && !person.deleted) : data.technicians.filter(person => person.id === scope)
  const pages = scope === 'team' ? overviewPage(data, people, period, guideCounts, now) : []
  if (scope === 'team' || people.length) pages.push(comparisonPage(data, scope, period, events, now))
  for (const person of people) pages.push(profilePage(data, person, guideCounts[person.id] ?? 0, period, now, photos[person.id]))
  if (!pages.length) throw new Error('Selecione um técnico para exportar.')
  return serialize(pages)
}

async function jpegPhoto(person: Technician): Promise<Photo | undefined> {
  if (!person.photoDataUrl || typeof document === 'undefined') return undefined
  try {
    const image = new Image()
    image.src = person.photoDataUrl
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = 128; canvas.height = 128
    const context = canvas.getContext('2d')
    if (!context) return undefined
    context.fillStyle = '#ffffff'; context.fillRect(0, 0, 128, 128)
    const scale = Math.max(128 / image.naturalWidth, 128 / image.naturalHeight)
    context.drawImage(image, (128 - image.naturalWidth * scale) / 2, (128 - image.naturalHeight * scale) / 2, image.naturalWidth * scale, image.naturalHeight * scale)
    return { data: atob(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]), width: 128, height: 128 }
  } catch { return undefined }
}

export async function downloadReportPdf(data: Data, scope: ReportScope, period: ReportPeriod, guideCounts: Record<string, number>, events: KnowledgeContributionEvent[] = []) {
  const people = scope === 'team' ? data.technicians.filter(person => !person.archived && !person.deleted) : data.technicians.filter(person => person.id === scope)
  const photos: Record<string, Photo> = {}
  const prepared = await Promise.all(people.map(person => jpegPhoto(person)))
  people.forEach((person, index) => { if (prepared[index]) photos[person.id] = prepared[index] })
  const bytes = buildReportPdf(data, scope, period, guideCounts, new Date(), photos, events)
  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `central-ti-relatorio-${scope === 'team' ? 'equipe' : scope}-${dateKey(new Date())}.pdf`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 60000)
}
