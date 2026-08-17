const PAN_INDIA_LOCALITY_FALLBACKS = [
  { label: 'Nana Varachha, Surat, Gujarat, India', area: 'Nana Varachha', city: 'Surat', state: 'Gujarat', pinCode: '395013' },
  { label: 'Vesu, Surat, Gujarat, India', area: 'Vesu', city: 'Surat', state: 'Gujarat', pinCode: '395007' },
  { label: 'Adajan, Surat, Gujarat, India', area: 'Adajan', city: 'Surat', state: 'Gujarat', pinCode: '395009' },
  { label: 'Athwa, Surat, Gujarat, India', area: 'Athwa', city: 'Surat', state: 'Gujarat', pinCode: '395001' },
  { label: 'Pal, Surat, Gujarat, India', area: 'Pal', city: 'Surat', state: 'Gujarat', pinCode: '395009' },
  { label: 'Udhna, Surat, Gujarat, India', area: 'Udhna', city: 'Surat', state: 'Gujarat', pinCode: '394210' },
  { label: 'Rander, Surat, Gujarat, India', area: 'Rander', city: 'Surat', state: 'Gujarat', pinCode: '395005' },
  { label: 'Althan, Surat, Gujarat, India', area: 'Althan', city: 'Surat', state: 'Gujarat', pinCode: '395017' },
  { label: 'Indiranagar, Bengaluru, Karnataka, India', area: 'Indiranagar', city: 'Bengaluru', state: 'Karnataka', pinCode: '560038' },
  { label: 'Koramangala, Bengaluru, Karnataka, India', area: 'Koramangala', city: 'Bengaluru', state: 'Karnataka', pinCode: '560034' },
  { label: 'Hinjawadi, Pune, Maharashtra, India', area: 'Hinjawadi', city: 'Pune', state: 'Maharashtra', pinCode: '411057' },
  { label: 'Kharadi, Pune, Maharashtra, India', area: 'Kharadi', city: 'Pune', state: 'Maharashtra', pinCode: '411014' },
  { label: 'Andheri West, Mumbai, Maharashtra, India', area: 'Andheri West', city: 'Mumbai', state: 'Maharashtra', pinCode: '400058' },
  { label: 'Bopal, Ahmedabad, Gujarat, India', area: 'Bopal', city: 'Ahmedabad', state: 'Gujarat', pinCode: '380058' },
  { label: 'Navrangpura, Ahmedabad, Gujarat, India', area: 'Navrangpura', city: 'Ahmedabad', state: 'Gujarat', pinCode: '380009' },
  { label: 'Ghatlodia, Ahmedabad, Gujarat, India', area: 'Ghatlodia', city: 'Ahmedabad', state: 'Gujarat', pinCode: '380061' },
  { label: 'Banjara Hills, Hyderabad, Telangana, India', area: 'Banjara Hills', city: 'Hyderabad', state: 'Telangana', pinCode: '500034' },
  { label: 'Kondapur, Hyderabad, Telangana, India', area: 'Kondapur', city: 'Hyderabad', state: 'Telangana', pinCode: '500084' },
  { label: 'Dwarka, New Delhi, Delhi, India', area: 'Dwarka', city: 'New Delhi', state: 'Delhi', pinCode: '110078' },
  { label: 'Saket, New Delhi, Delhi, India', area: 'Saket', city: 'New Delhi', state: 'Delhi', pinCode: '110017' }
]

export function normalizeLocalitySuggestions(suggestions = [], query = '') {
  const searchText = (query || '').trim().toLowerCase()
  const tokens = searchText.split(/\s+/).filter(Boolean)

  const scoreSuggestion = (suggestion) => {
    const rawLabel = suggestion?.label || suggestion?.address || ''
    const label = rawLabel.toLowerCase()
    const area = (suggestion?.area || '').toLowerCase()
    const city = (suggestion?.city || '').toLowerCase()
    const haystack = `${label} ${area} ${city}`

    if (!label) return Number.NEGATIVE_INFINITY

    let score = 0

    if (tokens.length > 0) {
      const matchedTokens = tokens.filter((token) => haystack.includes(token))
      score += matchedTokens.length * 12

      if (area && tokens.some((token) => area.includes(token))) {
        score += 18
      }

      if (tokens.every((token) => label.includes(token))) {
        score += 12
      }

      if (tokens.some((token) => label.startsWith(token))) {
        score += 8
      }
    }

    if (area && area.includes(searchText)) score += 10
    if (city && city.includes(searchText)) score += 4

    const noisyStreetPattern = /(road|street|lane|cross|society|colony|park|market|tower|villa|apartment|flat|building|plot|nr\.|near|opp\.|beside|nagar)/i
    if (noisyStreetPattern.test(label) && /\d/.test(label)) {
      score -= 22
    }

    if (area && noisyStreetPattern.test(area)) {
      score -= 8
    }

    return score
  }

  const uniqueByKey = new Set()
  const apiSuggestions = suggestions.filter((suggestion) => {
    const key = `${(suggestion?.label || '')}|${(suggestion?.area || '')}|${(suggestion?.city || '')}`.toLowerCase()
    if (!key || uniqueByKey.has(key)) return false
    uniqueByKey.add(key)
    return true
  })

  const fallbackSuggestions = PAN_INDIA_LOCALITY_FALLBACKS.filter((fallback) => {
    if (!searchText) return true
    const haystack = `${fallback.label} ${fallback.area} ${fallback.city}`.toLowerCase()
    return tokens.every((token) => token.length < 3 || haystack.includes(token))
  }).map((fallback) => ({
    ...fallback,
    source: 'fallback'
  }))

  const allSuggestions = [...apiSuggestions, ...fallbackSuggestions].filter((suggestion) => {
    const key = `${(suggestion?.label || '')}|${(suggestion?.area || '')}|${(suggestion?.city || '')}`.toLowerCase()
    if (!key) return false
    if (uniqueByKey.has(key)) return false
    uniqueByKey.add(key)
    return true
  })

  if (!allSuggestions.length) return []

  const ranked = allSuggestions
    .map((suggestion) => ({ suggestion, score: scoreSuggestion(suggestion) }))
    .filter(({ score }) => Number.isFinite(score))
    .sort((a, b) => b.score - a.score)

  return ranked.map(({ suggestion }) => suggestion).slice(0, 8)
}
