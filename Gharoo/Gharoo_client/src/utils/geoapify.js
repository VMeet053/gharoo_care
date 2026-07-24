export const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY || 'ea84882880264cf3848317e50c5b6bd4'

const PLACE_CATEGORIES = [
  'building',
  'commercial',
  'office',
  'service',
  'catering',
  'accommodation',
  'healthcare',
  'education'
].join(',')

function normalizeFeature(feature, source) {
  const properties = feature?.properties || {}
  const geometry = feature?.geometry || {}
  const [lon, lat] = Array.isArray(geometry.coordinates) ? geometry.coordinates : []
  const city = properties.city || properties.town || properties.village || properties.municipality || ''
  const area = properties.suburb ||
    properties.neighbourhood ||
    properties.city_district ||
    properties.district ||
    properties.state_district ||
    properties.county ||
    ''
  const flatHouse = [properties.housenumber, properties.street].filter(Boolean).join(', ')

  return {
    id: `${source}-${properties.place_id || properties.osm_id || properties.formatted || properties.name}`,
    source,
    label: properties.formatted || properties.address_line1 || properties.name || '',
    name: properties.name || '',
    flatHouse,
    address: properties.formatted || properties.address_line1 || properties.name || '',
    area,
    city,
    state: properties.state || '',
    pinCode: properties.postcode || '',
    lon,
    lat,
    raw: feature
  }
}

function uniqueSuggestions(suggestions) {
  const seen = new Set()
  return suggestions.filter((suggestion) => {
    const key = `${suggestion.label}|${suggestion.city}|${suggestion.pinCode}`.toLowerCase()
    if (!suggestion.label || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function fetchGeoapifyAddressSuggestions(query, signal) {
  const text = query.trim()
  if (!GEOAPIFY_API_KEY || text.length < 3) return []

  const autocompleteParams = new URLSearchParams({
    text,
    apiKey: GEOAPIFY_API_KEY,
    limit: '8',
    filter: 'countrycode:in'
  })

  const autocompleteResponse = await fetch(
    `https://api.geoapify.com/v1/geocode/autocomplete?${autocompleteParams}`,
    { signal }
  )
  const autocompleteData = await autocompleteResponse.json()
  const autocompleteSuggestions = (autocompleteData.features || []).map((feature) => normalizeFeature(feature, 'autocomplete'))
  const center = autocompleteSuggestions.find((suggestion) => Number.isFinite(suggestion.lon) && Number.isFinite(suggestion.lat))

  if (!center) {
    return uniqueSuggestions(autocompleteSuggestions)
  }

  const placesParams = new URLSearchParams({
    categories: PLACE_CATEGORIES,
    filter: `circle:${center.lon},${center.lat},5000`,
    bias: `proximity:${center.lon},${center.lat}`,
    name: text,
    apiKey: GEOAPIFY_API_KEY,
    limit: '8'
  })

  const placesResponse = await fetch(
    `https://api.geoapify.com/v2/places?${placesParams}`,
    { signal }
  )
  const placesData = await placesResponse.json()
  const placeSuggestions = (placesData.features || []).map((feature) => normalizeFeature(feature, 'places'))

  return uniqueSuggestions([...autocompleteSuggestions, ...placeSuggestions]).slice(0, 12)
}

export async function fetchGeoapifyReverseAddress(latitude, longitude, signal) {
  if (!GEOAPIFY_API_KEY || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }

  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    apiKey: GEOAPIFY_API_KEY
  })

  const response = await fetch(
    `https://api.geoapify.com/v1/geocode/reverse?${params}`,
    { signal }
  )
  if (!response.ok) return null

  const data = await response.json()
  const [feature] = data.features || []

  return feature ? normalizeFeature(feature, 'current') : null
}
