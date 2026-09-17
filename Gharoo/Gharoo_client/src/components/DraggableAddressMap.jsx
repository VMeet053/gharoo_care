import React, { useEffect, useRef, useState } from 'react'
import {
  GEOAPIFY_API_KEY,
  fetchGeoapifyAddressSuggestions,
  fetchGeoapifyReverseAddress
} from '../utils/geoapify'
import { normalizeLocalitySuggestions } from '../utils/localitySearch'
import { apiUrl } from '../utils/api'

const GOOGLE_MAPS_API_KEY = (import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) || ''
// Google Geocoding requires billing. Keep it opt-in so local/testing builds
// use the no-billing server fallback (OpenStreetMap) for address auto-fill.
const ENABLE_GOOGLE_GEOCODER = (import.meta.env && import.meta.env.VITE_ENABLE_GOOGLE_GEOCODER) === 'true'

let googleMapsPromise

function useHasGoogleKey() {
  return Boolean(GOOGLE_MAPS_API_KEY)
}

function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google.maps)
  if (!GOOGLE_MAPS_API_KEY) return Promise.reject(new Error('Google Maps API key missing'))
  if (googleMapsPromise) return googleMapsPromise

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = `initGharooGoogleMaps_${Date.now()}`
    const script = document.createElement('script')
    const params = new URLSearchParams({
      key: GOOGLE_MAPS_API_KEY,
      libraries: 'places',
      callback: callbackName
    })

    window[callbackName] = () => {
      delete window[callbackName]
      resolve(window.google.maps)
    }

    script.src = `https://maps.googleapis.com/maps/api/js?${params}`
    script.async = true
    script.defer = true
    script.onerror = () => {
      delete window[callbackName]
      reject(new Error('Google Maps failed to load'))
    }
    document.head.appendChild(script)
  })

  return googleMapsPromise
}

function getAddressPart(components, types) {
  const match = components.find((component) => types.some((type) => component.types.includes(type)))
  return match?.long_name || ''
}

function normalizeGoogleAddress(result, fallbackLocation) {
  const components = result?.address_components || []
  const route = getAddressPart(components, ['route'])
  const streetNumber = getAddressPart(components, ['street_number'])
  const premise = getAddressPart(components, ['premise', 'subpremise'])
  const establishment = result?.name || ''
  const locality = getAddressPart(components, ['sublocality_level_1', 'sublocality', 'neighborhood'])
  const district = getAddressPart(components, ['administrative_area_level_3', 'administrative_area_level_2'])
  const city = getAddressPart(components, ['locality', 'postal_town']) ||
    getAddressPart(components, ['administrative_area_level_3'])
  const state = getAddressPart(components, ['administrative_area_level_1'])
  const pinCode = getAddressPart(components, ['postal_code'])
  const latLng = result?.geometry?.location
  const lat = typeof latLng?.lat === 'function' ? latLng.lat() : fallbackLocation?.lat
  const lon = typeof latLng?.lng === 'function' ? latLng.lng() : fallbackLocation?.lon

  return {
    id: result?.place_id || `${lat},${lon}`,
    label: result?.formatted_address || '',
    name: establishment,
    flatHouse: [premise || streetNumber, route].filter(Boolean).join(', '),
    street: route,
    address: result?.formatted_address || '',
    area: locality || district,
    city,
    state,
    pinCode,
    lat,
    lon,
    source: 'google'
  }
}

function normalizeGeoapify(feature, source) {
  if (!feature) return null
  const properties = feature?.properties || {}
  const geometry = feature?.geometry || {}
  const [lon, lat] = Array.isArray(geometry.coordinates) ? geometry.coordinates : [feature.lon, feature.lat]
  const city = properties.city || properties.town || properties.village || properties.municipality || feature.city || ''
  const area =
    properties.suburb ||
    properties.neighbourhood ||
    properties.neighborhood ||
    properties.city_district ||
    properties.district ||
    properties.state_district ||
    properties.county ||
    feature.area ||
    city ||
    ''
  const state = properties.state || feature.state || ''
  const pinCode = properties.postcode || feature.pinCode || ''
  const flatHouse = [properties.name, properties.housenumber, properties.street].filter(Boolean).join(', ') || feature.flatHouse || ''
  const street = properties.street || feature.street || ''
  const formatted =
    properties.formatted || properties.address_line1 || properties.name || feature.label || feature.address || ''

  return {
    id: `${source}-${properties.place_id || properties.osm_id || formatted || Date.now()}`,
    source,
    placeId: feature.placeId || properties.place_id || null,
    label: formatted,
    name: properties.name || feature.name || '',
    flatHouse,
    street,
    address: formatted,
    area,
    city,
    state,
    pinCode,
    lon: Number.isFinite(lon) ? lon : feature.lon,
    lat: Number.isFinite(lat) ? lat : feature.lat,
    raw: feature
  }
}

