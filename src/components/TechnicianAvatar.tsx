import type { Technician } from '../domain'
import './TechnicianAvatar.css'

export function TechnicianAvatar({ technician, className = '' }: { technician?: Technician; className?: string }) {
  return <span className={`technician-avatar ${className}`} title={technician?.name ?? 'Técnico'}>{technician?.photoDataUrl ? <img src={technician.photoDataUrl} alt={technician.name} /> : <span>{technician?.avatar ?? '?'}</span>}</span>
}
