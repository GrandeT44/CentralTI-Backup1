import { useRef, useState } from 'react'
import { Bold, Code2, Heading2, ImagePlus, Italic, Link2, List, ListOrdered, Trash2, Underline } from 'lucide-react'
import type { KnowledgeImage } from '../domain'
import { createId } from '../id'

type Props = { value: string; images: KnowledgeImage[]; onChange: (value: string) => void; onImages: (images: KnowledgeImage[]) => void; onError: (message: string) => void }
type Range = { start: number; end: number }

export function KnowledgeBodyEditor({ value, images, onChange, onImages, onError }: Props) {
  const field = useRef<HTMLTextAreaElement>(null)
  const [selection, setSelection] = useState<Range | null>(null)
  const remember = () => { const input = field.current; if (input) setSelection(input.selectionStart < input.selectionEnd ? { start: input.selectionStart, end: input.selectionEnd } : null) }
  const replace = (before: string, after = before) => {
    const input = field.current, start = selection?.start ?? input?.selectionStart ?? value.length, end = selection?.end ?? input?.selectionEnd ?? start
    const selected = value.slice(start, end)
    onChange(value.slice(0, start) + before + selected + after + value.slice(end))
    setSelection(null)
    requestAnimationFrame(() => { input?.focus(); input?.setSelectionRange(start + before.length, end + before.length) })
  }
  const prefixLines = (ordered: boolean) => {
    const input = field.current, start = selection?.start ?? input?.selectionStart ?? value.length, end = selection?.end ?? input?.selectionEnd ?? start
    const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1
    const lineEnd = value.indexOf('\n', end) < 0 ? value.length : value.indexOf('\n', end)
    const content = value.slice(lineStart, lineEnd).split('\n').map((line, index) => `${ordered ? `${index + 1}. ` : '- '}${line}`).join('\n')
    onChange(value.slice(0, lineStart) + content + value.slice(lineEnd))
    setSelection(null)
    requestAnimationFrame(() => { input?.focus(); input?.setSelectionRange(lineStart + content.length, lineStart + content.length) })
  }
  const heading = () => {
    const input = field.current, start = selection?.start ?? input?.selectionStart ?? value.length
    const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1
    const current = value.slice(lineStart).replace(/^#{1,3}\s+/, '')
    onChange(value.slice(0, lineStart) + `## ${current}`)
    setSelection(null)
    requestAnimationFrame(() => input?.focus())
  }
  const link = () => { const url = window.prompt('Endereço do link (https://)'); if (!url) return; if (!/^https?:\/\/\S+$/i.test(url)) { onError('Use um endereço que comece com http:// ou https://.'); return } replace('[', `](${url})`) }
  const addImages = async (files: FileList | null) => {
    if (!files?.length) return
    if (images.length + files.length > 8) { onError('Use no máximo 8 imagens por guia.'); return }
    const next = [...images]
    const references: string[] = []
    for (const file of Array.from(files)) {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1_400_000) { onError('Use PNG, JPEG ou WebP com até 1,4 MB por imagem.'); return }
      const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Não foi possível ler a imagem.')); reader.readAsDataURL(file) })
      const id = createId(), alt = file.name.replace(/\.[^.]+$/, '').slice(0, 80)
      next.push({ id, alt, dataUrl })
      references.push(`![${alt}](article-image:${id})`)
    }
    onImages(next)
    const input = field.current, at = input?.selectionStart ?? value.length
    onChange(value.slice(0, at) + `${at ? '\n\n' : ''}${references.join('\n\n')}\n` + value.slice(at))
    onError('')
    requestAnimationFrame(() => input?.focus())
  }
  const removeImage = (image: KnowledgeImage) => { onImages(images.filter(item => item.id !== image.id)); onChange(value.replace(new RegExp(`!?\\[[^\\]]*\\]\\(article-image:${image.id}\\)\\n?`, 'g'), '')) }
  return <div className="knowledge-body-editor"><div className="knowledge-body-toolbar" role="toolbar" aria-label="Formatar texto do guia" onMouseDown={event => { if (event.target instanceof Element && event.target.closest('button')) event.preventDefault() }}><button type="button" onClick={heading} title="Título" aria-label="Título"><Heading2 size={16} /></button><button type="button" onClick={() => replace('**')} title="Negrito" aria-label="Negrito"><Bold size={16} /></button><button type="button" onClick={() => replace('*')} title="Itálico" aria-label="Itálico"><Italic size={16} /></button><button type="button" onClick={() => replace('++')} title="Sublinhado" aria-label="Sublinhado"><Underline size={16} /></button><button type="button" onClick={() => replace('`')} title="Código" aria-label="Código"><Code2 size={16} /></button><span /><button type="button" onClick={() => prefixLines(false)} title="Lista" aria-label="Lista"><List size={16} /></button><button type="button" onClick={() => prefixLines(true)} title="Lista numerada" aria-label="Lista numerada"><ListOrdered size={16} /></button><button type="button" onClick={link} title="Link" aria-label="Link"><Link2 size={16} /></button><label title="Anexar imagem"><ImagePlus size={16} /><input type="file" accept="image/png,image/jpeg,image/webp" multiple aria-label="Anexar imagens ao guia" onChange={event => { void addImages(event.target.files).catch(cause => onError(cause instanceof Error ? cause.message : 'Não foi possível anexar a imagem.')); event.target.value = '' }} /></label></div>{selection && <div className="knowledge-selection-hint">Texto selecionado: use os botões acima para formatar.</div>}<textarea ref={field} aria-label="Conteúdo do guia" value={value} onChange={event => onChange(event.target.value)} onSelect={remember} onKeyUp={remember} onMouseUp={remember} rows={22} placeholder="Escreva livremente. Use títulos para organizar sintomas, investigação, soluções e observações. Selecione texto para formatar." />{images.length > 0 && <div className="knowledge-attached-images"><strong>Imagens deste guia</strong><div>{images.map(image => <span key={image.id}><img src={image.dataUrl} alt={image.alt} /><small>{image.alt}</small><button type="button" aria-label={`Remover imagem ${image.alt}`} onClick={() => removeImage(image)}><Trash2 size={14} /></button></span>)}</div></div>}</div>
}
