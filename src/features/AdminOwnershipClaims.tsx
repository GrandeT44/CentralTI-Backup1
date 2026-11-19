import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, FileText, Inbox, Ticket, X } from 'lucide-react'
import type { Data, OwnershipClaim } from '../domain'
import { ownershipRepository } from '../repository'
import { TechnicianAvatar } from '../components/TechnicianAvatar'
import './AdminOwnershipClaims.css'

export function AdminOwnershipClaims({ data }: { data: Data }) {
  const [claims, setClaims] = useState<OwnershipClaim[]>([])
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  useEffect(() => {
    let alive = true
    const refresh = () => { void ownershipRepository.list().then(result => { if (alive) setClaims(result.claims) }).catch(() => { if (alive) setMessage('Não foi possível carregar as solicitações.') }) }
    refresh()
    const timer = window.setInterval(refresh, 5000)
    return () => { alive = false; window.clearInterval(timer) }
  }, [])
  const decide = async (claim: OwnershipClaim, approve: boolean) => {
    setBusy(claim.id)
    setMessage('')
    try {
      await ownershipRepository.resolve(claim.id, approve)
      setClaims((await ownershipRepository.list()).claims)
      setMessage(approve ? 'Responsabilidade atribuída.' : 'Solicitação recusada.')
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Não foi possível analisar a solicitação.') }
    finally { setBusy('') }
  }
  return <section className="admin-ownership"><div className="admin-ownership-head"><span><Inbox size={19} /></span><div><span className="section-kicker">PENDÊNCIAS</span><h2>Pedidos de responsabilidade</h2><p>Analise quem quer assumir um artigo ou chamado sem responsável.</p></div><b>{claims.length}</b></div>{claims.length ? <div className="admin-ownership-list">{claims.map(claim => {
    const person = data.technicians.find(item => item.id === claim.requesterId)
    const resource = claim.kind === 'article' ? data.articles.find(item => item.id === claim.resourceId) : data.tickets.find(item => item.id === claim.resourceId)
    return <div className="admin-ownership-row" key={claim.id}><span className="admin-ownership-kind">{claim.kind === 'article' ? <FileText size={17} /> : <Ticket size={17} />}</span><div className="admin-ownership-copy"><small>{claim.kind === 'article' ? 'ARTIGO' : 'CHAMADO'}</small><Link to={`${claim.kind === 'article' ? '/conhecimento' : '/chamados'}/${claim.resourceId}`}>{resource?.title ?? claim.resourceId}</Link><span><TechnicianAvatar technician={person} /> {person?.name ?? 'Perfil excluído'} quer assumir</span></div><div className="admin-ownership-actions"><button type="button" disabled={!!busy} onClick={() => void decide(claim, false)}><X size={15} /> Recusar</button><button type="button" className="approve" disabled={!!busy} onClick={() => void decide(claim, true)}><Check size={15} /> Aprovar</button></div></div>
  })}</div> : <div className="admin-ownership-empty">Nenhuma solicitação pendente.</div>}{message && <p role="status" className="admin-ownership-message">{message}</p>}</section>
}
