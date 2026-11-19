import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import type { Data, KnowledgeArticle } from '../domain'
import { createId } from '../id'
import { articleBody, articleDate, prepareArticle } from './knowledgeLibrary'
import { KnowledgeBodyEditor } from './KnowledgeBodyEditor'
import { knowledgeRepository } from '../repository'
import { ADMIN_ID } from './administrator'
import './Knowledge.css'
import './KnowledgeEditorCounter.css'

type Props = { data: Data; save: (data: Data) => void; active: string }
const categories = ['Hardware', 'Sistemas', 'Periféricos', 'Rede', 'Acessos', 'Segurança', 'Outros']
const blank = (): KnowledgeArticle => ({ id: createId(), title: '', category: categories[0], symptoms: '', procedures: '', solutions: [], body: '', images: [], ticketIds: [] })

function EditorForm({ data, save, active, original, addSolution }: Props & { original?: KnowledgeArticle; addSolution: boolean }) {
  const navigate = useNavigate()
  const [draft, setDraft] = useState<KnowledgeArticle>(() => original ? { ...structuredClone(original), body: `${articleBody(original)}${addSolution ? '\n\n## Nova solução\n' : ''}`, images: original.images ?? [] } : blank())
  const [tags, setTags] = useState(() => (original?.tags ?? []).join(', '))
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [sending, setSending] = useState(false)
  const canEdit = !original || active === ADMIN_ID || (original.ownerId !== null && active === (original.ownerId ?? original.authorId ?? ADMIN_ID))
  const [initial] = useState(() => JSON.stringify({ draft, tags }))
  const dirty = !saved && JSON.stringify({ draft, tags }) !== initial
  useEffect(() => { const unload = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault() }; window.addEventListener('beforeunload', unload); return () => window.removeEventListener('beforeunload', unload) }, [dirty])
  useEffect(() => {
    if (!dirty) return
    const guard = (event: MouseEvent) => {
      const target = event.target
      const link = target instanceof Element ? target.closest('a[href]') : null
      if (link && !window.confirm('Descartar as alterações deste artigo?')) { event.preventDefault(); event.stopPropagation() }
    }
    document.addEventListener('click', guard, true)
    return () => document.removeEventListener('click', guard, true)
  }, [dirty])
  const patch = (change: Partial<KnowledgeArticle>) => setDraft(current => ({ ...current, ...change }))
  const cancel = () => { if (!dirty || window.confirm('Descartar as alterações deste artigo?')) navigate(original ? `/conhecimento/${original.id}` : '/conhecimento') }
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const title = draft.title.trim()
    if (!title || !draft.body?.trim()) { setError('Preencha o título e o conteúdo do guia.'); return }
    if (title.length > 100) { setError('O título do guia deve ter no máximo 100 caracteres.'); return }
    const now = new Date().toISOString()
    const next = prepareArticle(draft, original, tags, active, now)
    if (original && !canEdit) {
      setSending(true)
      try { await knowledgeRepository.submitRequest(original.id, next); setSaved(true); navigate(`/conhecimento/${original.id}`, { state: { requested: true } }) }
      catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível enviar a sugestão.') }
      finally { setSending(false) }
      return
    }
    save({ ...data, articles: original ? data.articles.map(item => item.id === original.id ? next : item) : [...data.articles, next] })
    setSaved(true)
    navigate(`/conhecimento/${next.id}`, { state: { saved: true } })
  }
  const matches = data.tickets.filter(ticket => `${ticket.id} ${ticket.title}`.toLowerCase().includes(query.toLowerCase())).slice(0, 25)
  const author = data.technicians.find(item => item.id === (original?.authorId ?? active))?.name
  const categoryOptions = [...new Set([...categories, draft.category])]
  return <div className="knowledge-page knowledge-editor-page"><button type="button" className="knowledge-back knowledge-back-button" onClick={cancel}><ArrowLeft size={16} /> {original ? 'Voltar ao artigo' : 'Voltar à biblioteca'}</button><header className="knowledge-editor-header"><div><span className="knowledge-kicker">{original && !canEdit ? 'SUGESTÃO DE EDIÇÃO' : original ? 'EDITAR DOCUMENTAÇÃO' : 'NOVO CONHECIMENTO'}</span><h1>{original && !canEdit ? 'Sugerir melhoria' : original ? 'Atualizar artigo' : 'Documentar uma solução'}</h1><p>{canEdit ? 'Escreva para quem precisará resolver o mesmo problema no futuro.' : 'Sua proposta será enviada ao criador do guia para aprovação.'}</p></div></header><form onSubmit={submit} className="knowledge-editor-form"><div className="knowledge-editor-main"><label>Título do guia<input autoFocus required maxLength={100} value={draft.title} onChange={event => patch({ title: event.target.value })} aria-describedby="knowledge-title-counter" placeholder="Ex.: Como resolver falhas de impressão no Windows" /><span id="knowledge-title-counter" className={draft.title.length >= 90 ? 'knowledge-title-counter near-limit' : 'knowledge-title-counter'}>{draft.title.length}/100</span></label><p className="knowledge-editor-intro">Escreva em um único espaço. Organize com títulos, listas, links, comandos e imagens anexadas ao guia.</p><KnowledgeBodyEditor value={draft.body ?? ''} images={draft.images ?? []} onChange={body => patch({ body })} onImages={images => patch({ images })} onError={setError} /></div><aside className="knowledge-editor-aside"><section><h2>Organização</h2><label>Categoria<select value={draft.category} onChange={event => patch({ category: event.target.value })}>{categoryOptions.map(item => <option key={item}>{item}</option>)}</select></label><label>Etiquetas<input value={tags} onChange={event => setTags(event.target.value)} placeholder="Ex.: Windows, impressão, driver" /></label><p>Separe as etiquetas por vírgula.</p></section><section><h2>Chamados relacionados</h2><p>Opcional. Um chamado pode estar em vários artigos.</p><input aria-label="Buscar chamado relacionado" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar chamado" />{draft.ticketIds.length > 0 && <small>{draft.ticketIds.length} selecionado(s)</small>}<div className="knowledge-ticket-list">{matches.map(ticket => <label key={ticket.id}><input type="checkbox" checked={draft.ticketIds.includes(ticket.id)} onChange={event => patch({ ticketIds: event.target.checked ? [...draft.ticketIds, ticket.id] : draft.ticketIds.filter(id => id !== ticket.id) })} /><span><small>{ticket.id}</small>{ticket.title}</span></label>)}{matches.length === 0 && <p>Nenhum chamado encontrado.</p>}</div></section>{(author || original?.updatedAt) && <section><h2>Histórico</h2>{author && <p>Criado por {author}</p>}{original?.updatedAt && <p>Última atualização: {articleDate(original.updatedAt)}</p>}</section>}</aside><div className="knowledge-editor-actions">{error && <p role="alert">{error}</p>}<button type="button" className="button" onClick={cancel}>Cancelar</button><button type="submit" className="button primary" disabled={sending}><Check size={16} /> {sending ? 'Enviando...' : canEdit ? 'Salvar guia' : 'Enviar sugestão'}</button></div></form></div>
}

export function KnowledgeEditor(props: Props) {
  const { articleId } = useParams()
  const [params] = useSearchParams()
  const original = articleId ? props.data.articles.find(item => item.id === articleId) : undefined
  if (articleId && !original) return <div className="knowledge-page knowledge-empty"><h1>Artigo não encontrado</h1><Link className="button" to="/conhecimento">Voltar à base</Link></div>
  return <EditorForm key={articleId ?? 'new'} {...props} original={original} addSolution={params.get('solucao') === '1'} />
}
