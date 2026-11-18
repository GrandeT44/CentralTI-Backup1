import type { Data, WorkspaceChanges, WorkspaceData, WorkspaceChange, KanbanBoard } from './domain'

const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right)
export const workspaceFromData = (data: Data): WorkspaceData => ({ tickets: data.tickets ?? [], sessions: data.sessions ?? [], plans: data.plans ?? [], articles: data.articles ?? [], kanbanBoards: data.kanbanBoards ?? {} })
export const mergeWorkspace = (current: Data, shared: WorkspaceData): Data => ({ ...current, ...shared })

function itemChanges<T extends { id: string }>(before: T[], after: T[]): WorkspaceChange<T>[] {
  const old = new Map(before.map(item => [item.id, item]))
  const latest = new Map(after.map(item => [item.id, item]))
  const changes: WorkspaceChange<T>[] = []
  for (const item of after) if (!same(old.get(item.id), item)) changes.push({ before: old.get(item.id) ?? null, after: item })
  for (const item of before) if (!latest.has(item.id)) changes.push({ before: item, after: null })
  return changes
}

export function diffWorkspace(before: Data, after: Data): WorkspaceChanges {
  const boards: { id: string; before: KanbanBoard | null; after: KanbanBoard | null }[] = []
  const oldBoards = before.kanbanBoards ?? {}, newBoards = after.kanbanBoards ?? {}
  for (const id of new Set([...Object.keys(oldBoards), ...Object.keys(newBoards)])) {
    if (!same(oldBoards[id], newBoards[id])) boards.push({ id, before: oldBoards[id] ?? null, after: newBoards[id] ?? null })
  }
  return {
    tickets: itemChanges(before.tickets ?? [], after.tickets ?? []),
    sessions: itemChanges(before.sessions ?? [], after.sessions ?? []),
    plans: itemChanges(before.plans ?? [], after.plans ?? []),
    articles: itemChanges(before.articles ?? [], after.articles ?? []),
    kanbanBoards: boards,
  }
}

export function hasWorkspaceChanges(changes: WorkspaceChanges) { return Object.values(changes).some(items => items?.length) }
