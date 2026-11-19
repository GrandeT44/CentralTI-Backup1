import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { openStore, ADMIN_ID } from './store.mjs'

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' }
const json = (response, status, value) => { response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); response.end(JSON.stringify(value)) }
const cookieToken = request => request.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith('central_ti_session='))?.slice('central_ti_session='.length)
const sessionCookie = (token, secure = false) => `central_ti_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secure ? '; Secure' : ''}`
const readBody = async (request, maxLength = 1_500_000) => {
  if (!request.headers['content-type']?.startsWith('application/json')) throw new Error('Envie JSON.')
  let input = ''
  for await (const chunk of request) { input += chunk; if (input.length > maxLength) throw Object.assign(new Error('Conteúdo muito grande.'), { status: 413 }) }
  return JSON.parse(input || '{}')
}
const validPassword = value => typeof value === 'string' && value.length >= 10 && value.length <= 128
const validName = value => typeof value === 'string' && value.trim().length >= 2 && value.trim().length <= 100
const acceptedOrigin = (origin, host, allowDevelopmentOrigin) => {
  if (!origin) return true
  try {
    const parsed = new URL(origin)
    if (parsed.host === host) return true
    return allowDevelopmentOrigin && parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname) && /^(localhost|127\.0\.0\.1):\d+$/.test(host)
  } catch { return false }
}

