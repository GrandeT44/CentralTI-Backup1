import { useState } from 'react'
import { Activity, LockKeyhole, UserRound } from 'lucide-react'
import type { ProfileSession, ServerProfile } from '../repository'
import { profileRepository } from '../repository'
import './ProfileLogin.css'

type Props = { profiles: ServerProfile[]; onLogin: (session: ProfileSession) => void; initialId?: string; error?: string }
export function ProfileLogin({ profiles, onLogin, initialId, error: loadError }: Props) {
  const available = profiles.filter(item => !item.archived)
  const [selectedId, setSelectedId] = useState(initialId ?? '')
  const id = available.some(item => item.id === selectedId) ? selectedId : available.some(item => item.id === initialId) ? initialId! : available.find(item => item.passwordSet)?.id ?? available[0]?.id ?? ''
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const person = available.find(item => item.id === id)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (!person || busy) return
    setBusy(true); setError('')
    try { onLogin(person.passwordSet ? await profileRepository.login(id, password) : await profileRepository.setup(id, code, password)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível entrar.') }
    finally { setBusy(false) }
  }
  return <main className="profile-login-page"><div className="profile-login-card"><div className="profile-login-brand"><span><Activity size={21} /></span><strong>central<span>ti</span></strong></div><div className="profile-login-icon"><UserRound size={25} /></div><h1>Entrar na Central TI</h1><p>Escolha seu perfil para acessar seus dados pessoais e o trabalho da equipe.</p>{loadError && <p className="profile-login-error" role="alert">{loadError}</p>}{available.length > 0 && <form onSubmit={submit}><label>Perfil<select value={id} onChange={event => { setSelectedId(event.target.value); setPassword(''); setCode(''); setError('') }}>{available.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>{!person?.passwordSet && <><p className="profile-login-hint">Primeiro acesso: solicite ao administrador um código único e crie sua senha.</p><label>Código de primeiro acesso<input value={code} onChange={event => setCode(event.target.value)} autoComplete="one-time-code" required /></label></>}<label>Senha{!person?.passwordSet ? ' nova' : ''}<div className="profile-login-password"><LockKeyhole size={16} /><input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete={person?.passwordSet ? 'current-password' : 'new-password'} minLength={person?.passwordSet ? undefined : 10} required /></div></label>{error && <p className="profile-login-error" role="alert">{error}</p>}<button type="submit" className="button primary" disabled={busy}>{busy ? 'Entrando...' : person?.passwordSet ? 'Entrar' : 'Criar senha e entrar'}</button></form>}</div></main>
}