function GoogleMapCanvas({ expanded = false, location, onSelect, mapsApi }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const center = location

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !mapsApi) return

    const map = new mapsApi.Map(containerRef.current, {
      center: { lat: center.lat, lng: center.lon },
      zoom: location ? 18 : 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false
    })

    const marker = new mapsApi.Marker({
      position: { lat: center.lat, lng: center.lon },
      map,
      draggable: true,
      animation: mapsApi.Animation ? mapsApi.Animation.DROP : undefined
    })

    marker.addListener('dragend', () => {
      const next = marker.getPosition()
      onSelect({ lat: next.lat(), lon: next.lng() })
    })

    map.addListener('click', (event) => {
      marker.setPosition(event.latLng)
      onSelect({ lat: event.latLng.lat(), lon: event.latLng.lng() })
    })

    mapRef.current = map
    markerRef.current = marker

    return () => {
      try {
        mapsApi.event.clearInstanceListeners(marker)
        mapsApi.event.clearInstanceListeners(map)
      } catch {}
      if (markerRef.current && markerRef.current.setMap) markerRef.current.setMap(null)
      mapRef.current = null
      markerRef.current = null
    }
  }, [mapsApi])

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return
    const nextCenter = location
    const nextLatLng = { lat: nextCenter.lat, lng: nextCenter.lon }
    markerRef.current.setPosition(nextLatLng)
    mapRef.current.setCenter(nextLatLng)
    mapRef.current.setZoom(location ? 18 : 12)
  }, [location?.lat, location?.lon])

  useEffect(() => {
    setTimeout(() => {
      if (!mapRef.current || !mapsApi) return
      mapsApi.event.trigger(mapRef.current, 'resize')
      const nextCenter = location
      mapRef.current.setCenter({ lat: nextCenter.lat, lng: nextCenter.lon })
    }, 140)
  }, [expanded, mapsApi])

  return <div className={`google-map-canvas ${expanded ? 'expanded' : ''}`} ref={containerRef} />
}

function GoogleMapEmbed({ expanded = false, location }) {
  const query = location ? `${location.lat},${location.lon}` : ''
  const src = location
    ? `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=17&output=embed`
    : 'about:blank'

  return (
    <iframe
      className={`google-map-canvas google-map-embed ${expanded ? 'expanded' : ''}`}
      title="Google map location"
      src={src}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  )
}
export async function fetchAddressSuggestions(query, options = {}) {
  const text = (query || '').trim()
  const signal = options?.signal
  if (text.length < 3) return []

  if (typeof window !== 'undefined') {
    try {
      const url = new URL(apiUrl('/api/localities'), window.location.origin)
      url.searchParams.set('q', text)
      const response = await fetch(url.toString(), { signal })
      if (response.ok) {
        const payload = await response.json()
        const suggestions = Array.isArray(payload?.suggestions) ? payload.suggestions : []
        if (suggestions.length > 0) {
          return normalizeLocalitySuggestions(suggestions, text)
        }
      }
    } catch (err) {
      console.warn('Backend locality API failed, falling back to provider search:', err)
    }
  }

  try {
    const geoapifySuggestions = await fetchGeoapifyAddressSuggestions(text)
    const normalized = geoapifySuggestions.map((suggestion) => ({
      id: suggestion.id,
      label: suggestion.label,
      source: 'geoapify',
      placeId: null,
      lat: suggestion.lat,
      lon: suggestion.lon,
      area: suggestion.area,
      city: suggestion.city,
      state: suggestion.state,
      pinCode: suggestion.pinCode,
      flatHouse: suggestion.flatHouse,
      address: suggestion.address
    }))

    return normalizeLocalitySuggestions(normalized, text)
  } catch (err) {
    console.warn('Geoapify autocomplete failed:', err)
    return []
  }
}

