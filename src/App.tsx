import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { Data } from './domain'
import { repository } from './repository'
import { TicketCreationProvider } from './features/TicketCreation'
import { useTicketCreation } from './features/ticketCreationContext'
import { TicketDetail } from './pages/TicketDetail'
import { Tickets } from './pages/Tickets'
import { Profile } from './pages/Profile'
import { AppHeader } from './layouts/AppHeader'
import { Dashboard } from './pages/Dashboard'
import { Reports } from './features/Reports'
import { Knowledge, Article } from './features/Knowledge'
import { Planning } from './features/Planning'
import { ADMIN_ID, ensureAdministrator, verifyAdministratorPassword } from './features/administrator'
import './App.css'
import './styles/redesign.css'

type Context = { data: Data; save: (data: Data) => void; active: string; setActive: (id: string) => void; adminAuthenticated: boolean; authenticateAdmin: (password: string) => Promise<boolean> }
function LegacyCreateRoute() { const creation = useTicketCreation(); const location = useLocation(); const opened = useRef(false); const mode = location.search.includes('tipo=rapido') ? 'quick' : location.search.includes('tipo=prolongado') ? 'long' : 'chooser'; useEffect(() => { if (!opened.current) { opened.current = true; creation.open(mode) } }, [creation, mode]); return <Navigate to="/chamados" replace /> }
function Layout({ context }: { context: Context }) { return <TicketCreationProvider data={context.data} save={context.save} active={context.active}><div className="app-shell"><AppHeader technicians={context.data.technicians} active={context.active} setActive={context.setActive} adminAuthenticated={context.adminAuthenticated} authenticateAdmin={context.authenticateAdmin} /><main className="app-content">{context.active === ADMIN_ID && !context.adminAuthenticated ? <div className="panel empty">Desbloqueie o perfil de administrador para continuar.</div> : <Routes><Route path="/" element={<Dashboard data={context.data} active={context.active} />} /><Route path="/chamados" element={<Tickets data={context.data} save={context.save} active={context.active} />} /><Route path="/chamados/novo" element={<LegacyCreateRoute />} /><Route path="/chamados/:ticketId" element={<TicketDetail data={context.data} save={context.save} active={context.active} />} /><Route path="/planejamento" element={<Planning data={context.data} save={context.save} active={context.active} />} /><Route path="/conhecimento" element={<Knowledge data={context.data} save={context.save} />} /><Route path="/conhecimento/:articleId" element={<Article data={context.data} save={context.save} />} /><Route path="/relatorios" element={<Reports data={context.data} />} /><Route path="/perfil" element={<Profile data={context.data} save={context.save} active={context.active} />} /></Routes>}</main></div></TicketCreationProvider> }
export default function App() { const [data, setData] = useState<Data>(() => repository.read()); const [active, setActiveState] = useState(() => data.technicians.find(person => person.id !== ADMIN_ID && !person.archived)?.id ?? ADMIN_ID); const [adminAuthenticated, setAdminAuthenticated] = useState(false); const save = (next: Data) => { const normalized = ensureAdministrator(next); repository.save(normalized); setData(normalized) }; const setActive = (id: string) => { if (id !== ADMIN_ID) setAdminAuthenticated(false); setActiveState(id) }; const authenticateAdmin = async (password: string) => { const valid = await verifyAdministratorPassword(password); if (valid) { setAdminAuthenticated(true); setActiveState(ADMIN_ID) } return valid }; return <BrowserRouter><Layout context={{ data, save, active, setActive, adminAuthenticated, authenticateAdmin }} /></BrowserRouter> }
