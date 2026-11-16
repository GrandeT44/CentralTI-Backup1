import test from 'node:test'
import assert from 'node:assert/strict'
import { dateKey, fromSaoPaulo, localDateTime } from '../src/dateTime.ts'

test('converte data e hora de São Paulo nos dois sentidos', () => {
  const local = '2026-11-16T09:10'
  assert.equal(localDateTime(fromSaoPaulo(local)), local)
  assert.equal(dateKey(fromSaoPaulo(local)), '2026-11-16')
})

test('respeita mudança histórica de horário de verão', () => {
  assert.equal(fromSaoPaulo('2018-01-15T09:00'), '2018-01-15T11:00:00.000Z')
  assert.equal(fromSaoPaulo('2026-01-15T09:00'), '2026-01-15T12:00:00.000Z')
})
