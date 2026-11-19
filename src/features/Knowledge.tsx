import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Cpu, FileText, FolderOpen, KeyRound, Layers3, Lightbulb, Monitor, Network, Plus, Printer, Search, ShieldCheck, Star, Trash2, TriangleAlert, X } from 'lucide-react'
import type { Data, KnowledgeArticle } from '../domain'
import { articleDate, filterArticles, type ArticleOrder } from './knowledgeLibrary'
import { KnowledgeMarkdown } from './KnowledgeMarkdown'
import { TechnicianAvatar } from '../components/TechnicianAvatar'
import { knowledgeRepository } from '../repository'
import { ADMIN_ID } from './administrator'
import { KnowledgeCommunity, KnowledgeRequestsSidebar } from './KnowledgeCommunity'
import { ActionToast } from '../components/ActionToast'
import { OwnershipClaimButton } from '../components/OwnershipClaimButton'
import './Knowledge.css'
import './KnowledgeDelete.css'
import './KnowledgeCompact.css'

type Props = { data: Data; save: (data: Data) => void; active: string; refreshWorkspace?: () => Promise<void> }
const categoryIcons: Record<string, typeof FolderOpen> = { Hardware: Cpu, Sistemas: Monitor, Periféricos: Printer, Rede: Network, Acessos: KeyRound, Segurança: ShieldCheck, Outros: Layers3 }
function FavoriteButton({ article, favorite, toggle }: { article: KnowledgeArticle; favorite: boolean; toggle: (id: string, next: boolean) => void }) {
  return <button type="button" className={favorite ? 'knowledge-favorite is-favorite' : 'knowledge-favorite'} aria-label={`${favorite ? 'Remover' : 'Adicionar'} ${article.title} ${favorite ? 'dos' : 'aos'} favoritos`} aria-pressed={favorite} title={favorite ? 'Remover dos favoritos' : 'Favoritar guia'} onClick={() => toggle(article.id, !favorite)}><Star size={17} fill={favorite ? 'currentColor' : 'none'} /></button>
}

