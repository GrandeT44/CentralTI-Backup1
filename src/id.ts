type IdCrypto = Partial<Pick<Crypto, 'randomUUID' | 'getRandomValues'>>

/** Identificadores de registros locais, inclusive em HTTP na rede interna. */
export function createId(source: IdCrypto | undefined = globalThis.crypto): string {
  if (typeof source?.randomUUID === 'function') {
    try { return source.randomUUID() } catch { /* Usa a alternativa abaixo. */ }
  }

  const bytes = new Uint8Array(16)
  let filled = false
  if (typeof source?.getRandomValues === 'function') {
    try { source.getRandomValues(bytes); filled = true } catch { /* Navegadores restritos. */ }
  }
  if (!filled) for (let index = 0; index < bytes.length; index++) bytes[index] = Math.floor(Math.random() * 256)

  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
