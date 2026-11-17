export type Status = 'Aberto' | 'Em andamento' | 'Aguardando terceiros' | 'Concluído' | 'Cancelado'
export type Priority = 'Baixa' | 'Média' | 'Alta'
export interface Technician { id: string; name: string; role: string; avatar: string; photoDataUrl?: string }
export interface TicketParticipant { technicianId: string; worked: boolean }
export type TicketEventKind = 'progress' | 'blocker' | 'milestone' | 'note' | 'work' | 'status' | 'owner' | 'due' | 'completion' | 'solution' | 'priority' | 'participant'
export interface TicketProgressEntry { id: string; at: string; authorId: string; text: string; kind?: TicketEventKind }
export interface Ticket { id: string; type: 'quick' | 'long'; title: string; description: string; employee?: string; createdById?: string; ownerId: string; participants: TicketParticipant[]; category: string; priority: Priority; status: Status; openedAt: string; dueAt?: string; completedAt?: string; solution?: string; durationMinutes?: number; progress: TicketProgressEntry[] }
export interface WorkSession { id: string; technicianId: string; ticketId: string; start: string; end: string; note?: string }
export interface PlannedActivity { id: string; technicianId: string; ticketId: string; start: string; end: string; note?: string }
export interface KnowledgeSolution { id: string; text: string }
export interface KnowledgeArticle { id: string; title: string; category: string; symptoms: string; procedures: string; solutions: KnowledgeSolution[]; ticketIds: string[] }
export interface ActivityHeatmapDay { date: string; completed: number; contributions: number; progress: number }
export interface KanbanColumn { id: string; name: string; custom: boolean }
export interface KanbanPlacement { columnId: string; statusAtMove: Status }
export interface KanbanBoard { columns: KanbanColumn[]; placements: Record<string, KanbanPlacement> }
export interface Data { technicians: Technician[]; tickets: Ticket[]; sessions: WorkSession[]; plans: PlannedActivity[]; articles: KnowledgeArticle[]; kanbanBoards?: Record<string, KanbanBoard> }
