export type Status = 'Aberto' | 'Em andamento' | 'Aguardando terceiros' | 'Concluído' | 'Cancelado'
export type Priority = 'Baixa' | 'Média' | 'Alta'
export interface Technician { id: string; name: string; role: string; avatar: string; photoDataUrl?: string; archived?: boolean; deleted?: boolean }
export interface TicketParticipant { technicianId: string; worked: boolean }
export type TicketEventKind = 'progress' | 'blocker' | 'milestone' | 'note' | 'work' | 'status' | 'owner' | 'due' | 'completion' | 'solution' | 'priority' | 'participant'
export interface TicketProgressEntry { id: string; at: string; authorId: string; text: string; kind?: TicketEventKind; contributionEligible?: boolean }
export interface TicketStep { id: string; title: string; done: boolean; completedById?: string }
export interface Ticket { id: string; type: 'quick' | 'long'; title: string; description: string; employee?: string; createdById?: string; createdAt?: string; ownerId: string; participants: TicketParticipant[]; category: string; priority: Priority; status: Status; openedAt: string; dueAt?: string; completedAt?: string; solution?: string; durationMinutes?: number; progress: TicketProgressEntry[]; steps?: TicketStep[] }
export interface WorkSession { id: string; technicianId: string; ticketId: string; start: string; end: string; note?: string }
export interface PlannedActivity { id: string; technicianId: string; ticketId: string; start: string; end: string; note?: string }
export interface KnowledgeSolution { id: string; text: string; context?: string; verified?: boolean; authorId?: string; addedAt?: string }
export interface KnowledgeImage { id: string; dataUrl: string; alt: string }
export interface KnowledgeArticle { id: string; title: string; category: string; symptoms: string; procedures: string; solutions: KnowledgeSolution[]; ticketIds: string[]; body?: string; images?: KnowledgeImage[]; tags?: string[]; notes?: string; authorId?: string; ownerId?: string | null; createdAt?: string; updatedAt?: string; updatedById?: string; history?: { id: string; at: string; authorId: string; action: string }[] }
export interface OwnershipClaim { id: string; kind: 'article' | 'ticket'; resourceId: string; requesterId: string; status: 'pending' | 'approved' | 'rejected'; createdAt: string; reviewedAt?: string; reviewerId?: string }
export interface KnowledgeEditRequest { id: string; articleId: string; requesterId: string; createdAt: string; status: 'pending' | 'approved' | 'rejected'; reviewedAt?: string; reviewerId?: string; proposed: KnowledgeArticle }
export interface ActivityHeatmapDay { date: string; completed: number; contributions: number; progress: number }
export interface KanbanColumn { id: string; name: string; custom: boolean }
export interface KanbanPlacement { columnId: string; statusAtMove: Status }
export interface KanbanDraft { id: string; title: string; createdAt: string }
export interface KanbanBoard { columns: KanbanColumn[]; placements: Record<string, KanbanPlacement>; drafts?: KanbanDraft[]; compact?: boolean }
export interface Data { technicians: Technician[]; tickets: Ticket[]; sessions: WorkSession[]; plans: PlannedActivity[]; articles: KnowledgeArticle[]; kanbanBoards?: Record<string, KanbanBoard>; personalNotes?: Record<string, string> }
export type WorkspaceData = Pick<Data, 'tickets' | 'sessions' | 'plans' | 'articles' | 'kanbanBoards'>
export type WorkspaceChange<T> = { before: T | null; after: T | null }
export type WorkspaceChanges = {
 tickets?: WorkspaceChange<Ticket>[]
 sessions?: WorkspaceChange<WorkSession>[]
 plans?: WorkspaceChange<PlannedActivity>[]
 articles?: WorkspaceChange<KnowledgeArticle>[]
 kanbanBoards?: { id: string; before: KanbanBoard | null; after: KanbanBoard | null }[]
}
