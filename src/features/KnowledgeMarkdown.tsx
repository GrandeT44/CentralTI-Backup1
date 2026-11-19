import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import type { KnowledgeImage } from '../domain'

function safeHref(value: string) {
  try { const url = new URL(value, window.location.origin); return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined } catch { return undefined }
}

function inline(value: string) {
  const pattern = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\+\+([^+]+)\+\+|\*([^*]+)\*|`([^`]+)`)/g
  const output: React.ReactNode[] = []
  let cursor = 0
  for (const match of value.matchAll(pattern)) {
    const at = match.index ?? 0
    if (at > cursor) output.push(value.slice(cursor, at))
    if (match[2]) { const href = safeHref(match[3]); output.push(href ? <a key={at} href={href} target="_blank" rel="noopener noreferrer">{match[2]}</a> : match[2]) }
    else if (match[4]) output.push(<strong key={at}>{match[4]}</strong>)
    else if (match[5]) output.push(<u key={at}>{match[5]}</u>)
    else if (match[6]) output.push(<em key={at}>{match[6]}</em>)
    else output.push(<code key={at}>{match[7]}</code>)
    cursor = at + match[0].length
  }
  if (cursor < value.length) output.push(value.slice(cursor))
  return output
}

export function KnowledgeMarkdown({ text, images = [] }: { text: string; images?: KnowledgeImage[] }) {
  const [copied, setCopied] = useState<number | null>(null)
  const lines = text.split(/\r?\n/)
  const output: React.ReactNode[] = []
  for (let i = 0; i < lines.length;) {
    const line = lines[i]
    if (line.startsWith('```')) {
      const start = i++
      const code: string[] = []
      while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++])
      if (i < lines.length) i++
      output.push(<div className="knowledge-code" key={start}><button type="button" onClick={() => { void navigator.clipboard.writeText(code.join('\n')).then(() => setCopied(start)).catch(() => setCopied(null)) }}>{copied === start ? <Check size={14} /> : <Copy size={14} />}{copied === start ? 'Copiado' : 'Copiar comando'}</button><pre><code>{code.join('\n')}</code></pre></div>)
      continue
    }
    if (!line.trim()) { i++; continue }
    const imageMatch = line.match(/^!\[([^\]]*)\]\(article-image:([a-zA-Z0-9-]+)\)$/)
    if (imageMatch) { const attached = images.find(item => item.id === imageMatch[2]); output.push(attached ? <figure className="knowledge-article-image" key={i}><img src={attached.dataUrl} alt={imageMatch[1] || attached.alt} /><figcaption>{imageMatch[1] || attached.alt}</figcaption></figure> : <p key={i}>Imagem indisponível.</p>); i++; continue }
    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) { output.push(heading[1].length === 1 ? <h3 key={i}>{inline(heading[2])}</h3> : <h4 key={i}>{inline(heading[2])}</h4>); i++; continue }
    const bullet = line.match(/^\s*[-*]\s+(.+)$/)
    const numbered = line.match(/^\s*\d+[.)]\s+(.+)$/)
    if (bullet || numbered) {
      const ordered = !!numbered, items: React.ReactNode[] = [], start = i
      while (i < lines.length) { const item = lines[i].match(ordered ? /^\s*\d+[.)]\s+(.+)$/ : /^\s*[-*]\s+(.+)$/); if (!item) break; items.push(<li key={i}>{inline(item[1])}</li>); i++ }
      output.push(ordered ? <ol key={start}>{items}</ol> : <ul key={start}>{items}</ul>)
      continue
    }
    output.push(<p key={i}>{inline(line)}</p>); i++
  }
  return <div className="knowledge-markdown">{output}</div>
}