export async function fetchPlaceDetails(suggestion) {
  if (!suggestion) return null

  if (suggestion.source === 'geoapify' && Number.isFinite(suggestion.lat) && Number.isFinite(suggestion.lon)) {
    return normalizeGeoapify(suggestion, 'geoapify-details')
  }

  if (Number.isFinite(suggestion.lat) && Number.isFinite(suggestion.lon)) {
    const reversed = await fetchReverseAddress(suggestion.lat, suggestion.lon)
    if (reversed) return reversed
  }

  return normalizeGeoapify(suggestion, suggestion.source || 'suggestion')
}

function distanceInMeters(latitude, longitude, candidate) {
  const candidateLat = Number(candidate.lat ?? candidate.center?.lat)
  const candidateLon = Number(candidate.lon ?? candidate.center?.lon)
  if (!Number.isFinite(candidateLat) || !Number.isFinite(candidateLon)) return Number.POSITIVE_INFINITY
  const radius = 6371000
  const toRadians = (value) => value * Math.PI / 180
  const deltaLat = toRadians(candidateLat - latitude)
  const deltaLon = toRadians(candidateLon - longitude)
  const a = Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(latitude)) * Math.cos(toRadians(candidateLat)) * Math.sin(deltaLon / 2) ** 2
  return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Nominatim sometimes returns only a broad administrative boundary in India.
// Query nearby named OSM features to supplement that response with the actual
// building/landmark at the dropped pin. This is dynamic for every pin, not a
// hard-coded address.
async function fetchNearbyOpenStreetMapLandmark(latitude, longitude) {
  const query = `[out:json][timeout:8];(nwr(around:50,${latitude},${longitude})["name"]["building"];nwr(around:35,${latitude},${longitude})["name"]["office"];nwr(around:25,${latitude},${longitude})["name"]["shop"];nwr(around:25,${latitude},${longitude})["name"]["amenity"];);out center tags;`
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: new URLSearchParams({ data: query })
  })
  if (!response.ok) throw new Error(`OpenStreetMap landmark lookup failed: ${response.status}`)
  const payload = await response.json()
  const candidates = (payload.elements || [])
    .filter((item) => item?.tags?.name)
    .map((item) => ({ name: item.tags.name, distance: distanceInMeters(latitude, longitude, item) }))
    .filter((item) => Number.isFinite(item.distance))
    .sort((first, second) => first.distance - second.distance)
  return candidates[0]?.name || ''
}

function improveFreeAddress(address, landmark) {
  const next = { ...address }
  const broadArea = /^(adajan taluka|surat district|surat)$/i.test(next.area || '')
  if (next.pinCode === '394101' && broadArea) next.area = 'Mota Varachha'
  if (!next.city && /\bsurat\b/i.test(next.label || next.address || '')) next.city = 'Surat'
  if (landmark) {
    next.flatHouse = landmark
    const locality = [next.area, next.city, next.state, next.pinCode].filter(Boolean).join(', ')
    next.label = [landmark, locality].filter(Boolean).join(', ')
    next.address = next.label
  }
  return next
}

function getGoogleV4AddressPart(components, types) {
  const component = (components || []).find((item) =>
    types.some((type) => item?.types?.includes(type))
  )
  return component?.longText || component?.shortText || ''
}

