import type { KnowledgeArticle } from '../domain'
import { terms } from './knowledgeMatch.ts'
import { createId } from '../id.ts'

export type ArticleOrder = 'recent' | 'alphabetical'
export function filterArticles(articles: KnowledgeArticle[], query: string, category: string, order: ArticleOrder) {
  const words = terms(query)
  return articles.filter(article => {
    if (category !== 'Todas' && article.category !== category) return false
    const content = terms([article.title, article.category, article.body ?? '', article.symptoms, article.procedures, article.notes ?? '', ...(article.tags ?? []), ...(article.images ?? []).map(image => image.alt), ...article.solutions.flatMap(solution => [solution.text, solution.context ?? ''])].join(' '))
    return words.every(word => content.includes(word))
  }).sort((a, b) => order === 'recent'
    ? (b.updatedAt ?? b.createdAt ?? '').localeCompare(a.updatedAt ?? a.createdAt ?? '') || a.title.localeCompare(b.title, 'pt-BR')
    : a.title.localeCompare(b.title, 'pt-BR'))
}

export function articleDate(value?: string) {
  if (!value || Number.isNaN(Date.parse(value))) return ''
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

export function articleBody(article: KnowledgeArticle) {
  if (article.body) return article.body
  return [article.symptoms && `## Sintomas\n${article.symptoms}`, article.procedures && `## Investigação\n${article.procedures}`, ...article.solutions.filter(item => item.text).map((item, index) => `## Solução ${index + 1}\n${item.text}${item.context ? `\n\n**Quando aplicar:** ${item.context}` : ''}`), article.notes && `## Observações\n${article.notes}`].filter(Boolean).join('\n\n')
}

export function prepareArticle(draft: KnowledgeArticle, original: KnowledgeArticle | undefined, tags: string, active: string, now: string): KnowledgeArticle {
  const known = new Set(original?.solutions.map(item => item.id) ?? [])
  const added = draft.solutions.filter(item => item.text.trim() && !known.has(item.id)).length
  return {
    ...draft,
    title: draft.title.trim(), symptoms: draft.symptoms.trim(), procedures: draft.procedures.trim(), notes: draft.notes?.trim(), body: draft.body?.trim(),
    tags: [...new Set(tags.split(',').map(item => item.trim()).filter(Boolean))],
    ticketIds: [...new Set(draft.ticketIds)],
    solutions: draft.solutions.map(item => ({ ...item, text: item.text.trim(), context: item.context?.trim() })).filter(item => item.text).map(item => known.has(item.id) ? item : { ...item, authorId: active, addedAt: now }),
    authorId: original?.authorId ?? active, createdAt: original?.createdAt ?? now, updatedAt: now, updatedById: active,
    history: [...(original?.history ?? []), { id: createId(), at: now, authorId: active, action: original ? added ? `${added} solução(ões) adicionada(s) e artigo atualizado` : 'Artigo atualizado' : 'Artigo criado' }],
  }
}
