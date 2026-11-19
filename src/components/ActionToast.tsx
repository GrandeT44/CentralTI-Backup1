import { useEffect, useRef } from 'react'
import { AlertCircle, Check, X } from 'lucide-react'
import '../features/TicketCreation.css'

type Props = { title: string; detail: string; onClose: () => void; error?: boolean }

export function ActionToast({ title, detail, onClose, error = false }: Props) {
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose }, [onClose])
  useEffect(() => {
    const timer = window.setTimeout(() => close.current(), 6000)
    return () => window.clearTimeout(timer)
  }, [title, detail])

  return <div className={error ? 'creation-toast action-toast-error' : 'creation-toast'} role={error ? 'alert' : 'status'}>
    <span className="creation-toast-icon">{error ? <AlertCircle size={17} /> : <Check size={17} />}</span>
    <div><strong>{title}</strong><small title={detail}>{detail}</small></div>
    <button className="creation-toast-close" type="button" aria-label="Fechar aviso" onClick={onClose}><X size={15} /></button>
  </div>
}
