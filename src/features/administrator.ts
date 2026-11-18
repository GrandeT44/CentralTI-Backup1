import type { Data, Technician } from '../domain.ts'

export const ADMIN_ID = 'central-ti-administrador'
export const ADMIN_PROFILE: Technician = { id: ADMIN_ID, name: 'Administrador TI', role: 'Administrador', avatar: 'AT' }
export const isAdministrator = (technicianId: string) => technicianId === ADMIN_ID

const salt = new TextEncoder().encode('CentralTI-Lanobrasil-admin-v1')
const expectedHash = '0ab7169b22b1592592814ffee603df8ca3de5ed6969a9668671ec7340f40c386'

export async function verifyAdministratorPassword(password: string): Promise<boolean> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, key, 256)
  const actual = [...new Uint8Array(bits)].map(byte => byte.toString(16).padStart(2, '0')).join('')
  return actual === expectedHash
}

export function ensureAdministrator(data: Data): Data {
  const existing = data.technicians.find(person => person.id === ADMIN_ID)
  const technicians = data.technicians.filter(person => person.id !== ADMIN_ID)
  return { ...data, technicians: [...technicians, { ...ADMIN_PROFILE, ...existing, archived: false }] }
}

export function createTechnician(data: Data, name: string, role: string): Data {
  const cleanName = name.trim()
  if (!cleanName) throw new Error('Informe o nome do técnico.')
  if (data.technicians.some(person => person.name.toLocaleLowerCase('pt-BR') === cleanName.toLocaleLowerCase('pt-BR'))) throw new Error('Já existe um perfil com esse nome.')
  const initials = cleanName.split(/\s+/).slice(0, 2).map(part => part[0]?.toLocaleUpperCase('pt-BR')).join('')
  const technician: Technician = { id: crypto.randomUUID(), name: cleanName, role: role.trim() || 'Técnico de TI', avatar: initials }
  return { ...data, technicians: [...data.technicians, technician] }
}

export function profileHasHistory(data: Data, technicianId: string): boolean {
  return data.tickets.some(ticket => ticket.ownerId === technicianId || ticket.createdById === technicianId || ticket.participants.some(person => person.technicianId === technicianId) || ticket.progress.some(entry => entry.authorId === technicianId) || ticket.steps?.some(step => step.completedById === technicianId))
    || data.sessions.some(session => session.technicianId === technicianId)
    || data.plans.some(plan => plan.technicianId === technicianId)
}

export function deleteTechnician(data: Data, technicianId: string): Data {
  if (isAdministrator(technicianId)) throw new Error('O administrador não pode ser excluído.')
  const technician = data.technicians.find(person => person.id === technicianId)
  if (!technician) throw new Error('Perfil não encontrado.')
  if (profileHasHistory(data, technicianId)) return { ...data, technicians: data.technicians.map(person => person.id === technicianId ? { ...person, archived: true } : person) }
  const { [technicianId]: _notes, ...personalNotes } = data.personalNotes ?? {}
  const { [technicianId]: _board, ...kanbanBoards } = data.kanbanBoards ?? {}
  void _notes; void _board
  return { ...data, technicians: data.technicians.filter(person => person.id !== technicianId), personalNotes, kanbanBoards }
}
