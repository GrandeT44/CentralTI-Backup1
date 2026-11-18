import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Clock3, FolderKanban, Layers3, Users } from 'lucide-react'
import type { Data, Ticket } from '../domain'
import { ActivityHeatmap } from '../features/ActivityHeatmap'
import { ContributionBadge } from '../components/ContributionBadge'
import { contributionIds, heatmapDays, unionMinutes } from '../metrics'
import { TechnicianAvatar } from '../components/TechnicianAvatar'
import { CreateTicketButton } from '../features/TicketCreation'
import { prepareProfilePhoto } from '../features/profilePhoto'
import { AdminProfiles } from '../features/AdminProfiles'
import { isAdministrator } from '../features/administrator'
import './Profile.css'

type Props = { data: Data; save: (data: Data) => void; active: string }
const activeTicket = (ticket: Ticket) => !['Concluído', 'Cancelado'].includes(ticket.status)
const recentDate = (value: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'short' }).format(new Date(value))

export function Profile({ data, save, active }: Props) {
  const technician = data.technicians.find(item => item.id === active)
  const [year, setYear] = useState(() => Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', year: 'numeric' }).format(new Date())))
  const [reference] = useState(() => new Date())
  const [photoMessage, setPhotoMessage] = useState('')
  if (!technician) return <div className="panel empty">Técnico não encontrado.</div>
  const uploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; try { const photoDataUrl = await prepareProfilePhoto(file); save({ ...data, technicians: data.technicians.map(item => item.id === active ? { ...item, photoDataUrl } : item) }); setPhotoMessage('Foto atualizada neste navegador.') } catch (error) { setPhotoMessage(error instanceof Error ? error.message : 'Não foi possível carregar a foto.') } finally { event.target.value = '' } }
  const owned = data.tickets.filter(ticket => ticket.ownerId === active)
  const activeOwned = owned.filter(activeTicket)
  const completed = owned.filter(ticket => ticket.status === 'Concluído').sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
  const contributed = data.tickets.filter(ticket => ticket.status === 'Concluído' && contributionIds(ticket).includes(active)).sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
  const sharedActive = data.tickets.filter(ticket => ticket.ownerId !== active && activeTicket(ticket) && ticket.participants.some(item => item.technicianId === active))
  const recent = [...data.tickets.filter(ticket => ticket.ownerId === active || contributionIds(ticket).includes(active))].sort((a, b) => (b.completedAt ?? b.openedAt).localeCompare(a.completedAt ?? a.openedAt)).slice(0, 4)
  const recentSessions = data.sessions.filter(session => session.technicianId === active && new Date(session.start).getTime() >= reference.getTime() - 7 * 86400000)
  const days = heatmapDays(data, active)
  const yearCompleted = days.filter(day => day.date.startsWith(String(year))).reduce((total, day) => total + day.completed, 0)
  const yearContributions = days.filter(day => day.date.startsWith(String(year))).reduce((total, day) => total + day.contributions, 0)
  return <div className="profile-page">
    <div className="profile-breadcrumb">EQUIPE <span>/</span> PERFIL PESSOAL</div>
    <section className="profile-hero"><div className="profile-identity"><div className="profile-photo-control"><TechnicianAvatar technician={technician} className="profile-avatar"/><label className="profile-photo-edit" title="Alterar minha foto">✎<input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Carregar minha foto de perfil" onChange={uploadPhoto}/></label></div><div><span className="profile-availability"><span /> Técnico ativo · Ambiente de demonstração</span><h1>{technician.name}</h1><p>{technician.role}</p><span className="profile-summary">Acompanhe seus chamados, contribuições e atividades em um só lugar.</span></div></div><CreateTicketButton className="button profile-action"><FolderKanban size={16} /> Novo chamado <ArrowRight size={15} /></CreateTicketButton></section>
    {photoMessage&&<p className="profile-photo-message" role="status">{photoMessage}</p>}<div className="profile-overview"><div className="profile-metric"><span className="metric-icon blue"><Layers3 size={18} /></span><strong>{activeOwned.length}</strong><span>Chamados ativos</span></div><div className="profile-metric"><span className="metric-icon green"><CheckCircle2 size={18} /></span><strong>{completed.length}</strong><span>Concluídos como responsável</span></div><div className="profile-metric emphasized"><span className="metric-icon yellow"><Users size={18} /></span><strong>{contributed.length}</strong><span>Contribuições registradas</span></div><div className="profile-metric"><span className="metric-icon neutral"><Clock3 size={18} /></span><strong>{Math.floor(unionMinutes(recentSessions) / 60)}h {String(unionMinutes(recentSessions) % 60).padStart(2, '0')}m</strong><span>Trabalho efetivo · 7 dias</span></div></div>
    <div className="profile-context-grid"><section className="profile-surface recent-surface"><div className="profile-section-heading"><div><span className="section-kicker">HISTÓRICO</span><h2>Atividade recente</h2></div><Link to="/chamados" className="text-link">Ver chamados <ArrowRight size={15} /></Link></div>{recent.length ? recent.map(ticket => <Link to={`/chamados/${ticket.id}`} className="profile-activity" key={ticket.id}><span className={`activity-indicator ${ticket.status === 'Concluído' ? 'done' : 'active'}`} /><span><strong>{ticket.title}</strong><small>{ticket.ownerId === active ? ticket.status === 'Concluído' ? 'Concluído por você' : 'Sob sua responsabilidade' : 'Sua contribuição'} · {recentDate(ticket.completedAt ?? ticket.openedAt)}</small></span>{ticket.ownerId !== active && <ContributionBadge count={1} compact />}</Link>) : <div className="profile-empty"><strong>Sua atividade aparecerá aqui</strong><p>Crie ou participe de um chamado para começar.</p></div>}</section>
      <section className="profile-surface current-surface"><div className="profile-section-heading"><div><span className="section-kicker">EM FOCO</span><h2>Chamados em andamento</h2></div><span className="profile-count">{activeOwned.length + sharedActive.length}</span></div>{[...activeOwned, ...sharedActive].slice(0, 4).map(ticket => <Link className="profile-current-ticket" to={`/chamados/${ticket.id}`} key={ticket.id}><span className="current-ticket-icon"><FolderKanban size={17} /></span><span><strong>{ticket.title}</strong><small>{ticket.id} · {ticket.ownerId === active ? 'Responsável' : 'Participante'} · {ticket.status}</small></span><ArrowRight size={15} /></Link>)}{!activeOwned.length && !sharedActive.length && <div className="profile-empty"><strong>Nada em andamento</strong><p>Seus chamados ativos aparecerão nesta seção.</p></div>}</section>
      <section className="profile-surface contributions-surface"><div className="profile-section-heading"><div><span className="section-kicker">COLABORAÇÃO</span><h2>Contribuições</h2></div><ContributionBadge count={contributed.length} compact /></div><p>Tempo, atualizações de trabalho e etapas executadas em chamados de outros técnicos.</p>{contributed.slice(0, 3).map(ticket => <Link to={`/chamados/${ticket.id}`} className="contributed-ticket" key={ticket.id}><span className="contribution-spark">✦</span><span><strong>{ticket.title}</strong><small>{ticket.id} · {recentDate(ticket.completedAt ?? ticket.openedAt)}</small></span><ArrowRight size={15} /></Link>)}{!contributed.length && <div className="profile-empty small"><strong>Sem contribuições concluídas</strong><p>Trabalho registrado, atualizações confirmadas ou etapas executadas aparecerão aqui após a conclusão.</p></div>}</section></div>
    <div className="profile-heatmap"><div className="profile-heatmap-intro"><div><span className="section-kicker">CONSTÂNCIA, NÃO COMPETIÇÃO</span><h2>Seu ano em atividade</h2><p>Conclusões, contribuições e progresso documentado ao longo do calendário.</p></div><div className="heatmap-summary"><span><b>{yearCompleted}</b> conclusões</span><span className="yellow"><b>{yearContributions}</b> contribuições</span></div></div><ActivityHeatmap days={days} year={year} onYear={setYear} /></div>
    {isAdministrator(active) && <AdminProfiles data={data} save={save} />}
  </div>
}

