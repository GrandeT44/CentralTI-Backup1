import type { KanbanBoard, KanbanColumn, Ticket } from '../domain'

export const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'todo', name: 'A fazer', custom: false },
  { id: 'doing', name: 'Fazendo', custom: false },
  { id: 'done', name: 'Feitos', custom: false },
]
export function normalizeBoard(board?: KanbanBoard): KanbanBoard {
  const custom = (board?.columns ?? []).filter(column => column.custom && !DEFAULT_COLUMNS.some(fixed => fixed.id === column.id))
  const columns = [...DEFAULT_COLUMNS, ...custom]
  const order = board?.columns?.map(column => column.id) ?? []
  const completeOrder = [...DEFAULT_COLUMNS.map(column => column.id).filter(id => !order.includes(id)), ...order]
  columns.sort((a, b) => completeOrder.indexOf(a.id) - completeOrder.indexOf(b.id))
  return { columns, placements: board?.placements ?? {} }
}
export function automaticColumn(ticket: Ticket) {
  if (ticket.status === 'Concluído' || ticket.status === 'Cancelado' || ticket.type === 'quick') return 'done'
  return 'doing'
}
export function columnForTicket(ticket: Ticket, board: KanbanBoard) {
  const placement = board.placements[ticket.id]
  if (!placement || placement.statusAtMove !== ticket.status || !board.columns.some(column => column.id === placement.columnId)) return automaticColumn(ticket)
  if (ticket.status === 'Concluído' || ticket.status === 'Cancelado') return 'done'
  return placement.columnId
}