export function createAppServer({ dbPath, staticDir = resolve('dist'), serveStatic = true, allowDevelopmentOrigin = false } = {}) {
  const store = openStore(dbPath)
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
    const path = url.pathname
    try {
      if (path.startsWith('/api/')) {
        if (!['GET', 'HEAD'].includes(request.method)) {
          if (request.headers['x-requested-with'] !== 'CentralTI') return json(response, 403, { error: 'Requisição não autorizada.' })
          const origin = request.headers.origin
          if (!acceptedOrigin(origin, request.headers.host, allowDevelopmentOrigin)) return json(response, 403, { error: 'Origem não autorizada.' })
        }
        const token = cookieToken(request)
        const current = store.sessionProfile(token)
        const secure = request.socket.encrypted || request.headers['x-forwarded-proto'] === 'https'
        if (request.method === 'GET' && path === '/api/health') return json(response, 200, { ok: true })
        if (request.method === 'GET' && path === '/api/profiles') return json(response, 200, { profiles: store.listProfiles(!!current) })
        if (request.method === 'GET' && path === '/api/session') return current ? json(response, 200, { profile: store.publicProfile(current), notes: store.notes(current.id) }) : json(response, 401, { error: 'Entre no seu perfil.' })
        if (request.method === 'POST' && path === '/api/login') {
          const body = await readBody(request)
          const next = typeof body.id === 'string' && typeof body.password === 'string' ? store.login(body.id, body.password) : null
          if (!next) return json(response, 401, { error: 'Perfil ou senha incorretos.' })
          response.setHeader('Set-Cookie', sessionCookie(next, secure))
          return json(response, 200, { profile: store.publicProfile(store.sessionProfile(next)), notes: store.notes(body.id) })
        }
        if (request.method === 'POST' && path === '/api/setup') {
          const body = await readBody(request)
          if (!validPassword(body.password)) return json(response, 400, { error: 'Use uma senha de 10 a 128 caracteres.' })
          const next = typeof body.id === 'string' && typeof body.code === 'string' ? store.setup(body.id, body.code, body.password) : null
          if (!next) return json(response, 401, { error: 'Código de primeiro acesso inválido ou já usado.' })
          response.setHeader('Set-Cookie', sessionCookie(next, secure))
          return json(response, 200, { profile: store.publicProfile(store.sessionProfile(next)), notes: store.notes(body.id) })
        }
        if (request.method === 'POST' && path === '/api/logout') { store.destroySession(token); response.setHeader('Set-Cookie', sessionCookie('', secure).replace('Max-Age=28800', 'Max-Age=0')); return json(response, 200, { ok: true }) }
        if (!current) return json(response, 401, { error: 'Entre no seu perfil.' })
        if (request.method === 'GET' && path === '/api/workspace') {
          const workspace = store.workspace()
          return json(response, 200, url.searchParams.get('since') === String(workspace.revision) ? { revision: workspace.revision, unchanged: true } : workspace)
        }
        if (request.method === 'POST' && path === '/api/workspace/changes') {
          const body = await readBody(request, 20_000_000)
          return json(response, 200, store.applyWorkspaceChanges(body.changes, current.id))
        }
        if (path === '/api/ownership-claims') {
          if (request.method === 'GET') return json(response, 200, { claims: store.ownershipClaims(current.id) })
          if (request.method === 'POST') { const body = await readBody(request); return json(response, 201, { claim: store.submitOwnershipClaim(body.kind, body.resourceId, current.id) }) }
        }
        if (request.method === 'GET' && path === '/api/me/favorites') return json(response, 200, { ids: store.favoriteArticles(current.id) })
        if (request.method === 'GET' && path === '/api/me/knowledge-contributions') return json(response, 200, { count: store.articleContributionCount(current.id) })
        if (request.method === 'GET' && path === '/api/reports/knowledge-contributions') return json(response, 200, { counts: store.articleContributionCounts(), events: store.articleContributionEvents() })
        const articleDeleteMatch = path.match(/^\/api\/knowledge\/([^/]+)$/)
        if (articleDeleteMatch && request.method === 'DELETE') {
          const body = await readBody(request)
          return json(response, 200, store.deleteArticle(articleDeleteMatch[1], current.id, body.expectedUpdatedAt ?? null))
        }
        const favoriteMatch = path.match(/^\/api\/knowledge\/([^/]+)\/favorite$/)
        if (favoriteMatch && request.method === 'PUT') {
          const body = await readBody(request)
          if (typeof body.favorite !== 'boolean') return json(response, 400, { error: 'Estado do favorito inválido.' })
          return json(response, 200, { ids: store.setArticleFavorite(current.id, favoriteMatch[1], body.favorite) })
        }
        const requestMatch = path.match(/^\/api\/knowledge\/([^/]+)\/requests(?:\/([^/]+)\/(approve|reject))?$/)
        if (requestMatch) {
          const [, articleId, requestId, action] = requestMatch
          if (!requestId && request.method === 'GET') return json(response, 200, { requests: store.articleRequests(articleId, current.id) })
          if (!requestId && request.method === 'POST') { const body = await readBody(request, 20_000_000); return json(response, 201, { request: store.submitArticleRequest(articleId, current.id, body.proposed) }) }
          if (requestId && request.method === 'POST') return json(response, 200, store.resolveArticleRequest(articleId, requestId, current.id, action === 'approve'))
        }
        if (request.method === 'PUT' && path === '/api/me/notes') {
          const body = await readBody(request)
          if (typeof body.notes !== 'string' || body.notes.length > 200_000) return json(response, 400, { error: 'As notas excedem o limite permitido.' })
          store.saveNotes(current.id, body.notes)
          return json(response, 200, { notes: body.notes })
        }
        if (request.method === 'PATCH' && path === '/api/me/profile') {
          const body = await readBody(request)
          if (typeof body.photoDataUrl !== 'string' || body.photoDataUrl.length > 750_000 || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(body.photoDataUrl)) return json(response, 400, { error: 'Foto inválida ou muito grande.' })
          store.savePhoto(current.id, body.photoDataUrl)
          return json(response, 200, { profile: store.publicProfile(store.profile(current.id)) })
        }
        if (current.id !== ADMIN_ID) return json(response, 403, { error: 'Acesso exclusivo do administrador.' })
        const claimMatch = path.match(/^\/api\/admin\/ownership-claims\/([\w-]+)\/(approve|reject)$/)
        if (claimMatch && request.method === 'POST') return json(response, 200, store.resolveOwnershipClaim(claimMatch[1], current.id, claimMatch[2] === 'approve'))
        if (request.method === 'POST' && path === '/api/admin/profiles') {
          const body = await readBody(request)
          if (!validName(body.name) || (body.role !== undefined && typeof body.role !== 'string')) return json(response, 400, { error: 'Informe um nome válido.' })
          if (store.listProfiles(true).some(item => !item.deleted && item.name.toLocaleLowerCase('pt-BR') === body.name.trim().toLocaleLowerCase('pt-BR'))) return json(response, 409, { error: 'Já existe um perfil com esse nome.' })
          return json(response, 201, store.createProfile(body.name.trim(), body.role?.trim() || 'Técnico de TI'))
        }
        const match = path.match(/^\/api\/admin\/profiles\/([\w-]+)(?:\/(code|password|restore))?$/)
        if (match) {
          const [, id, action] = match
          const profile = store.profile(id)
          if (!profile || profile.deleted || id === ADMIN_ID) return json(response, 403, { error: 'Perfil indisponível para esta operação.' })
          if (request.method === 'POST' && action === 'code') return profile.password_hash ? json(response, 409, { error: 'Este perfil já tem senha. Use Redefinir senha.' }) : json(response, 200, { code: store.issueSetupCode(id) })
          if (request.method === 'POST' && action === 'password') { const body = await readBody(request); if (!validPassword(body.password)) return json(response, 400, { error: 'Use uma senha de 10 a 128 caracteres.' }); store.resetPassword(id, body.password); return json(response, 200, { ok: true }) }
          if (request.method === 'POST' && action === 'restore') { store.restore(id); return json(response, 200, { ok: true }) }
          if (request.method === 'DELETE' && !action) return json(response, 200, store.deleteProfile(id))
        }
        return json(response, 404, { error: 'Recurso não encontrado.' })
      }
      if (!serveStatic || !['GET', 'HEAD'].includes(request.method)) return json(response, 404, { error: 'Recurso não encontrado.' })
      const requested = path === '/' ? '/index.html' : path
      const file = resolve(staticDir, `.${requested}`)
      if (file !== staticDir && !file.startsWith(staticDir + sep)) return json(response, 403, { error: 'Acesso negado.' })
      let target = file
      try { if (!(await stat(target)).isFile()) target = resolve(staticDir, 'index.html') } catch { target = resolve(staticDir, 'index.html') }
      response.writeHead(200, { 'Content-Type': mime[extname(target)] ?? 'application/octet-stream', 'Cache-Control': target.endsWith('index.html') ? 'no-store' : 'public, max-age=31536000, immutable' })
      response.end(await readFile(target))
    } catch (error) {
      json(response, error instanceof SyntaxError ? 400 : error.status ?? 500, { error: error instanceof SyntaxError ? 'JSON inválido.' : error.message ?? 'Erro interno.' })
    }
  })
  server.on('close', () => store.close())
  return { server, store }
}
