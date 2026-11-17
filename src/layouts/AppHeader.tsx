import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Activity, BookOpen, CalendarDays, ChartNoAxesCombined, ChevronDown, ClipboardList, LayoutDashboard, Menu, Plus, UserRound, X } from 'lucide-react'
import type { Technician } from '../domain'
import { TechnicianAvatar } from '../components/TechnicianAvatar'

type Props = { technicians: Technician[]; active: string; setActive: (id: string) => void }
const navigation = [
  { to: '/', label: 'Início', icon: LayoutDashboard },
  { to: '/chamados', label: 'Chamados', icon: ClipboardList },
  { to: '/planejamento', label: 'Planejamento', icon: CalendarDays },
  { to: '/conhecimento', label: 'Conhecimento', icon: BookOpen },
  { to: '/relatorios', label: 'Relatórios', icon: ChartNoAxesCombined },
  { to: '/perfil', label: 'Perfil', icon: UserRound },
]

export function AppHeader({ technicians, active, setActive }: Props) {
  const [open, setOpen] = useState(false)
  const technician = technicians.find(item => item.id === active)
  return <>
    <header className="app-header">
      <div className="header-inner">
        <Link to="/" className="app-brand" aria-label="Central TI, início"><span className="brand-symbol"><Activity size={20} strokeWidth={2.4} /></span><span><strong>central<span className="brand-accent">ti</span></strong><small>LANOBRASIL</small></span></Link>
        <nav className="header-nav" aria-label="Navegação principal">{navigation.map(({ to, label }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => isActive ? 'header-link active' : 'header-link'}>{label}</NavLink>)}</nav>
        <div className="header-actions"><span className="demo-pill" title="Dados apenas neste navegador">● <span>Demo local</span></span><label className="technician-switch"><TechnicianAvatar technician={technician} className="mini-avatar" /><span className="switch-name">{technician?.name}</span><ChevronDown size={15} /><select aria-label="Técnico ativo para demonstração" value={active} onChange={event => setActive(event.target.value)}>{technicians.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button className="header-menu-button" type="button" aria-expanded={open} aria-label={open ? 'Fechar menu' : 'Abrir menu'} onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button></div>
      </div>
    </header>
    {open && <nav className="mobile-nav" aria-label="Navegação móvel">{navigation.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'mobile-link active' : 'mobile-link'}><Icon size={19} />{label}</NavLink>)}<Link className="button primary mobile-create" to="/chamados/novo" onClick={() => setOpen(false)}><Plus size={17} /> Novo atendimento</Link><p>Ambiente de demonstração. Dados salvos apenas neste navegador.</p></nav>}
  </>
}
