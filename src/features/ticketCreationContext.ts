import { createContext, useContext } from 'react'

export type CreationMode = 'chooser' | 'quick' | 'long'
export type CreationOptions = { title?: string; sourceDraftId?: string }
export type CreationContextValue = { open: (mode?: CreationMode, options?: CreationOptions) => void }
export const CreationContext = createContext<CreationContextValue | null>(null)
export function useTicketCreation() { const value = useContext(CreationContext); if (!value) throw new Error('Criação de chamados indisponível.'); return value }
