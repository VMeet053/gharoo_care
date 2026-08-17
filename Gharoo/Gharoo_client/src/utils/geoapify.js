export const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY || 'ea84882880264cf3848317e50c5b6bd4'
export const OPEN_CAGE_API_KEY = import.meta.env.VITE_OPEN_CAGE_API_KEY || ''

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
  if (text.length < 3) return []

  // If Geoapify key is not available, fall back to OpenCage (if key present)
  // or to Nominatim search as a last resort.

  const autocompleteParams = new URLSearchParams({
    text,
    apiKey: GEOAPIFY_API_KEY,
    limit: '8',
    filter: 'countrycode:in'
  })

  try {
    if (GEOAPIFY_API_KEY) {
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
  } catch (err) {
    console.warn('Geoapify autocomplete/places failed, falling back:', err)
  }

  // Fallback: try OpenCage forward geocoding if key present
  if (OPEN_CAGE_API_KEY) {
    try {
      const paramsOC = new URLSearchParams({
        q: text,
        key: OPEN_CAGE_API_KEY,
        limit: '8',
        countrycode: 'in'
      })
      const resp = await fetch(`https://api.opencagedata.com/geocode/v1/json?${paramsOC}`, { signal })
      const data = await resp.json()
      const mapped = (data.results || []).map((r) => {
        const lat = r.geometry?.lat
        const lon = r.geometry?.lng
        const properties = {
          formatted: r.formatted,
          housenumber: r.components?.house_number,
          street: r.components?.road,
          city: r.components?.city || r.components?.town || r.components?.village || '',
          postcode: r.components?.postcode || '',
          state: r.components?.state || ''
        }
        return normalizeFeature({ properties, geometry: { coordinates: [lon, lat] } }, 'opencage')
      })
      return uniqueSuggestions(mapped).slice(0, 12)
    } catch (err) {
      console.warn('OpenCage autocomplete failed, falling back to Nominatim:', err)
    }
  }

  // Final fallback: Nominatim search
  try {
    const nomParams = new URLSearchParams({
      q: text,
      format: 'json',
      addressdetails: '1',
      limit: '8',
      countrycodes: 'in'
    })
    const resp = await fetch(`https://nominatim.openstreetmap.org/search?${nomParams}`, {
      headers: { 'User-Agent': 'GharooApp/1.0' },
      signal
    })
    const data = await resp.json()
    const mapped = (data || []).map((r) => {
      const lat = parseFloat(r.lat)
      const lon = parseFloat(r.lon)
      const properties = {
        formatted: r.display_name,
        housenumber: r.address?.house_number,
        street: r.address?.road || r.address?.pedestrian,
        city: r.address?.city || r.address?.town || r.address?.village || '',
        postcode: r.address?.postcode || '',
        state: r.address?.state || ''
      }
      return normalizeFeature({ properties, geometry: { coordinates: [lon, lat] } }, 'nominatim')
    })
    return uniqueSuggestions(mapped).slice(0, 12)
  } catch (err) {
    console.warn('Nominatim search failed:', err)
    return []
  }
}

export async function fetchGeoapifyReverseAddress(latitude, longitude, signal) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  // Try Geoapify first (if key present)
  if (GEOAPIFY_API_KEY) {
    try {
      const params = new URLSearchParams({
        lat: String(latitude),
        lon: String(longitude),
        apiKey: GEOAPIFY_API_KEY
      })

      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/reverse?${params}`,
        { signal }
      )
      if (response.ok) {
        const data = await response.json()
        const [feature] = data.features || []
        if (feature) return normalizeFeature(feature, 'current')
      }
    } catch (err) {
      console.warn('Geoapify reverse failed, trying fallbacks:', err)
    }
  }

  // Fallback: OpenCage reverse (if key present)
  if (OPEN_CAGE_API_KEY) {
    try {
      const paramsOC = new URLSearchParams({
        q: `${latitude}+${longitude}`,
        key: OPEN_CAGE_API_KEY,
        limit: '1'
      })
      const resp = await fetch(`https://api.opencagedata.com/geocode/v1/json?${paramsOC}`, { signal })
      if (resp.ok) {
        const json = await resp.json()
        const r = json.results && json.results[0]
        if (r) {
          const properties = {
            formatted: r.formatted,
            housenumber: r.components?.house_number,
            street: r.components?.road || r.components?.pedestrian,
            city: r.components?.city || r.components?.town || r.components?.village || '',
            postcode: r.components?.postcode || '',
            state: r.components?.state || ''
          }
          return normalizeFeature({ properties, geometry: { coordinates: [longitude, latitude] } }, 'opencage')
        }
      }
    } catch (err) {
      console.warn('OpenCage reverse failed, trying Nominatim:', err)
    }
  }

  // Final fallback: Nominatim reverse (no key required but rate-limited)
  try {
    const nomParams = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      format: 'json',
      addressdetails: '1'
    })
    const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?${nomParams}`, {
      headers: { 'User-Agent': 'GharooApp/1.0' },
      signal
    })
    if (!resp.ok) return null
    const data = await resp.json()
    const properties = {
      formatted: data.display_name,
      housenumber: data.address?.house_number,
      street: data.address?.road || data.address?.pedestrian,
      city: data.address?.city || data.address?.town || data.address?.village || '',
      postcode: data.address?.postcode || '',
      state: data.address?.state || ''
    }
    return normalizeFeature({ properties, geometry: { coordinates: [longitude, latitude] } }, 'nominatim')
  } catch (err) {
    console.warn('Nominatim reverse failed:', err)
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
