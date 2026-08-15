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

  const ranked = suggestions
    .map((suggestion) => ({ suggestion, score: scoreSuggestion(suggestion) }))
    .filter(({ score }) => Number.isFinite(score))
    .sort((a, b) => b.score - a.score)

  const bestResults = ranked.filter(({ score }) => score > -5).map(({ suggestion }) => suggestion)
  return bestResults.length ? bestResults.slice(0, 8) : suggestions.slice(0, 8)
}
