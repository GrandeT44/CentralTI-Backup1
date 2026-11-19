import { randomUUID } from 'node:crypto'

const collections = ['tickets', 'sessions', 'plans', 'articles']
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right)
const failure = (status, message) => Object.assign(new Error(message), { status })

export function makeWorkspaceStore(db) {
  db.exec('CREATE TABLE IF NOT EXISTS workspace_state (id INTEGER PRIMARY KEY CHECK (id = 1), revision INTEGER NOT NULL, payload TEXT NOT NULL)')
  db.exec(`CREATE TABLE IF NOT EXISTS knowledge_edit_requests (id TEXT PRIMARY KEY, article_id TEXT NOT NULL, requester_id TEXT NOT NULL, created_at TEXT NOT NULL, status TEXT NOT NULL, base_payload TEXT NOT NULL, proposed_payload TEXT NOT NULL, reviewed_at TEXT, reviewer_id TEXT)`)
  db.exec('CREATE TABLE IF NOT EXISTS knowledge_favorites (profile_id TEXT NOT NULL, article_id TEXT NOT NULL, PRIMARY KEY (profile_id, article_id))')
  db.exec("CREATE TABLE IF NOT EXISTS ownership_claims (id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('article','ticket')), resource_id TEXT NOT NULL, requester_id TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, reviewed_at TEXT, reviewer_id TEXT)")
  const select = db.prepare('SELECT revision,payload FROM workspace_state WHERE id=1')
  const insert = db.prepare('INSERT OR IGNORE INTO workspace_state (id,revision,payload) VALUES (1,1,?)')
  insert.run(JSON.stringify({ tickets: [], sessions: [], plans: [], articles: [], kanbanBoards: {} }))
  const update = db.prepare('UPDATE workspace_state SET revision=?,payload=? WHERE id=1')
  const read = () => { const row = select.get(); return row ? { revision: row.revision, data: JSON.parse(row.payload) } : { revision: 0, data: null } }
  const transaction = work => { db.exec('BEGIN IMMEDIATE'); try { const result = work(); db.exec('COMMIT'); return result } catch (error) { db.exec('ROLLBACK'); throw error } }
  const isAdmin = actor => actor === 'central-ti-administrador'
  const canEditTicket = (ticket, actor) => isAdmin(actor) || (ticket.createdById ?? ticket.ownerId) === actor || ticket.ownerId === actor || ticket.participants?.some(item => item.technicianId === actor)
  const persist = (revision, data) => { update.run(revision, JSON.stringify(data)); return { revision, data } }
  const articleOwner = article => article.ownerId === null ? null : article.ownerId ?? article.authorId ?? 'central-ti-administrador'
  const clearArticleLinks = id => {
    db.prepare('DELETE FROM knowledge_favorites WHERE article_id=?').run(id)
    db.prepare("DELETE FROM knowledge_edit_requests WHERE article_id=? AND status='pending'").run(id)
    db.prepare("DELETE FROM ownership_claims WHERE kind='article' AND resource_id=? AND status='pending'").run(id)
  }
  const articleContent = article => ({ id: article.id, title: article.title, category: article.category, ownerId: article.ownerId, symptoms: article.symptoms, procedures: article.procedures, body: article.body ?? '', images: article.images ?? [], notes: article.notes ?? '', tags: article.tags ?? [], ticketIds: article.ticketIds ?? [], solutions: article.solutions?.map(item => ({ id: item.id, text: item.text, context: item.context ?? '', verified: !!item.verified })) ?? [] })
  const validProposal = (article, proposed) => proposed && proposed.id === article.id
    && typeof proposed.title === 'string' && proposed.title.trim().length > 0 && proposed.title.length <= 100
    && typeof proposed.category === 'string' && typeof proposed.symptoms === 'string' && typeof proposed.procedures === 'string'
    && (proposed.ownerId === undefined || proposed.ownerId === null || typeof proposed.ownerId === 'string')
    && (proposed.body === undefined || typeof proposed.body === 'string')
    && (proposed.images === undefined || (Array.isArray(proposed.images) && proposed.images.length <= 8 && proposed.images.every(image => typeof image.id === 'string' && typeof image.alt === 'string' && typeof image.dataUrl === 'string' && image.dataUrl.length <= 2_000_000 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(image.dataUrl))))
    && (proposed.notes === undefined || typeof proposed.notes === 'string')
    && Array.isArray(proposed.solutions) && (proposed.solutions.length > 0 || !!proposed.body?.trim()) && proposed.solutions.length <= 50
    && proposed.solutions.every(item => typeof item.id === 'string' && typeof item.text === 'string' && (item.context === undefined || typeof item.context === 'string') && (item.verified === undefined || typeof item.verified === 'boolean'))
    && new Set(proposed.solutions.map(item => item.id)).size === proposed.solutions.length
    && Array.isArray(proposed.ticketIds) && proposed.ticketIds.every(id => typeof id === 'string')
    && (proposed.tags === undefined || (Array.isArray(proposed.tags) && proposed.tags.every(tag => typeof tag === 'string')))
  const publicRequest = row => ({ id: row.id, articleId: row.article_id, requesterId: row.requester_id, createdAt: row.created_at, status: row.status, reviewedAt: row.reviewed_at ?? undefined, reviewerId: row.reviewer_id ?? undefined, proposed: JSON.parse(row.proposed_payload) })
  const publicClaim = row => ({ id: row.id, kind: row.kind, resourceId: row.resource_id, requesterId: row.requester_id, status: row.status, createdAt: row.created_at, reviewedAt: row.reviewed_at ?? undefined, reviewerId: row.reviewer_id ?? undefined })
  const isActiveProfile = id => !!db.prepare('SELECT 1 FROM profiles WHERE id=? AND archived=0 AND deleted=0').get(id)

  return {
    workspace: read,
    deleteArticle(id, actor, expectedUpdatedAt) {
      return transaction(() => {
        const state = read()
        const index = state.data.articles.findIndex(item => item.id === id)
        if (index < 0) throw failure(404, 'Artigo não encontrado.')
        const article = state.data.articles[index]
        if (!isAdmin(actor) && articleOwner(article) !== actor) throw failure(403, 'Somente o responsável ou o administrador pode excluir este artigo.')
        if ((article.updatedAt ?? null) !== expectedUpdatedAt) throw failure(409, 'Este artigo foi alterado em outro computador. Atualize a página antes de excluí-lo.')
        state.data.articles.splice(index, 1)
        clearArticleLinks(id)
        persist(state.revision + 1, state.data)
        return { ok: true, revision: state.revision + 1 }
      })
    },
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
            if (key === 'articles') {
              if (entry.after && !validProposal(existing ?? entry.after, entry.after)) throw failure(400, 'Guia inválido.')
              if (!existing && entry.after && !isAdmin(actor) && entry.after.authorId !== actor) throw failure(403, 'O criador do guia deve ser o perfil ativo.')
              if (existing && (!isAdmin(actor) && articleOwner(existing) !== actor)) throw failure(403, 'Envie uma sugestão de edição ao criador deste guia.')
              if (existing && entry.after && articleOwner(entry.after) !== articleOwner(existing)) throw failure(403, 'O responsável pelo guia não pode ser alterado por esta ação.')
              if (existing && entry.after && entry.after.authorId !== existing.authorId) throw failure(403, 'A autoria original do guia não pode ser alterada.')
              if (!existing && entry.after && !isAdmin(actor) && articleOwner(entry.after) !== actor) throw failure(403, 'O responsável inicial deve ser o perfil ativo.')
            }
            if ((key === 'sessions' || key === 'plans') && entry.after && !isAdmin(actor) && entry.after.technicianId !== actor) throw failure(403, 'Registro de trabalho de outro técnico não permitido.')
            if ((key === 'sessions' || key === 'plans') && existing && !isAdmin(actor) && existing.technicianId !== actor) throw failure(403, 'Registro de trabalho de outro técnico não permitido.')
            if ((key === 'sessions' || key === 'plans') && entry.after && key === 'sessions') {
              const linked = data.tickets.find(ticket => ticket.id === entry.after.ticketId)
              if (!linked || !canEditTicket(linked, actor)) throw failure(403, 'Você não pode registrar trabalho neste chamado.')
            }
            if (key === 'tickets' && !entry.after && !isAdmin(actor)) throw failure(403, 'Somente o administrador pode excluir chamados.')
            if (entry.after === null) { data[key].splice(index, 1); if (key === 'articles') clearArticleLinks(id) }
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
    deleteProfile(id) {
      if (isAdmin(id)) throw failure(403, 'O administrador atual é necessário para revisar solicitações.')
      return transaction(() => {
        const profile = db.prepare('SELECT id,deleted FROM profiles WHERE id=?').get(id)
        if (!profile || profile.deleted) throw failure(404, 'Perfil não encontrado.')
        const state = read(), now = new Date().toISOString()
        let changed = false
        const orphanedArticles = []
        state.data.articles = state.data.articles.map(article => {
          if (articleOwner(article) !== id) return article
          changed = true
          orphanedArticles.push(article.id)
          return { ...article, ownerId: null, history: [...(article.history ?? []), { id: randomUUID(), at: now, authorId: 'central-ti-administrador', action: 'Artigo ficou sem responsável após exclusão do perfil' }] }
        })
        state.data.tickets = state.data.tickets.map(ticket => {
          if (ticket.ownerId !== id || ['Concluído', 'Cancelado'].includes(ticket.status)) return ticket
          const successor = ticket.participants?.find(item => isActiveProfile(item.technicianId) && item.technicianId !== id)
          changed = true
          return { ...ticket, createdById: ticket.createdById ?? id, ownerId: successor?.technicianId ?? '', participants: successor ? ticket.participants.filter(item => item.technicianId !== successor.technicianId) : ticket.participants, progress: [...(ticket.progress ?? []), { id: randomUUID(), at: now, authorId: 'central-ti-administrador', kind: 'owner', text: successor ? 'Responsabilidade transferida após exclusão do perfil anterior.' : 'Responsável excluído. Chamado aguardando nova responsabilidade.' }] }
        })
        if (state.data.kanbanBoards?.[id]) { delete state.data.kanbanBoards[id]; changed = true }
        if (changed) persist(state.revision + 1, state.data)
        db.prepare('UPDATE profiles SET archived=1,deleted=1,notes=?,photo_data_url=NULL,password_salt=NULL,password_hash=NULL,setup_salt=NULL,setup_hash=NULL WHERE id=?').run('', id)
        db.prepare('DELETE FROM sessions WHERE profile_id=?').run(id)
        db.prepare('DELETE FROM knowledge_favorites WHERE profile_id=?').run(id)
        for (const articleId of orphanedArticles) db.prepare("UPDATE knowledge_edit_requests SET status='rejected',reviewed_at=?,reviewer_id=? WHERE article_id=? AND status='pending'").run(now, 'central-ti-administrador', articleId)
        db.prepare("UPDATE ownership_claims SET status='rejected',reviewed_at=?,reviewer_id=? WHERE requester_id=? AND status='pending'").run(now, 'central-ti-administrador', id)
        return { ok: true, revision: changed ? state.revision + 1 : state.revision }
      })
    },
    ownershipClaims(actor) {
      const rows = isAdmin(actor)
        ? db.prepare("SELECT * FROM ownership_claims WHERE status='pending' ORDER BY created_at").all()
        : db.prepare('SELECT * FROM ownership_claims WHERE requester_id=? ORDER BY created_at DESC').all(actor)
      return rows.map(publicClaim)
    },
    submitOwnershipClaim(kind, resourceId, actor) {
      return transaction(() => {
        if (!['article', 'ticket'].includes(kind) || typeof resourceId !== 'string') throw failure(400, 'Solicitação inválida.')
        if (!isActiveProfile(actor)) throw failure(403, 'Perfil indisponível.')
        const data = read().data
        const available = kind === 'article'
          ? data.articles.some(article => article.id === resourceId && articleOwner(article) === null)
          : data.tickets.some(ticket => ticket.id === resourceId && !ticket.ownerId && !['Concluído', 'Cancelado'].includes(ticket.status))
        if (!available) throw failure(409, 'Este registro já possui responsável ou não está disponível.')
        if (db.prepare("SELECT 1 FROM ownership_claims WHERE kind=? AND resource_id=? AND requester_id=? AND status='pending'").get(kind, resourceId, actor)) throw failure(409, 'Você já enviou uma solicitação para este registro.')
        const id = randomUUID(), at = new Date().toISOString()
        db.prepare('INSERT INTO ownership_claims (id,kind,resource_id,requester_id,status,created_at) VALUES (?,?,?,?,?,?)').run(id, kind, resourceId, actor, 'pending', at)
        return { id, kind, resourceId, requesterId: actor, status: 'pending', createdAt: at }
      })
    },
    resolveOwnershipClaim(id, actor, approve) {
      if (!isAdmin(actor)) throw failure(403, 'Somente o administrador pode analisar solicitações.')
      return transaction(() => {
        const row = db.prepare('SELECT * FROM ownership_claims WHERE id=?').get(id)
        if (!row || row.status !== 'pending') throw failure(409, 'Solicitação não está pendente.')
        const state = read(), now = new Date().toISOString()
        if (approve) {
          if (!isActiveProfile(row.requester_id)) throw failure(409, 'O perfil solicitante não está ativo.')
          if (row.kind === 'article') {
            const article = state.data.articles.find(item => item.id === row.resource_id)
            if (!article || articleOwner(article) !== null) throw failure(409, 'Este artigo já possui responsável.')
            article.ownerId = row.requester_id
            article.history = [...(article.history ?? []), { id: randomUUID(), at: now, authorId: actor, action: 'Responsabilidade do artigo atribuída' }]
          } else {
            const ticket = state.data.tickets.find(item => item.id === row.resource_id)
            if (!ticket || ticket.ownerId || ['Concluído', 'Cancelado'].includes(ticket.status)) throw failure(409, 'Este chamado não está disponível.')
            ticket.ownerId = row.requester_id
            ticket.participants = (ticket.participants ?? []).filter(item => item.technicianId !== row.requester_id)
            ticket.progress = [...(ticket.progress ?? []), { id: randomUUID(), at: now, authorId: actor, kind: 'owner', text: 'Nova responsabilidade aprovada pelo administrador.' }]
          }
          persist(state.revision + 1, state.data)
          db.prepare("UPDATE ownership_claims SET status='rejected',reviewed_at=?,reviewer_id=? WHERE kind=? AND resource_id=? AND status='pending' AND id<>?").run(now, actor, row.kind, row.resource_id, id)
        }
        db.prepare('UPDATE ownership_claims SET status=?,reviewed_at=?,reviewer_id=? WHERE id=?').run(approve ? 'approved' : 'rejected', now, actor, id)
        return { approved: approve, revision: approve ? state.revision + 1 : state.revision }
      })
    },
    favoriteArticles(actor) { return db.prepare('SELECT article_id FROM knowledge_favorites WHERE profile_id=? ORDER BY article_id').all(actor).map(row => row.article_id) },
    setArticleFavorite(actor, articleId, favorite) {
      const article = read().data.articles.find(item => item.id === articleId)
      if (!article) throw failure(404, 'Guia não encontrado.')
      if (favorite) db.prepare('INSERT OR IGNORE INTO knowledge_favorites (profile_id,article_id) VALUES (?,?)').run(actor, articleId)
      else db.prepare('DELETE FROM knowledge_favorites WHERE profile_id=? AND article_id=?').run(actor, articleId)
      return this.favoriteArticles(actor)
    },
    articleRequests(articleId, actor) {
      const article = read().data.articles.find(item => item.id === articleId)
      if (!article) throw failure(404, 'Guia não encontrado.')
      const rows = db.prepare('SELECT * FROM knowledge_edit_requests WHERE article_id=? ORDER BY created_at DESC').all(articleId)
      return rows.filter(row => isAdmin(actor) || articleOwner(article) === actor || row.requester_id === actor).map(publicRequest)
    },
    submitArticleRequest(articleId, actor, proposed) {
      return transaction(() => {
        const article = read().data.articles.find(item => item.id === articleId)
        if (!article) throw failure(404, 'Guia não encontrado.')
        if (isAdmin(actor) || articleOwner(article) === actor) throw failure(400, 'Você pode editar este guia diretamente.')
        if (!validProposal(article, proposed)) throw failure(400, 'Sugestão inválida.')
        if (same(articleContent(article), articleContent(proposed))) throw failure(400, 'A sugestão não altera o guia.')
        if (db.prepare("SELECT 1 FROM knowledge_edit_requests WHERE article_id=? AND requester_id=? AND status='pending'").get(articleId, actor)) throw failure(409, 'Você já tem uma sugestão aguardando análise neste guia.')
        const id = randomUUID(), at = new Date().toISOString()
        db.prepare('INSERT INTO knowledge_edit_requests (id,article_id,requester_id,created_at,status,base_payload,proposed_payload) VALUES (?,?,?,?,?,?,?)').run(id, articleId, actor, at, 'pending', JSON.stringify(articleContent(article)), JSON.stringify(articleContent(proposed)))
        return { id, articleId, requesterId: actor, createdAt: at, status: 'pending', proposed: articleContent(proposed) }
      })
    },
    resolveArticleRequest(articleId, requestId, actor, approve) {
      return transaction(() => {
        const state = read(), article = state.data.articles.find(item => item.id === articleId)
        const row = db.prepare('SELECT * FROM knowledge_edit_requests WHERE id=? AND article_id=?').get(requestId, articleId)
        if (!article || !row) throw failure(404, 'Sugestão não encontrada.')
        if (!isAdmin(actor) && articleOwner(article) !== actor) throw failure(403, 'Somente o criador pode analisar esta sugestão.')
        if (row.status !== 'pending') throw failure(409, 'Esta sugestão já foi analisada.')
        const now = new Date().toISOString()
        if (approve) {
          if (!same(articleContent(article), JSON.parse(row.base_payload))) throw failure(409, 'O guia mudou desde a sugestão. Peça uma nova proposta.')
          const proposed = JSON.parse(row.proposed_payload)
          const oldSolutions = new Map(article.solutions.map(item => [item.id, item]))
          const next = { ...article, ...proposed, solutions: proposed.solutions.map(item => oldSolutions.has(item.id) ? { ...oldSolutions.get(item.id), ...item } : { ...item, authorId: row.requester_id, addedAt: now }), authorId: article.authorId, createdAt: article.createdAt, updatedAt: now, updatedById: row.requester_id, history: [...(article.history ?? []), { id: randomUUID(), at: now, authorId: row.requester_id, action: 'Sugestão de edição aprovada' }] }
          state.data.articles = state.data.articles.map(item => item.id === articleId ? next : item)
          persist(state.revision + 1, state.data)
        }
        db.prepare('UPDATE knowledge_edit_requests SET status=?,reviewed_at=?,reviewer_id=? WHERE id=?').run(approve ? 'approved' : 'rejected', now, actor, requestId)
        return { approved: approve, revision: approve ? state.revision + 1 : state.revision }
      })
    },
    articleContributionCount(actor) { return db.prepare("SELECT COUNT(*) AS count FROM knowledge_edit_requests WHERE requester_id=? AND status='approved'").get(actor).count },
    articleContributionCounts() { return Object.fromEntries(db.prepare("SELECT requester_id, COUNT(*) AS count FROM knowledge_edit_requests WHERE status='approved' GROUP BY requester_id").all().map(row => [row.requester_id, row.count])) },
    articleContributionEvents() { return db.prepare("SELECT requester_id AS technicianId, reviewed_at AS at FROM knowledge_edit_requests WHERE status='approved' AND reviewed_at IS NOT NULL ORDER BY reviewed_at").all() },
  }
}

