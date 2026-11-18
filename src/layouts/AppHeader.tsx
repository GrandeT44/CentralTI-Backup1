import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Activity, BookOpen, CalendarDays, ChartNoAxesCombined, ChevronDown, ClipboardList, LayoutDashboard, LockKeyhole, Menu, Plus, ShieldCheck, UserRound, X } from 'lucide-react'
import type { Technician } from '../domain'
import { TechnicianAvatar } from '../components/TechnicianAvatar'
import { CreateTicketButton } from '../features/TicketCreation'
import { ADMIN_ID } from '../features/administrator'
import './AdminAccess.css'

type Props = { technicians: Technician[]; active: string; setActive: (id: string) => void; adminAuthenticated: boolean; authenticateAdmin: (password: string) => Promise<boolean> }
const navigation = [
  { to: '/', label: 'Início', icon: LayoutDashboard },
  { to: '/chamados', label: 'Chamados', icon: ClipboardList },
  { to: '/planejamento', label: 'Planejamento', icon: CalendarDays },
  { to: '/conhecimento', label: 'Conhecimento', icon: BookOpen },
  { to: '/relatorios', label: 'Relatórios', icon: ChartNoAxesCombined },
  { to: '/perfil', label: 'Perfil', icon: UserRound },
]

export function AppHeader({ technicians, active, setActive, adminAuthenticated, authenticateAdmin }: Props) {
  const [open, setOpen] = useState(false)
  const [unlockOpen, setUnlockOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [unlockError, setUnlockError] = useState('')
  const [checking, setChecking] = useState(false)
  const technician = technicians.find(item => item.id === active)
  const available = technicians.filter(person => !person.archived)
  const chooseTechnician = (id: string) => { if (id === ADMIN_ID && !adminAuthenticated) { setPassword(''); setUnlockError(''); setUnlockOpen(true); return } setActive(id) }
  const unlock = async (event: React.FormEvent) => { event.preventDefault(); if (checking) return; setChecking(true); try { if (await authenticateAdmin(password)) { setUnlockOpen(false); setPassword(''); setUnlockError('') } else setUnlockError('Senha incorreta.') } catch { setUnlockError('Não foi possível validar a senha neste navegador.') } finally { setChecking(false) } }
  return <>
    <header className="app-header">
      <div className="header-inner">
        <Link to="/" className="app-brand" aria-label="Central TI, início"><span className="brand-symbol"><Activity size={20} strokeWidth={2.4} /></span><span><strong>central<span className="brand-accent">ti</span></strong><small>LANOBRASIL</small></span></Link>
        <nav className="header-nav" aria-label="Navegação principal">{navigation.map(({ to, label }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => isActive ? 'header-link active' : 'header-link'}>{label}</NavLink>)}</nav>
        <div className="header-actions"><span className="demo-pill" title="Dados apenas neste navegador">● <span>Demo local</span></span>{active === ADMIN_ID && !adminAuthenticated && <button type="button" className="button" onClick={() => setUnlockOpen(true)}><LockKeyhole size={15} /> Desbloquear</button>}{(active !== ADMIN_ID || adminAuthenticated) && <CreateTicketButton className="button primary header-create"><Plus size={15} /> Novo chamado</CreateTicketButton>}<label className="technician-switch"><TechnicianAvatar technician={technician} className="mini-avatar" /><span className="switch-name">{technician?.name}</span><ChevronDown size={15} /><select aria-label="Técnico ativo para demonstração" value={active} onChange={event => chooseTechnician(event.target.value)}>{available.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button className="header-menu-button" type="button" aria-expanded={open} aria-label={open ? 'Fechar menu' : 'Abrir menu'} onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button></div>
      </div>
    </header>
    {open && <nav className="mobile-nav" aria-label="Navegação móvel">{navigation.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'mobile-link active' : 'mobile-link'}><Icon size={19} />{label}</NavLink>)}{(active !== ADMIN_ID || adminAuthenticated) && <CreateTicketButton className="button primary mobile-create" onClick={() => setOpen(false)}><Plus size={17} /> Novo atendimento</CreateTicketButton>}<p>Ambiente de demonstração. Dados salvos apenas neste navegador.</p></nav>}
    {unlockOpen && <div className="admin-access-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setUnlockOpen(false) }}><form className="admin-access-dialog" onSubmit={unlock} role="dialog" aria-modal="true" aria-labelledby="admin-access-title"><div className="admin-access-heading"><span><ShieldCheck size={23} /></span><button type="button" aria-label="Fechar" onClick={() => setUnlockOpen(false)}><X size={17} /></button></div><h2 id="admin-access-title">Acessar administrador</h2><p>Digite a senha para abrir o perfil com permissões ampliadas neste navegador.</p><label>Senha do administrador<div><LockKeyhole size={16} /><input autoFocus type="password" autoComplete="off" value={password} onChange={event => setPassword(event.target.value)} /></div></label>{unlockError && <p className="admin-access-error" role="alert">{unlockError}</p>}<button className="button primary" type="submit" disabled={checking || !password}>{checking ? 'Verificando...' : 'Entrar no perfil'}</button></form></div>}
  </>
}
