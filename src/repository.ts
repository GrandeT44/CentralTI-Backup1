import type { Data, KnowledgeArticle, PlannedActivity, Ticket, WorkSession } from './domain'
import { seed } from './data'
const KEY = 'lanobrasil-ti-v1'
export interface Repository {
 read(): Data
 save(data: Data): void
 createTicket(ticket: Ticket): Data
 updateTicket(ticket: Ticket): Data
 createPlan(plan: PlannedActivity): Data
 updatePlan(plan: PlannedActivity): Data
 deletePlan(id: string): Data
 createWorkSession(session: WorkSession): Data
 createArticle(article: KnowledgeArticle): Data
 updateArticle(article: KnowledgeArticle): Data
}
const mutate = (change: (data: Data) => Data) => { const next = change(repository.read()); repository.save(next); return next }
export const repository: Repository = {
 read() { try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as Data : structuredClone(seed) } catch { return structuredClone(seed) } },
 save(data) { localStorage.setItem(KEY, JSON.stringify(data)) },
 createTicket(ticket) { return mutate(data => ({ ...data, tickets: [ticket, ...data.tickets] })) },
 updateTicket(ticket) { return mutate(data => ({ ...data, tickets: data.tickets.map(item => item.id === ticket.id ? ticket : item) })) },
 createPlan(plan) { return mutate(data => ({ ...data, plans: [...data.plans, plan] })) },
 updatePlan(plan) { return mutate(data => ({ ...data, plans: data.plans.map(item => item.id === plan.id ? plan : item) })) },
 deletePlan(id) { return mutate(data => ({ ...data, plans: data.plans.filter(item => item.id !== id) })) },
 createWorkSession(session) { return mutate(data => ({ ...data, sessions: [...data.sessions, session] })) },
 createArticle(article) { return mutate(data => ({ ...data, articles: [...data.articles, article] })) },
 updateArticle(article) { return mutate(data => ({ ...data, articles: data.articles.map(item => item.id === article.id ? article : item) })) }
}
