import { useState } from 'react'
import { RotateCcw, ShieldCheck, Trash2, UserPlus } from 'lucide-react'
import type { Data } from '../domain'
import { ADMIN_ID, createTechnician, deleteTechnician, profileHasHistory } from './administrator'
import { TechnicianAvatar } from '../components/TechnicianAvatar'
import './AdminProfiles.css'

type Props = { data: Data; save: (data: Data) => void }

export function AdminProfiles({ data, save }: Props) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const create = (event: React.FormEvent) => {
    event.preventDefault()
    try { save(createTechnician(data, name, role)); setMessage(`Perfil de ${name.trim()} criado.`); setName(''); setRole(''); setError('') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível criar o perfil.') }
  }
  const remove = (id: string) => {
    const person = data.technicians.find(item => item.id === id)
    if (!person || id === ADMIN_ID) return
    const hasHistory = profileHasHistory(data, id)
    const action = hasHistory ? 'desativar' : 'excluir'
    if (!window.confirm(`Deseja ${action} o perfil de ${person.name}?${hasHistory ? ' O histórico de chamados será preservado.' : ''}`)) return
    try { save(deleteTechnician(data, id)); setMessage(hasHistory ? `${person.name} foi desativado; o histórico foi preservado.` : `Perfil de ${person.name} excluído.`); setError('') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível excluir o perfil.') }
  }
  const restore = (id: string) => { save({ ...data, technicians: data.technicians.map(person => person.id === id ? { ...person, archived: false } : person) }); setMessage('Perfil reativado.'); setError('') }

  return <section className="admin-profiles"><div className="admin-profiles-heading"><span><ShieldCheck size={21} /></span><div><span className="section-kicker">ADMINISTRAÇÃO</span><h2>Perfis da equipe</h2><p>Crie perfis e gerencie quem aparece no seletor de técnicos.</p></div></div>
    <form className="admin-profile-form" onSubmit={create}><label>Nome do técnico<input value={name} onChange={event => setName(event.target.value)} placeholder="Nome e sobrenome" required /></label><label>Função<input value={role} onChange={event => setRole(event.target.value)} placeholder="Técnico de TI" /></label><button className="button primary" type="submit"><UserPlus size={16} /> Criar perfil</button></form>
    {error && <p className="admin-profile-error" role="alert">{error}</p>}{message && <p className="admin-profile-message" role="status">{message}</p>}
    <div className="admin-profile-list">{data.technicians.map(person => <div className="admin-profile-row" key={person.id}><TechnicianAvatar technician={person} /><div><strong>{person.name}</strong><small>{person.role}{person.archived ? ' · Desativado' : ''}</small></div>{person.id === ADMIN_ID ? <span className="admin-profile-protected"><ShieldCheck size={14} /> Permanente</span> : person.archived ? <button type="button" className="admin-profile-restore" onClick={() => restore(person.id)}><RotateCcw size={14} /> Reativar</button> : <button type="button" className="admin-profile-delete" onClick={() => remove(person.id)}><Trash2 size={14} /> {profileHasHistory(data, person.id) ? 'Desativar' : 'Excluir'}</button>}</div>)}</div>
  </section>
}
