const collections = ['tickets', 'sessions', 'plans', 'articles']
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right)
const failure = (status, message) => Object.assign(new Error(message), { status })

export function makeWorkspaceStore(db) {
  db.exec('CREATE TABLE IF NOT EXISTS workspace_state (id INTEGER PRIMARY KEY CHECK (id = 1), revision INTEGER NOT NULL, payload TEXT NOT NULL)')
  const select = db.prepare('SELECT revision,payload FROM workspace_state WHERE id=1')
  const insert = db.prepare('INSERT OR IGNORE INTO workspace_state (id,revision,payload) VALUES (1,1,?)')
  insert.run(JSON.stringify({ tickets: [], sessions: [], plans: [], articles: [], kanbanBoards: {} }))
  const update = db.prepare('UPDATE workspace_state SET revision=?,payload=? WHERE id=1')
  const read = () => { const row = select.get(); return row ? { revision: row.revision, data: JSON.parse(row.payload) } : { revision: 0, data: null } }
  const transaction = work => { db.exec('BEGIN IMMEDIATE'); try { const result = work(); db.exec('COMMIT'); return result } catch (error) { db.exec('ROLLBACK'); throw error } }
  const isAdmin = actor => actor === 'central-ti-administrador'
  const canEditTicket = (ticket, actor) => isAdmin(actor) || (ticket.createdById ?? ticket.ownerId) === actor || ticket.ownerId === actor || ticket.participants?.some(item => item.technicianId === actor)
  const persist = (revision, data) => { update.run(revision, JSON.stringify(data)); return { revision, data } }

  return {
    workspace: read,
    applyWorkspaceChanges(changes, actor) {
      if (!changes || typeof changes !== 'object') throw failure(400, 'Alterações inválidas.')
      return transaction(() => {
        const current = read()
        if (!current.data) throw failure(409, 'Os dados compartilhados ainda não foram inicializados.')
        const data = current.data
        let changed = false
        for (const key of collections) {
          const entries = changes[key] ?? []
          if (!Array.isArray(entries) || entries.length > 1000) throw failure(400, 'Alterações inválidas.')
          const seen = new Set()
          for (const entry of entries) {
            if (!entry || !Object.hasOwn(entry, 'before') || !Object.hasOwn(entry, 'after') || (entry.before === null && entry.after === null)) throw failure(400, 'Alteração incompleta.')
            const id = entry?.after?.id ?? entry?.before?.id
            if (typeof id !== 'string' || seen.has(id) || (entry.before && entry.after && entry.before.id !== entry.after.id)) throw failure(400, 'Identificador inválido.')
            seen.add(id)
            const index = data[key].findIndex(item => item.id === id)
            const existing = index < 0 ? null : data[key][index]
            if (!same(existing, entry.before ?? null)) throw failure(409, `${key}: ${id} foi alterado em outro computador. Atualize a página e refaça sua alteração.`)
            if (key === 'tickets') {
              if (existing && !canEditTicket(existing, actor)) throw failure(403, 'Você não pode alterar este chamado.')
              if (!existing && entry.after && !isAdmin(actor) && entry.after.createdById !== actor) throw failure(403, 'O criador do chamado deve ser o perfil ativo.')
              if (existing && entry.after) {
                const creator = existing.createdById ?? existing.ownerId
                if ((entry.after.createdById ?? entry.after.ownerId) !== creator) throw failure(403, 'O criador do chamado não pode ser alterado.')
                if (entry.after.ownerId !== existing.ownerId && !isAdmin(actor) && creator !== actor) throw failure(403, 'Somente o criador pode trocar o responsável.')
              }
            }
            if ((key === 'sessions' || key === 'plans') && entry.after && !isAdmin(actor) && entry.after.technicianId !== actor) throw failure(403, 'Registro de trabalho de outro técnico não permitido.')
            if ((key === 'sessions' || key === 'plans') && existing && !isAdmin(actor) && existing.technicianId !== actor) throw failure(403, 'Registro de trabalho de outro técnico não permitido.')
            if ((key === 'sessions' || key === 'plans') && entry.after && key === 'sessions') {
              const linked = data.tickets.find(ticket => ticket.id === entry.after.ticketId)
              if (!linked || !canEditTicket(linked, actor)) throw failure(403, 'Você não pode registrar trabalho neste chamado.')
            }
            if (key === 'tickets' && !entry.after && !isAdmin(actor)) throw failure(403, 'Somente o administrador pode excluir chamados.')
            if (entry.after === null) data[key].splice(index, 1)
            else if (index >= 0) data[key][index] = entry.after
            else if (key === 'tickets') data[key].unshift(entry.after)
            else data[key].push(entry.after)
            changed = true
          }
        }
        const boards = changes.kanbanBoards ?? []
        if (!Array.isArray(boards) || boards.length > 500) throw failure(400, 'Quadros inválidos.')
        for (const entry of boards) {
          if (typeof entry?.id !== 'string' || !/^[\w-]{1,80}$/.test(entry.id) || ['__proto__', 'constructor', 'prototype'].includes(entry.id) || !Object.hasOwn(entry, 'before') || !Object.hasOwn(entry, 'after')) throw failure(400, 'Quadro inválido.')
          if (!isAdmin(actor) && entry.id !== actor) throw failure(403, 'Você só pode alterar seu próprio quadro.')
          if (!same(data.kanbanBoards[entry.id] ?? null, entry.before ?? null)) throw failure(409, 'O quadro foi alterado em outro computador. Atualize a página.')
          if (entry.after === null) delete data.kanbanBoards[entry.id]
          else data.kanbanBoards[entry.id] = entry.after
          changed = true
        }
        return changed ? persist(current.revision + 1, data) : current
      })
    },
  }
}

