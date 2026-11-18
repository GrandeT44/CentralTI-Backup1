import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { Data } from './domain'
import { ApiError, profileRepository, workspaceRepository, type ProfileSession, type ServerProfile, type WorkspaceResponse } from './repository'
import { diffWorkspace, hasWorkspaceChanges, mergeWorkspace } from './workspaceSync'
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
import { ProfileLogin } from './features/ProfileLogin'
import { ensureAdministrator } from './features/administrator'
import './App.css'
import './styles/redesign.css'

type Context = {
  data: Data; save: (data: Data) => void; active: string; switchProfile: (id: string) => void
  notes: string; notesError: string; saveNotes: (notes: string) => void; refreshProfiles: () => Promise<void>
  syncMessage: string; dismissMessage: () => void
}

function LegacyCreateRoute() {
  const creation = useTicketCreation()
  const location = useLocation()
  const opened = useRef(false)
  const mode = location.search.includes('tipo=rapido') ? 'quick' : location.search.includes('tipo=prolongado') ? 'long' : 'chooser'
  useEffect(() => { if (!opened.current) { opened.current = true; creation.open(mode) } }, [creation, mode])
  return <Navigate to="/chamados" replace />
}

function Layout({ context }: { context: Context }) {
  return <TicketCreationProvider data={context.data} save={context.save} active={context.active}>
    <div className="app-shell">
      <AppHeader technicians={context.data.technicians} active={context.active} switchProfile={context.switchProfile} />
      <main className="app-content">
        {context.syncMessage && <div className="workspace-notice" role="alert"><span>{context.syncMessage}</span><button type="button" onClick={context.dismissMessage}>Fechar</button></div>}
        <Routes>
          <Route path="/" element={<Dashboard data={context.data} active={context.active} />} />
          <Route path="/chamados" element={<Tickets data={context.data} save={context.save} active={context.active} />} />
          <Route path="/chamados/novo" element={<LegacyCreateRoute />} />
          <Route path="/chamados/:ticketId" element={<TicketDetail data={context.data} save={context.save} active={context.active} />} />
          <Route path="/planejamento" element={<Planning data={context.data} save={context.save} active={context.active} notes={context.notes} notesError={context.notesError} saveNotes={context.saveNotes} />} />
          <Route path="/conhecimento" element={<Knowledge data={context.data} save={context.save} />} />
          <Route path="/conhecimento/:articleId" element={<Article data={context.data} save={context.save} />} />
          <Route path="/relatorios" element={<Reports data={context.data} />} />
          <Route path="/perfil" element={<Profile data={context.data} save={context.save} active={context.active} refreshProfiles={context.refreshProfiles} />} />
        </Routes>
      </main>
    </div>
  </TicketCreationProvider>
}

