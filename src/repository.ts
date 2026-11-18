import type { Technician, WorkspaceChanges, WorkspaceData } from './domain'

export type ServerProfile = Technician & { passwordSet: boolean; setupPending: boolean }
export type ProfileSession = { profile: ServerProfile; notes: string }
export class ApiError extends Error { status: number; constructor(message: string, status: number) { super(message); this.status = status } }
async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
 const response = await fetch(`/api${path}`, { method, credentials: 'same-origin', headers: { 'X-Requested-With': 'CentralTI', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) })
 const result = await response.json()
 if (!response.ok) throw new ApiError(result.error ?? 'Não foi possível acessar o banco local.', response.status)
 return result as T
}
export type WorkspaceResponse = { revision: number; data: WorkspaceData | null; unchanged?: boolean }
export const workspaceRepository = {
 load: (since?: number) => api<WorkspaceResponse>(`/workspace${since === undefined ? '' : `?since=${since}`}`),
 apply: (changes: WorkspaceChanges) => api<WorkspaceResponse>('/workspace/changes', 'POST', { changes }),
}
export const profileRepository = {
 list: () => api<{ profiles: ServerProfile[] }>('/profiles'),
 session: () => api<ProfileSession>('/session'),
 login: (id: string, password: string) => api<ProfileSession>('/login', 'POST', { id, password }),
 setup: (id: string, code: string, password: string) => api<ProfileSession>('/setup', 'POST', { id, code, password }),
 logout: () => api<{ ok: boolean }>('/logout', 'POST'),
 saveNotes: (notes: string) => api<{ notes: string }>('/me/notes', 'PUT', { notes }),
 savePhoto: (photoDataUrl: string) => api<{ profile: ServerProfile }>('/me/profile', 'PATCH', { photoDataUrl }),
 create: (name: string, role: string) => api<ServerProfile & { setupCode: string }>('/admin/profiles', 'POST', { name, role }),
 issueCode: (id: string) => api<{ code: string }>(`/admin/profiles/${id}/code`, 'POST'),
 resetPassword: (id: string, password: string) => api<{ ok: boolean }>(`/admin/profiles/${id}/password`, 'POST', { password }),
 archive: (id: string) => api<{ ok: boolean }>(`/admin/profiles/${id}`, 'DELETE'),
 restore: (id: string) => api<{ ok: boolean }>(`/admin/profiles/${id}/restore`, 'POST'),
}
