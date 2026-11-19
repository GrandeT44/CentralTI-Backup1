import type { KnowledgeArticle, Ticket } from '../domain'

const stop = new Set('a as o os um uma uns umas de da do das dos e em no na nos nas para por com sem que como ao aos ou se ser foi está este esta isso sobre pelo pela meu minha seu sua erro problema chamado atendimento atividade não mais após entre quando onde qual'.split(' '))
export function terms(value: string) {
  return [...new Set(value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().match(/[a-z0-9]{3,}/g)?.filter(word => !stop.has(word)) ?? [])]
}

export function recommendArticles(ticket: Pick<Ticket, 'id' | 'title' | 'description' | 'category'>, articles: KnowledgeArticle[], limit = 3) {
  const title = new Set(terms(ticket.title))
  const description = new Set(terms(ticket.description))
  return articles.map(article => {
    const heading = new Set(terms(`${article.title} ${article.symptoms} ${(article.tags ?? []).join(' ')}`))
    const body = new Set(terms(`${article.body ?? ''} ${article.procedures} ${article.solutions.map(item => item.text).join(' ')}`))
    const matched = [...new Set([...title, ...description].filter(word => heading.has(word) || body.has(word)))]
    const linked = article.ticketIds?.includes(ticket.id) ?? false
    const score = matched.reduce((total, word) => total + (title.has(word) ? 3 : 1) * (heading.has(word) ? 2 : 1), 0)
      + (matched.length && article.category === ticket.category ? 2 : 0) + (linked ? 20 : 0)
    return { article, score, matched, linked }
  }).filter(item => item.score >= 4 && (item.matched.length >= 2 || item.linked || item.score >= 6))
    .sort((a, b) => b.score - a.score || a.article.title.localeCompare(b.article.title, 'pt-BR')).slice(0, limit)
}