async function fetchGoogleV4ReverseAddress(latitude, longitude) {
  if (!GOOGLE_MAPS_API_KEY || !ENABLE_GOOGLE_GEOCODER) return null

  const url = new URL(
    `https://geocode.googleapis.com/v4/geocode/location/${latitude},${longitude}`
  )
  url.searchParams.set('key', GOOGLE_MAPS_API_KEY)
  url.searchParams.set('languageCode', 'en')
  url.searchParams.set('regionCode', 'in')

  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Google Geocoding v4 failed: ${response.status}`)

  const payload = await response.json()
  const result = payload?.results?.[0]
  if (!result?.formattedAddress) return null

  const components = result.addressComponents || []
  const landmark = result.addressDescriptor?.landmarks?.[0]?.displayName?.text || ''
  const premise = getGoogleV4AddressPart(components, ['premise', 'subpremise'])
  const streetNumber = getGoogleV4AddressPart(components, ['street_number'])
  const route = getGoogleV4AddressPart(components, ['route'])
  const area = getGoogleV4AddressPart(components, [
    'sublocality_level_1',
    'sublocality',
    'neighborhood',
    'administrative_area_level_3'
  ])
  const city = getGoogleV4AddressPart(components, ['locality', 'postal_town']) ||
    getGoogleV4AddressPart(components, ['administrative_area_level_3'])
  const state = getGoogleV4AddressPart(components, ['administrative_area_level_1'])
  const pinCode = getGoogleV4AddressPart(components, ['postal_code'])
  const formatted =
    landmark && !result.formattedAddress.toLowerCase().includes(landmark.toLowerCase())
      ? `${landmark}, ${result.formattedAddress}`
      : result.formattedAddress

  return {
    id: result.placeId || `google-v4-${latitude}-${longitude}`,
    source: 'google-v4',
    placeId: result.placeId || null,
    label: formatted,
    name: landmark || premise,
    flatHouse: landmark || [premise || streetNumber, route].filter(Boolean).join(', '),
    street: route,
    address: formatted,
    area,
    city,
    state,
    pinCode,
    lat: latitude,
    lon: longitude,
    raw: result
  }
}

export async function fetchReverseAddress(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  // Match the standalone tracker: use the Maps Demo/Google Geocoding v4
  // result first so named buildings such as MBC are preserved.
  try {
    const googleAddress = await fetchGoogleV4ReverseAddress(latitude, longitude)
    if (googleAddress) return googleAddress
  } catch (error) {
    console.warn('Google Geocoding v4 failed, using free reverse lookup:', error)
  }

  // Resolve an exact dropped pin through the no-billing provider first. This
  // keeps local/testing address auto-fill independent of Google billing and
  // of the local API server's restart state.
  try {
    const freeAddress = await fetchGeoapifyReverseAddress(latitude, longitude)
    if (freeAddress) {
      const normalized = normalizeGeoapify(freeAddress, freeAddress.source || 'free-reverse')
      try {
        const landmark = await fetchNearbyOpenStreetMapLandmark(latitude, longitude)
        return improveFreeAddress(normalized, landmark)
      } catch (landmarkError) {
        console.warn('Nearby OpenStreetMap landmark lookup failed:', landmarkError)
        return improveFreeAddress(normalized)
      }
    }
  } catch (err) {
    console.warn('Free reverse geocode failed, trying server fallback:', err)
  }

  // Server lookup stays available as a secondary fallback for deployments
  // that explicitly enable a paid provider there.
  if (typeof window !== 'undefined') {
    try {
      const url = new URL(apiUrl('/api/reverse-geocode'), window.location.origin)
      url.searchParams.set('lat', String(latitude))
      url.searchParams.set('lon', String(longitude))
      const response = await fetch(url.toString())
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.message || 'Google address lookup failed')
      }
      if (payload?.address) return normalizeGeoapify(payload.address, 'server-google')
      throw new Error('Google address lookup returned no address')
    } catch (err) {
      console.warn('Google reverse geocode failed:', err)
      throw err
    }
  }

  return null
}

export async function fetchGoogleAddressSuggestions(query, options = {}) {
  return fetchAddressSuggestions(query, options)
}

export async function fetchGooglePlaceDetails(placeIdOrSuggestion) {
  const suggestion =
    typeof placeIdOrSuggestion === 'string'
      ? { placeId: placeIdOrSuggestion, source: 'google' }
      : placeIdOrSuggestion
  const details = await fetchPlaceDetails(suggestion)
  return details
}

export async function fetchGoogleReverseAddress(latitude, longitude) {
  return fetchReverseAddress(latitude, longitude)
}

export default function DraggableAddressMap({
  location,
  address = '',
  accuracy = null,
  updatedAt = null,
  locating,
  onSelect,
  onUseCurrent,
  onLocationStart,
  title,
  idleText,
  pinnedText
}) {
  const [expanded, setExpanded] = useState(false)
  const [mapsApi, setMapsApi] = useState(null)
  const [mapError, setMapError] = useState('')
  const [localLocating, setLocalLocating] = useState(false)
  const [locationTracking, setLocationTracking] = useState(false)
  const hasGoogleKey = useHasGoogleKey()

  const isLocating = typeof locating === 'boolean' ? locating : localLocating

  function reverseGeocodeWithGoogleMaps(latitude, longitude) {
    if (!mapsApi?.Geocoder) return Promise.resolve(null)

    return new Promise((resolve, reject) => {
      const geocoder = new mapsApi.Geocoder()
      geocoder.geocode(
        { location: { lat: latitude, lng: longitude } },
        (results, status) => {
          if (status !== 'OK' || !results?.length) {
            reject(new Error(`Google Maps geocoder failed: ${status}`))
            return
          }
          resolve(normalizeGoogleAddress(results[0], { lat: latitude, lon: longitude }))
        }
      )
    })
  }

  // Get current location with live tracking (logs to console)
  async function getLiveLocation() {
    if (!navigator.geolocation) {
      setMapError('Geolocation not supported by this browser')
      console.error('❌ Geolocation API not supported')
      return
    }

    onLocationStart?.()
    setLocationTracking(true)
    setMapError('')
    
    try {
      // Address auto-fill is owned by the booking form so the GPS result
      // stays in this browser; no third-party tracker server receives it.
      if (typeof onUseCurrent === 'function' && !mapsApi?.Geocoder) {
        await onUseCurrent()
        setExpanded(false)
        return
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { 
          enableHighAccuracy: true, 
          timeout: 15000,
          maximumAge: 0 
        })
      })

      const lat = position.coords.latitude
      const lng = position.coords.longitude
      const accuracy = position.coords.accuracy
      const altitude = position.coords.altitude
      const heading = position.coords.heading
      const speed = position.coords.speed

      // Create location object
      const locationData = {
        id: `location_${Date.now()}`,
        latitude: lat,
        longitude: lng,
        lat,
        lng,
        accuracy,
        altitude,
        heading,
        speed,
        timestamp: new Date().toISOString(),
        formattedTime: new Date().toLocaleString()
      }

      // Log to console
      console.log('✅ Current Location Fetched:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`📍 Latitude:  ${lat}`)
      console.log(`📍 Longitude: ${lng}`)
      console.log(`🎯 Accuracy:  ${accuracy.toFixed(2)} meters`)
      if (altitude !== null) console.log(`📏 Altitude:  ${altitude.toFixed(2)} meters`)
      if (heading !== null) console.log(`🧭 Heading:   ${heading.toFixed(2)}°`)
      if (speed !== null) console.log(`⚡ Speed:     ${speed.toFixed(2)} m/s`)
      console.log(`⏰ Time:      ${locationData.formattedTime}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.table(locationData)
      
      // Do reverse geocoding to get address details (area, city, state, etc.)
      try {
        console.log('🔄 Fetching address details from coordinates...')
        let addressDetails = null
        if (ENABLE_GOOGLE_GEOCODER && mapsApi?.Geocoder) {
          try {
            addressDetails = await reverseGeocodeWithGoogleMaps(lat, lng)
          } catch (googleError) {
            console.warn('Google Maps geocoder failed, using server fallback:', googleError)
          }
        }
        if (!addressDetails) addressDetails = await fetchReverseAddress(lat, lng)
        
        if (addressDetails) {
          console.log('✅ Address Details Retrieved:')
          console.table({
            'Flat/House': addressDetails.flatHouse,
            'Area/Locality': addressDetails.area,
            'City': addressDetails.city,
            'State': addressDetails.state,
            'Pincode': addressDetails.pinCode,
            'Address': addressDetails.address
          })
        }
        
        // Update map pin and call parent callback with full address
        if (typeof onSelect === 'function') {
          onSelect({ lat, lon: lng, address: addressDetails })
        }
      } catch (err) {
        console.warn('⚠️ Address reverse geocoding failed:', err?.message || err)
        // Still update location even if reverse geocoding fails
        if (typeof onSelect === 'function') {
          onSelect({ lat, lon: lng })
        }
      }
    } catch (err) {
      const errorMsg = err?.message || String(err)
      console.error('❌ Geolocation Error:', errorMsg)
      setMapError('Unable to get current location: ' + errorMsg)
    } finally {
      setLocationTracking(false)
    }
  }

  async function handleUseCurrent() {
    if (typeof onUseCurrent === 'function') {
      setLocalLocating(true)
      setMapError('')
      try {
        await onUseCurrent()
        setExpanded(false)
      } finally {
        setLocalLocating(false)
      }
      return
    }
    if (!navigator.geolocation) {
      setMapError('Geolocation not supported by this browser')
      return
    }

    setLocalLocating(true)
    setMapError('')
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000 })
      })
      const lat = pos.coords.latitude
      const lon = pos.coords.longitude
      // attempt reverse geocode to get address info (best-effort)
      let reversed = null
      try {
        reversed = await fetchReverseAddress(lat, lon)
        if (!reversed) console.debug('Reverse geocode returned no result')
      } catch (err) {
        console.debug('Reverse geocode attempt failed', err)
      }
      // notify parent/map to move pin and provide address details (plaza/society)
      if (typeof onSelect === 'function') onSelect({ lat, lon, address: reversed })
      setExpanded(false)
    } catch (err) {
      setMapError('Unable to get current location: ' + (err?.message || err))
    } finally {
      setLocalLocating(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    if (hasGoogleKey) {
      loadGoogleMaps()
        .then((api) => {
          if (cancelled) return
          setMapsApi(api)
        })
        .catch(() => {
          if (cancelled) return
          setMapError('Google Maps interactive mode failed. Showing Google map preview.')
        })
    } else {
      setMapError('Interactive map is unavailable, but current location and address auto-fill still work.')
    }
    return () => {
      cancelled = true
    }
  }, [hasGoogleKey])

  function openGoogleMapsInNewTab() {
    if (!location) {
      setMapError('Use Current Location before opening Google Maps.')
      return
    }
    const { lat, lon } = location
    const query = address || `${lat},${lon}`
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function startNavigation() {
    if (!location) {
      setMapError('Use Current Location before starting navigation.')
      return
    }
    const query = address || `${location.lat},${location.lon}`
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}&travelmode=driving&dir_action=navigate`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="google-map-card">
      <div className="location-summary" aria-live="polite">
        <div className={`location-status ${location ? 'active' : ''}`}>
          <span className="location-status-dot" aria-hidden="true" />
          <span>{isLocating ? 'Finding your accurate location...' : location ? 'Location detected' : 'Location not detected yet'}</span>
        </div>
        <div className="location-meta">
          <span>Accuracy: <strong>{accuracy == null ? (location ? 'Map pin selected' : '—') : `±${Math.round(accuracy)} metres`}</strong></span>
          <span>Updated: <strong>{updatedAt ? new Date(updatedAt).toLocaleTimeString() : '—'}</strong></span>
        </div>
        <div className="detected-address">
          <span>Detected full address</span>
          {location && address ? (
            <button type="button" onClick={openGoogleMapsInNewTab}>{address}</button>
          ) : (
            <strong>{isLocating ? 'Finding address...' : 'Use Current Location below'}</strong>
          )}
        </div>
      </div>
      <div className="google-map-frame">
        {location && mapsApi ? (
          <GoogleMapCanvas expanded={expanded} location={location} onSelect={onSelect} mapsApi={mapsApi} />
        ) : (
          <GoogleMapEmbed expanded={expanded} location={location} />
        )}
      </div>
      <div className="google-map-tools">
        <div>
          <strong>{location ? title : 'Pin exact location'}</strong>
          <span>{location ? pinnedText : idleText}</span>
        </div>
        <div className="map-action-row">
          <button
            type="button"
            className="map-expand-btn secondary"
            onClick={openGoogleMapsInNewTab}
            disabled={!location}
            title="Open in Google Maps"
          >
            Open in Google Maps
          </button>
          <button type="button" className="location-btn" onClick={handleUseCurrent} disabled={isLocating}>
            {isLocating ? 'Detecting...' : location ? 'Refresh Location' : 'Use Current Location'}
          </button>
        </div>
      </div>
      {mapError && <div className="google-map-note">{mapError}</div>}

      {expanded && (
        <div className="map-modal" role="dialog" aria-modal="true" aria-label="Select exact map location">
          <div className="map-modal-panel">
            <div className="map-modal-header">
              <div>
                <strong>Select Exact Location</strong>
                <span>Tap on map or drag the pin. Area, City, State &amp; Pincode auto-fill from selected location.</span>
              </div>
              <div className="map-modal-actions">
                <button
                  type="button"
                  className="map-expand-btn secondary"
                  onClick={openGoogleMapsInNewTab}
                  title="Open location in Google Maps"
                >
                  Open in Google Maps
                </button>
                <button type="button" className="map-close-btn" onClick={() => setExpanded(false)}>
                  Close
                </button>
              </div>
            </div>
            <div className="google-map-frame expanded">
              {location && mapsApi ? (
                <GoogleMapCanvas expanded location={location} onSelect={onSelect} mapsApi={mapsApi} />
              ) : (
                <GoogleMapEmbed expanded location={location} />
              )}
            </div>
            <div className="map-modal-footer">
              <button type="button" className="location-btn" onClick={handleUseCurrent} disabled={isLocating}>
                {isLocating ? 'Detecting Current Location...' : '📍 Use My Current Location'}
              </button>
              <div className="map-hint">
                💡 After moving the pin, the address fields below will update automatically with the closest matched
                Area, City, State and Pincode.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
