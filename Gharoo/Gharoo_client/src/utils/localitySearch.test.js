import test from 'node:test'
import assert from 'node:assert/strict'

import { normalizeLocalitySuggestions } from './localitySearch.js'

test('prefers locality results and removes noisy street-level matches', () => {
  const suggestions = [
    { label: '101, Ring Road, Surat, Gujarat, India', area: 'Ring Road', city: 'Surat' },
    { label: 'Nana Varachha, Surat, Gujarat, India', area: 'Nana Varachha', city: 'Surat' },
    { label: 'Vesu, Surat, Gujarat, India', area: 'Vesu', city: 'Surat' },
    { label: 'Kiran Baug, Simada, Surat, Gujarat, India', area: 'Simada', city: 'Surat' }
  ]

  const result = normalizeLocalitySuggestions(suggestions, 'nana varachha')

  assert.equal(result[0].label, 'Nana Varachha, Surat, Gujarat, India')
  assert.ok(result.every((item) => item.label !== '101, Ring Road, Surat, Gujarat, India'))
})
