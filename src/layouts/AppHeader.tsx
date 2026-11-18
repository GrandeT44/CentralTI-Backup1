import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Activity, BookOpen, CalendarDays, ChartNoAxesCombined, ChevronDown, ClipboardList, LayoutDashboard, LogOut, Menu, Plus, UserRound, X } from 'lucide-react'
import type { Technician } from '../domain'
import { TechnicianAvatar } from '../components/TechnicianAvatar'
import { CreateTicketButton } from '../features/TicketCreation'

type Props = { technicians: Technician[]; active: string; switchProfile: (id: string) => void }
const navigation = [
  { to: '/', label: 'Início', icon: LayoutDashboard },
  { to: '/chamados', label: 'Chamados', icon: ClipboardList },
  { to: '/planejamento', label: 'Planejamento', icon: CalendarDays },
  { to: '/conhecimento', label: 'Conhecimento', icon: BookOpen },
  { to: '/relatorios', label: 'Relatórios', icon: ChartNoAxesCombined },
  { to: '/perfil', label: 'Perfil', icon: UserRound },
]
export function AppHeader({ technicians, active, switchProfile }: Props) {
  const [open, setOpen] = useState(false)
  const technician = technicians.find(item => item.id === active)
  const available = technicians.filter(person => !person.archived)
  return <><header className="app-header"><div className="header-inner"><Link to="/" className="app-brand" aria-label="Central TI, início"><span className="brand-symbol"><Activity size={20} strokeWidth={2.4} /></span><span><strong>central<span className="brand-accent">ti</span></strong><small>LANOBRASIL</small></span></Link><nav className="header-nav" aria-label="Navegação principal">{navigation.map(({ to, label }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => isActive ? 'header-link active' : 'header-link'}>{label}</NavLink>)}</nav><div className="header-actions"><span className="demo-pill" title="Perfis e notas salvos no servidor local">● <span>Banco local</span></span><CreateTicketButton className="button primary header-create"><Plus size={15} /> Novo chamado</CreateTicketButton><label className="technician-switch"><TechnicianAvatar technician={technician} className="mini-avatar" /><span className="switch-name">{technician?.name}</span><ChevronDown size={15} /><select aria-label="Trocar de perfil; requer senha" value={active} onChange={event => switchProfile(event.target.value)}>{available.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button type="button" className="header-logout" title="Sair do perfil" aria-label="Sair do perfil" onClick={() => switchProfile(active)}><LogOut size={17} /></button><button className="header-menu-button" type="button" aria-expanded={open} aria-label={open ? 'Fechar menu' : 'Abrir menu'} onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button></div></div></header>{open && <nav className="mobile-nav" aria-label="Navegação móvel">{navigation.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'mobile-link active' : 'mobile-link'}><Icon size={19} />{label}</NavLink>)}<CreateTicketButton className="button primary mobile-create" onClick={() => setOpen(false)}><Plus size={17} /> Novo atendimento</CreateTicketButton><button type="button" className="button" onClick={() => switchProfile(active)}>Sair do perfil</button></nav>}</>
}
