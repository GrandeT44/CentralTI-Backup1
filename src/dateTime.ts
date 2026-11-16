const zone = 'America/Sao_Paulo'
export function localDateTime(value: string | Date) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value)).replace(' ', 'T')
}
export function fromSaoPaulo(value: string) {
  const desired = Date.parse(`${value}:00Z`)
  let guess = desired
  for (let i = 0; i < 3; i++) {
    const shown = localDateTime(new Date(guess))
    const shownUtc = Date.parse(`${shown}:00Z`)
    guess += desired - shownUtc
  }
  if (localDateTime(new Date(guess)) !== value) throw new Error('Horário inexistente em São Paulo')
  return new Date(guess).toISOString()
}
export const dateKey = (value: string | Date) => localDateTime(value).slice(0, 10)
export const timeLabel = (value: string) => localDateTime(value).slice(11)
