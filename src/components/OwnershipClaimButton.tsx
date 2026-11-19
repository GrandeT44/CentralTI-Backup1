import { useEffect, useState } from 'react'
import { HandHelping } from 'lucide-react'
import type { OwnershipClaim } from '../domain'
import { ownershipRepository } from '../repository'
import './OwnershipClaimButton.css'

export function OwnershipClaimButton({ kind, resourceId, active }: { kind: OwnershipClaim['kind']; resourceId: string; active: string }) {
  const [pending, setPending] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let alive = true
    const refresh = () => { void ownershipRepository.list().then(result => {
      if (alive) setPending(result.claims.some(item => item.kind === kind && item.resourceId === resourceId && item.requesterId === active && item.status === 'pending'))
    }).catch(() => { if (alive) setError('Não foi possível consultar as solicitações.') }) }
    refresh()
    const timer = window.setInterval(refresh, 5000)
    return () => { alive = false; window.clearInterval(timer) }
  }, [kind, resourceId, active])
  const request = async () => {
    setBusy(true)
    setError('')
    try { await ownershipRepository.request(kind, resourceId); setPending(true) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível enviar a solicitação.') }
    finally { setBusy(false) }
  }
  return <div className="ownership-claim-action"><button type="button" onClick={() => void request()} disabled={busy || pending}><HandHelping size={15} />{pending ? 'Solicitação enviada' : busy ? 'Enviando...' : 'Pedir responsabilidade'}</button>{error && <small role="alert">{error}</small>}{pending && <small>Aguardando aprovação do administrador.</small>}</div>
}