export function Knowledge({ data, active }: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const [deletedNotice, setDeletedNotice] = useState(!!location.state?.deleted)
  useEffect(() => { if (location.state?.deleted) navigate(`${location.pathname}${location.search}${location.hash}`, { replace: true, state: null }) }, [location, navigate])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas')
  const [order, setOrder] = useState<ArticleOrder>('recent')
  const [favorites, setFavorites] = useState<string[]>([])
  const [favoriteError, setFavoriteError] = useState('')
  useEffect(() => { let alive = true; const refresh = () => { void knowledgeRepository.favorites().then(result => { if (alive) { setFavorites(result.ids); setFavoriteError('') } }).catch(() => { if (alive) setFavoriteError('Não foi possível carregar seus favoritos.') }) }; refresh(); const timer = window.setInterval(refresh, 5000); return () => { alive = false; window.clearInterval(timer) } }, [active])
  const toggleFavorite = (id: string, favorite: boolean) => { void knowledgeRepository.favorite(id, favorite).then(result => { setFavorites(result.ids); setFavoriteError('') }).catch(cause => setFavoriteError(cause instanceof Error ? cause.message : 'Não foi possível atualizar o favorito.')) }
  const items = filterArticles(data.articles, query, category === 'Favoritados' ? 'Todas' : category, order).filter(item => category !== 'Favoritados' || favorites.includes(item.id))
  const favoriteArticles = favorites.map(id => data.articles.find(item => item.id === id)).filter(item => item !== undefined)
  const categories = [...new Set(data.articles.map(item => item.category))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  return <div className="knowledge-page workspace-page-enter">{deletedNotice && <ActionToast title="Artigo excluído" detail="O guia foi removido da base de conhecimento." onClose={() => setDeletedNotice(false)} />}<header className="knowledge-hero workspace-page-hero"><div><span className="workspace-page-eyebrow">ESPAÇO DE TRABALHO / CONHECIMENTO</span><h1>Conhecimento<span>.</span></h1><p>Respostas que ficam. Documentação técnica para apoiar cada atendimento.</p></div><Link className="button primary" to="/conhecimento/novo"><Plus size={18} /> Novo artigo</Link></header>
    <div className="knowledge-toolbar"><label><Search size={19} /><input aria-label="Pesquisar artigos" placeholder="Buscar problema, sintoma, solução ou palavra-chave" value={query} onChange={event => setQuery(event.target.value)} /></label><select aria-label="Ordenar artigos" value={order} onChange={event => setOrder(event.target.value as ArticleOrder)}><option value="recent">Atualizações recentes</option><option value="alphabetical">Ordem alfabética</option></select></div>
    <div className="knowledge-categories" role="group" aria-label="Filtrar por categoria"><button type="button" className={category === 'Todas' ? 'selected' : ''} aria-pressed={category === 'Todas'} onClick={() => setCategory('Todas')}><FolderOpen size={15} /> Todas <span>{data.articles.length}</span></button><button type="button" className={category === 'Favoritados' ? 'selected' : ''} aria-pressed={category === 'Favoritados'} onClick={() => setCategory('Favoritados')}><Star size={15} /> Favoritados <span>{favoriteArticles.length}</span></button>{categories.map(name => { const Icon = categoryIcons[name] ?? FolderOpen; return <button type="button" key={name} className={category === name ? 'selected' : ''} aria-pressed={category === name} onClick={() => setCategory(name)}><Icon size={15} />{name}<span>{data.articles.filter(item => item.category === name).length}</span></button> })}</div>
    {favoriteArticles.length > 0 && category !== 'Favoritados' && <div className="knowledge-favorites-strip"><span><Star size={15} fill="currentColor" /> Seus favoritos</span><div>{favoriteArticles.slice(0, 3).map(item => <Link key={item.id} to={`/conhecimento/${item.id}`}>{item.title}</Link>)}</div><button type="button" onClick={() => setCategory('Favoritados')}>Ver todos</button></div>}
    {favoriteError && <p className="knowledge-error" role="alert">{favoriteError}</p>}
    <div className="knowledge-results"><span>{items.length} artigo{items.length === 1 ? '' : 's'} encontrado{items.length === 1 ? '' : 's'}</span></div>
    {items.length ? <div className="knowledge-list">{items.map(item => {
      const creator = data.technicians.find(person => person.id === item.authorId)
      const currentOwner = item.ownerId === null ? undefined : data.technicians.find(person => person.id === (item.ownerId ?? item.authorId))
      return <article className="knowledge-card" key={item.id}>
        <Link className="knowledge-card-link" to={`/conhecimento/${item.id}`}><span className="knowledge-card-icon"><FileText size={19} /></span><span className="knowledge-card-content"><small>{item.category}{item.tags?.length ? ` · ${item.tags.slice(0, 3).join(' · ')}` : ''}</small><strong title={item.title}>{item.title}</strong>{item.ownerId === null && <b className="knowledge-orphan-tag">Sem responsável pelo artigo</b>}<span>{item.body?.replace(/[#*`![\]()]/g, '').slice(0, 160) || item.symptoms || item.procedures || item.solutions[0]?.text || 'Sem resumo documentado.'}</span><em>{item.body ? 'Guia técnico' : `${item.solutions.length} solução${item.solutions.length === 1 ? '' : 'ões'}`} · {item.ticketIds.length} chamado{item.ticketIds.length === 1 ? '' : 's'}{(item.updatedAt || item.createdAt) && ` · ${articleDate(item.updatedAt ?? item.createdAt)}`}</em></span><ArrowRight size={17} /></Link>
        <div className="knowledge-card-side"><div className="knowledge-card-people"><span className="knowledge-card-person"><TechnicianAvatar technician={creator} /><span><small>CRIADO POR</small><strong>{creator?.name ?? 'Autoria não registrada'}</strong></span></span><span className="knowledge-card-person"><TechnicianAvatar technician={currentOwner} /><span><small>RESPONSÁVEL ATUAL</small><strong>{currentOwner?.name ?? (item.ownerId === null ? 'Sem responsável' : 'Não registrado')}</strong></span></span></div><FavoriteButton article={item} favorite={favorites.includes(item.id)} toggle={toggleFavorite} /></div>
      </article>
    })}</div> : <div className="knowledge-empty"><Lightbulb size={28} /><h2>{category === 'Favoritados' ? 'Nenhum guia favorito' : data.articles.length ? 'Nenhum artigo encontrado' : 'Comece a base de conhecimento'}</h2><p>{category === 'Favoritados' ? 'Use a estrela de um guia para guardá-lo aqui.' : data.articles.length ? 'Experimente outros termos ou escolha outra categoria.' : 'O primeiro artigo já pode ajudar a resolver um chamado semelhante.'}</p>{!data.articles.length && <Link className="button primary" to="/conhecimento/novo"><Plus size={16} /> Criar primeiro artigo</Link>}</div>}
  </div>
}

function nameFor(data: Data, id?: string) { return id ? data.technicians.find(item => item.id === id)?.name : undefined }
function Related({ data, article, active }: { data: Data; article: KnowledgeArticle; active: string }) {
  const tickets = [...new Set(article.ticketIds ?? [])].map(id => data.tickets.find(item => item.id === id)).filter(item => item !== undefined)
  return <aside><h2>Chamados relacionados</h2>{tickets.length ? tickets.map(ticket => <Link key={ticket.id} to={`/chamados/${ticket.id}`}><small>{ticket.id}</small><span>{ticket.title}</span><ArrowRight size={15} /></Link>) : <p>Nenhum chamado vinculado ainda.</p>}<KnowledgeRequestsSidebar article={article} data={data} active={active} />{article.history?.length ? <div className="knowledge-history"><h2>Alterações recentes</h2>{article.history.slice(-5).reverse().map(entry => <p key={entry.id}><strong>{entry.action}</strong><small>{nameFor(data, entry.authorId) ?? 'Técnico'} · {articleDate(entry.at)}</small></p>)}</div> : null}</aside>
}

export function Article({ data, active, refreshWorkspace }: Props) {
  const { articleId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [toast, setToast] = useState<'saved' | 'requested' | null>(() => location.state?.requested ? 'requested' : location.state?.saved ? 'saved' : null)
  useEffect(() => { if (location.state?.saved || location.state?.requested) navigate(`${location.pathname}${location.search}${location.hash}`, { replace: true, state: null }) }, [location, navigate])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const deleteDialog = useRef<HTMLDivElement>(null)
  const deleteTrigger = useRef<HTMLButtonElement>(null)
  const article = data.articles.find(item => item.id === articleId)
  useEffect(() => {
    if (!confirmDelete || !article) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focus = requestAnimationFrame(() => deleteDialog.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus())
    return () => { cancelAnimationFrame(focus); document.body.style.overflow = previous }
  }, [confirmDelete, article])
  if (!article) return <div className="knowledge-page knowledge-empty"><h1>Artigo não encontrado</h1><Link className="button" to="/conhecimento">Voltar à base</Link></div>
  const date = articleDate(article.updatedAt ?? article.createdAt)
  const orphan = article.ownerId === null
  const canEdit = active === ADMIN_ID || (!orphan && active === (article.ownerId ?? article.authorId ?? ADMIN_ID))
  const closeDelete = () => { if (deleting) return; setConfirmDelete(false); requestAnimationFrame(() => deleteTrigger.current?.focus()) }
  const onDeleteKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') { event.stopPropagation(); closeDelete() }
    if (event.key !== 'Tab' || !deleteDialog.current) return
    const buttons = [...deleteDialog.current.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
    if (event.shiftKey && index <= 0) { event.preventDefault(); buttons.at(-1)?.focus() }
    else if (!event.shiftKey && index === buttons.length - 1) { event.preventDefault(); buttons[0]?.focus() }
  }
  const deleteArticle = async () => {
    setDeleting(true); setDeleteError('')
    try {
      await knowledgeRepository.deleteArticle(article.id, article.updatedAt ?? null)
      try { await refreshWorkspace?.() } catch { /* A sincronização periódica atualizará a lista. */ }
      navigate('/conhecimento', { replace: true, state: { deleted: true } })
    } catch (cause) { setDeleteError(cause instanceof Error ? cause.message : 'Não foi possível excluir o artigo.'); setDeleting(false) }
  }
  return <div className="knowledge-page knowledge-detail"><Link className="knowledge-back" to="/conhecimento"><ArrowLeft size={16} /> Base de conhecimento</Link>{toast && <ActionToast title={toast === 'requested' ? 'Sugestão enviada' : 'Guia salvo'} detail={toast === 'requested' ? 'O criador do guia pode revisar sua proposta.' : 'O artigo está disponível para a equipe.'} onClose={() => setToast(null)} />}<header><div><span className="knowledge-kicker">{article.category}</span><h1>{article.title}</h1>{orphan && <span className="knowledge-orphan-banner">Sem responsável pelo artigo</span>}<div className="knowledge-meta">{article.tags?.map(tag => <span key={tag}>#{tag}</span>)}{date && <span>Atualizado em {date}</span>}{nameFor(data, article.updatedById ?? article.authorId) && <span>por {nameFor(data, article.updatedById ?? article.authorId)}</span>}</div></div><div className="knowledge-detail-actions"><Link className="button" to={`/conhecimento/${article.id}/editar`}>{canEdit ? 'Editar guia' : 'Sugerir edição'}</Link>{canEdit && <button ref={deleteTrigger} type="button" className="knowledge-delete-trigger" onClick={() => { setConfirmDelete(true); setDeleteError('') }}><Trash2 size={15} /> Excluir guia</button>}</div></header><KnowledgeCommunity article={article} data={data} active={active} />{orphan && <div className="knowledge-orphan-action"><p>Este guia está sem responsável. Você pode solicitar a responsabilidade; o administrador analisará o pedido.</p><OwnershipClaimButton kind="article" resourceId={article.id} active={active} /></div>}
    {confirmDelete && createPortal(<div className="knowledge-delete-overlay" onMouseDown={event => { if (event.target === event.currentTarget) closeDelete() }}><div ref={deleteDialog} className="knowledge-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="knowledge-delete-title" onKeyDown={onDeleteKeyDown}><div className="knowledge-delete-dialog-head"><span><TriangleAlert size={21} /></span><button type="button" aria-label="Fechar" disabled={deleting} onClick={closeDelete}><X size={17} /></button></div><h2 id="knowledge-delete-title">Excluir este artigo?</h2><p>“{article.title}” será removido da base de conhecimento e deixará de aparecer nas sugestões dos chamados. Esta ação não pode ser desfeita.</p>{deleteError && <p className="knowledge-error" role="alert">{deleteError}</p>}<div className="knowledge-delete-dialog-actions"><button type="button" className="button" disabled={deleting} onClick={closeDelete}>Cancelar</button><button type="button" className="button knowledge-delete-confirm" disabled={deleting} onClick={() => void deleteArticle()}><Trash2 size={15} /> {deleting ? 'Excluindo...' : 'Excluir artigo'}</button></div></div></div>, document.body)}
    <div className="knowledge-detail-grid"><main>{article.body ? <section className="knowledge-unified-body"><KnowledgeMarkdown text={article.body} images={article.images} /></section> : <><section><small>01 / IDENTIFICAR</small><h2>Sintomas e comportamentos</h2>{article.symptoms ? <KnowledgeMarkdown text={article.symptoms} /> : <p>Sintomas ainda não documentados.</p>}</section><section><small>02 / INVESTIGAR</small><h2>Procedimentos de diagnóstico</h2>{article.procedures ? <KnowledgeMarkdown text={article.procedures} /> : <p>Procedimentos ainda não documentados.</p>}</section><section><div className="knowledge-section-heading"><div><small>03 / RESOLVER</small><h2>Soluções documentadas</h2></div><Link className="knowledge-add-solution" to={`/conhecimento/${article.id}/editar?solucao=1`}><Plus size={15} /> Adicionar outra solução</Link></div><div className="knowledge-solution-list">{article.solutions.map((solution, index) => <article key={solution.id} className="knowledge-solution"><span className="knowledge-solution-number">{String(index + 1).padStart(2, '0')}</span><div>{solution.verified && <span className="knowledge-verified">Confirmada em atendimento</span>}<KnowledgeMarkdown text={solution.text} />{solution.context && <div className="knowledge-context"><strong>Quando aplicar</strong><KnowledgeMarkdown text={solution.context} /></div>}{(solution.addedAt || nameFor(data, solution.authorId)) && <small>{nameFor(data, solution.authorId)}{solution.addedAt && ` · ${articleDate(solution.addedAt)}`}</small>}</div></article>)}</div></section>{article.notes && <section><small>04 / COMPLEMENTO</small><h2>Observações</h2><KnowledgeMarkdown text={article.notes} /></section>}</>}</main><Related data={data} article={article} active={active} /></div>
  </div>
}