export default function App() {
  const [data, setData] = useState<Data>(() => ({ technicians: [], tickets: [], sessions: [], plans: [], articles: [], kanbanBoards: {} }))
  const dataRef = useRef(data)
  const [profiles, setProfiles] = useState<ServerProfile[]>([])
  const [session, setSession] = useState<ProfileSession | null>(null)
  const [notes, setNotes] = useState('')
  const [notesError, setNotesError] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [chosenId, setChosenId] = useState<string>()
  const [workspaceReady, setWorkspaceReady] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [serverUpgradeNeeded, setServerUpgradeNeeded] = useState(false)
  const notesQueue = useRef(Promise.resolve())
  const writeQueue = useRef(Promise.resolve())
  const pending = useRef(0)
  const epoch = useRef(0)
  const revision = useRef(0)

  useEffect(() => {
    try {
      for (const key of ['lanobrasil-ti-v1', 'lanobrasil-ti-workspace-imported-v1', 'lanobrasil-ti-workspace-recovery-v1']) localStorage.removeItem(key)
    } catch { /* O armazenamento do navegador pode estar indisponível. */ }
  }, [])

  const setDataNow = useCallback((next: Data) => { dataRef.current = next; setData(next) }, [])
  const mergeProfiles = useCallback((list: ServerProfile[]) => {
    setProfiles(list)
    const current = dataRef.current
    const technicians = [...current.technicians.filter(person => !list.some(server => server.id === person.id)).map(person => ({ ...person, archived: true })), ...list]
    setDataNow({ ...current, technicians })
  }, [setDataNow])
  const refreshProfiles = async () => { const result = await profileRepository.list(); mergeProfiles(result.profiles) }
  const applyRemote = useCallback((response: WorkspaceResponse) => {
    revision.current = response.revision
    if (!response.data) { setWorkspaceReady(false); return }
    const merged = mergeWorkspace(dataRef.current, response.data)
    setDataNow(merged)
    setWorkspaceReady(true)
  }, [setDataNow])
  const loadWorkspace = useCallback(async () => {
    try { const response = await workspaceRepository.load(); setServerUpgradeNeeded(false); applyRemote(response) }
    catch (cause) { if (cause instanceof ApiError && cause.status === 404) setServerUpgradeNeeded(true); throw cause }
  }, [applyRemote])

  useEffect(() => {
    let alive = true
    let retry: ReturnType<typeof setTimeout> | undefined
    const connect = async () => {
      try {
        const list = await profileRepository.list()
        if (!alive) return
        mergeProfiles(list.profiles)
        setError('')
        try {
          const current = await profileRepository.session()
          if (alive) { setSession(current); setNotes(current.notes); await loadWorkspace() }
        } catch { /* Sem sessão ativa. */ }
      } catch {
        if (alive) {
          setError('Não foi possível conectar à API. Confira se este endereço é o “Local” mostrado pelo Vite. Tentando novamente...')
          retry = setTimeout(connect, 4000)
        }
      } finally { if (alive) setLoading(false) }
    }
    void connect()
    return () => { alive = false; if (retry) clearTimeout(retry) }
  }, [loadWorkspace, mergeProfiles])

  const activeId = session?.profile.id
  useEffect(() => {
    if (!activeId) return
    let alive = true
    const poll = async () => {
      if (pending.current) return
      try {
        const response = await workspaceRepository.load(revision.current)
        if (alive) setServerUpgradeNeeded(false)
        if (alive && !pending.current && response.data) applyRemote(response)
      } catch (cause) { if (alive) { if (cause instanceof ApiError && cause.status === 404) setServerUpgradeNeeded(true); else if (cause instanceof ApiError && cause.status === 401) { setChosenId(activeId); setSession(null); setError('Sua sessão expirou. Entre novamente para continuar.') } else setSyncMessage('Não foi possível atualizar os dados compartilhados. Verifique a conexão com o servidor.') } }
    }
    const timer = window.setInterval(() => { void poll() }, 3000)
    return () => { alive = false; window.clearInterval(timer) }
  }, [activeId, applyRemote])

  const save = (next: Data) => {
    const normalized = ensureAdministrator(next)
    const changes = diffWorkspace(dataRef.current, normalized)
    setDataNow(normalized)
    if (!hasWorkspaceChanges(changes)) return
    pending.current++
    const taskEpoch = epoch.current
    writeQueue.current = writeQueue.current.catch(() => {}).then(async () => {
      if (taskEpoch !== epoch.current) return
      for (;;) {
        try {
          const response = await workspaceRepository.apply(changes)
          if (taskEpoch !== epoch.current) return
          revision.current = response.revision
          pending.current--
          if (pending.current === 0) applyRemote(response)
          setSyncMessage('')
          return
        } catch (cause) {
          if (cause instanceof ApiError && cause.status === 401) {
            epoch.current++
            pending.current = 0
            setChosenId(session?.profile.id)
            setSession(null)
            setError('Sua sessão expirou. Entre novamente e refaça a última alteração, que não foi enviada ao servidor.')
            return
          }
          if (cause instanceof ApiError && [403, 409].includes(cause.status)) {
            epoch.current++
            pending.current = 0
            setSyncMessage(`${cause.message} A alteração não foi enviada. Confira o registro e tente novamente.`)
            try { await loadWorkspace() } catch { /* O aviso permanece visível. */ }
            return
          }
          setSyncMessage('Servidor indisponível. A alteração está pendente e será enviada quando a conexão voltar. Mantenha esta página aberta.')
          await new Promise(resolve => setTimeout(resolve, 3000))
        }
      }
    })
  }
  const onLogin = async (current: ProfileSession) => {
    setLoading(true); setSession(current); setNotes(current.notes); setNotesError(''); setChosenId(undefined); setError('')
    try { await refreshProfiles(); if (!pending.current) await loadWorkspace() }
    catch { setSyncMessage('Não foi possível carregar os dados compartilhados. Tentando novamente...') }
    finally { setLoading(false) }
  }
  const switchProfile = (id: string) => {
    if (pending.current) { setSyncMessage('Aguarde a sincronização antes de trocar de perfil.'); return }
    setLoading(true)
    void notesQueue.current.then(() => profileRepository.logout()).then(() => { setChosenId(id); setSession(null); setWorkspaceReady(false); setNotes(''); notesQueue.current = Promise.resolve(); setError('') }).catch(() => setError('Não foi possível encerrar a sessão.')).finally(() => setLoading(false))
  }
  const saveNotes = (value: string) => { setNotes(value); setNotesError(''); notesQueue.current = notesQueue.current.catch(() => {}).then(() => profileRepository.saveNotes(value).then(() => setNotesError(''))).catch(() => setNotesError('Não foi possível salvar as notas. Verifique o servidor e edite novamente.')) }

  if (loading) return <div className="profile-login-page">Carregando dados...</div>
  if (!session) return <ProfileLogin profiles={profiles} initialId={chosenId} onLogin={onLogin} error={error} />
  if (!workspaceReady) return <main className="profile-login-page"><section className="profile-login-card"><h1>{serverUpgradeNeeded ? 'Reinicie o servidor local' : 'Aguardando dados compartilhados'}</h1><p>{serverUpgradeNeeded ? 'Feche o processo antigo e execute npm.cmd start novamente.' : 'Não foi possível carregar os dados do servidor. Verifique a conexão e atualize a página.'}</p>{syncMessage && <p role="alert">{syncMessage}</p>}<button type="button" className="button" onClick={() => switchProfile('')}>Voltar ao acesso</button></section></main>
  return <BrowserRouter><Layout context={{ data, save, active: session.profile.id, switchProfile, notes, notesError, saveNotes, refreshProfiles, syncMessage, dismissMessage: () => setSyncMessage('') }} /></BrowserRouter>
}
