import React, { useEffect, useRef, useState } from 'react'
import {
  GEOAPIFY_API_KEY,
  fetchGeoapifyAddressSuggestions,
  fetchGeoapifyReverseAddress
} from '../utils/geoapify'
import { normalizeLocalitySuggestions } from '../utils/localitySearch'

const DEFAULT_LOCATION = { lat: 21.1702, lon: 72.8311 }
const GOOGLE_MAPS_API_KEY = (import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) || ''

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
  const lat = typeof latLng?.lat === 'function' ? latLng.lat() : (fallbackLocation?.lat ?? DEFAULT_LOCATION.lat)
  const lon = typeof latLng?.lng === 'function' ? latLng.lng() : (fallbackLocation?.lon ?? DEFAULT_LOCATION.lon)

  return {
    id: result?.place_id || `${lat},${lon}`,
    label: result?.formatted_address || '',
    name: establishment,
    flatHouse: [premise || streetNumber, route].filter(Boolean).join(', '),
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
    ''
  const state = properties.state || feature.state || ''
  const pinCode = properties.postcode || feature.pinCode || ''
  const flatHouse = [properties.housenumber, properties.street].filter(Boolean).join(', ') || feature.flatHouse || ''
  const formatted =
    properties.formatted || properties.address_line1 || properties.name || feature.label || feature.address || ''

  return {
    id: `${source}-${properties.place_id || properties.osm_id || formatted || Date.now()}`,
    source,
    placeId: feature.placeId || properties.place_id || null,
    label: formatted,
    name: properties.name || feature.name || '',
    flatHouse,
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
  const center = location || DEFAULT_LOCATION

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !mapsApi) return

    const map = new mapsApi.Map(containerRef.current, {
      center: { lat: center.lat, lng: center.lon },
      zoom: location ? 18 : 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
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
    const nextCenter = location || DEFAULT_LOCATION
    const nextLatLng = { lat: nextCenter.lat, lng: nextCenter.lon }
    markerRef.current.setPosition(nextLatLng)
    mapRef.current.setCenter(nextLatLng)
    mapRef.current.setZoom(location ? 18 : 12)
  }, [location?.lat, location?.lon])

  useEffect(() => {
    setTimeout(() => {
      if (!mapRef.current || !mapsApi) return
      mapsApi.event.trigger(mapRef.current, 'resize')
      const nextCenter = location || DEFAULT_LOCATION
      mapRef.current.setCenter({ lat: nextCenter.lat, lng: nextCenter.lon })
    }, 140)
  }, [expanded, mapsApi])

  return <div className={`google-map-canvas ${expanded ? 'expanded' : ''}`} ref={containerRef} />
}

function GoogleMapEmbed({ expanded = false, location }) {
  const center = location || DEFAULT_LOCATION
  const query = `${center.lat},${center.lon}`
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${location ? 17 : 12}&output=embed`

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
      const url = new URL('/api/localities', window.location.origin)
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

  if (GOOGLE_MAPS_API_KEY) {
    try {
      const mapsApi = await loadGoogleMaps()
      const service = new mapsApi.places.AutocompleteService()
      const input = options.localityOnly ? `${text}, India` : text
      const predictions = await new Promise((resolve) => {
        service.getPlacePredictions(
          {
            input,
            componentRestrictions: { country: 'in' },
            types: options.localityOnly ? ['geocode'] : ['geocode', 'establishment', 'address']
          },
          (p, status) => {
            if (status !== mapsApi.places.PlacesServiceStatus.OK || !p) {
              resolve([])
              return
            }
            resolve(p)
          }
        )
      })
      const mapped = predictions.slice(0, 8).map((prediction) => ({
        id: prediction.place_id,
        label: prediction.description,
        source: 'google',
        placeId: prediction.place_id
      }))
      return normalizeLocalitySuggestions(mapped, text)
    } catch (err) {
      console.warn('Google autocomplete failed, falling back to Geoapify:', err)
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

  if (suggestion.placeId && GOOGLE_MAPS_API_KEY) {
    try {
      const mapsApi = await loadGoogleMaps()
      const container = document.createElement('div')
      const service = new mapsApi.places.PlacesService(container)
      const place = await new Promise((resolve) => {
        service.getDetails(
          {
            placeId: suggestion.placeId,
            fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id']
          },
          (p, status) => {
            if (status !== mapsApi.places.PlacesServiceStatus.OK || !p?.geometry?.location) {
              resolve(null)
              return
            }
            resolve(p)
          }
        )
      })
      if (place) {
        return normalizeGoogleAddress(place, {
          lat: place.geometry.location.lat(),
          lon: place.geometry.location.lng()
        })
      }
    } catch (err) {
      console.warn('Google place details failed, falling back:', err)
    }
  }

  if (Number.isFinite(suggestion.lat) && Number.isFinite(suggestion.lon)) {
    const reversed = await fetchReverseAddress(suggestion.lat, suggestion.lon)
    if (reversed) return reversed
  }

  return normalizeGeoapify(suggestion, suggestion.source || 'suggestion')
}

export async function fetchReverseAddress(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  if (GOOGLE_MAPS_API_KEY) {
    try {
      const mapsApi = await loadGoogleMaps()
      const geocoder = new mapsApi.Geocoder()
      const results = await new Promise((resolve) => {
        geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (r, status) => {
          if (status !== 'OK' || !r?.length) {
            resolve([])
            return
          }
          resolve(r)
        })
      })
      if (results?.length) {
        return normalizeGoogleAddress(results[0], { lat: latitude, lon: longitude })
      }
    } catch (err) {
      console.warn('Google reverse geocode failed, falling back to Geoapify:', err)
    }
  }

  try {
    const feature = await fetchGeoapifyReverseAddress(latitude, longitude)
    return normalizeGeoapify(feature, 'reverse')
  } catch (err) {
    console.warn('Geoapify reverse geocode failed:', err)
    return null
  }
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
  locating,
  onSelect,
  onUseCurrent,
  title,
  idleText,
  pinnedText
}) {
  const [expanded, setExpanded] = useState(false)
  const [mapsApi, setMapsApi] = useState(null)
  const [mapError, setMapError] = useState('')
  const [localLocating, setLocalLocating] = useState(false)
<<<<<<< HEAD
=======
  const [currentLocation, setCurrentLocation] = useState(null)
  const [locationTracking, setLocationTracking] = useState(false)
>>>>>>> 5e226ec4bb0a2dd70d82f64bf1727be974108c13
  const hasGoogleKey = useHasGoogleKey()

  const isLocating = typeof locating === 'boolean' ? locating : localLocating

<<<<<<< HEAD
=======
  // Get current location with live tracking (logs to console)
  async function getLiveLocation() {
    if (!navigator.geolocation) {
      setMapError('Geolocation not supported by this browser')
      console.error('❌ Geolocation API not supported')
      return
    }

    setLocationTracking(true)
    setMapError('')
    
    try {
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
      
      setCurrentLocation(locationData)

      // Do reverse geocoding to get address details (area, city, state, etc.)
      try {
        console.log('🔄 Fetching address details from coordinates...')
        const addressDetails = await fetchReverseAddress(lat, lng)
        
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

>>>>>>> 5e226ec4bb0a2dd70d82f64bf1727be974108c13
  async function handleUseCurrent() {
    if (typeof onUseCurrent === 'function') {
      try {
        await onUseCurrent()
      } catch (err) {
        setMapError('Use current location failed: ' + (err?.message || err))
      }
      return
    }
<<<<<<< HEAD
    // prefer hook-provided location (if available) to avoid prompting twice
    if (geolocation && Number.isFinite(geolocation.latitude) && Number.isFinite(geolocation.longitude)) {
      const lat = geolocation.latitude
      const lon = geolocation.longitude
      let reversed = null
      try {
        reversed = await fetchReverseAddress(lat, lon)
        if (!reversed) console.debug('Reverse geocode returned no result')
      } catch (err) {
        console.debug('Reverse geocode attempt failed', err)
      }
      if (typeof onSelect === 'function') onSelect({ lat, lon, address: reversed })
      setExpanded(false)
      return
    }
=======
>>>>>>> 5e226ec4bb0a2dd70d82f64bf1727be974108c13

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
      setMapError('Google Maps API key missing. Showing Google map preview.')
    }
    return () => {
      cancelled = true
    }
  }, [hasGoogleKey])

  function openGoogleMapsInNewTab() {
    const lat = location?.lat ?? DEFAULT_LOCATION.lat
    const lon = location?.lon ?? DEFAULT_LOCATION.lon
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="google-map-card">
<<<<<<< HEAD
=======
      {/* Live Location Display */}
      {currentLocation && (
        <div className="live-location-info" style={{
          padding: '12px 16px',
          marginBottom: '12px',
          backgroundColor: '#e8f5e9',
          borderLeft: '4px solid #4caf50',
          borderRadius: '4px',
          fontSize: '13px',
          fontFamily: 'monospace'
        }}>
          <div style={{ fontWeight: 'bold', color: '#2e7d32', marginBottom: '8px' }}>
            📍 Live Location Tracked
          </div>
          <div>Latitude: <strong>{currentLocation.latitude.toFixed(6)}</strong></div>
          <div>Longitude: <strong>{currentLocation.longitude.toFixed(6)}</strong></div>
          <div>Accuracy: <strong>{currentLocation.accuracy?.toFixed(2)}m</strong></div>
          <div style={{ fontSize: '11px', color: '#555', marginTop: '6px' }}>
            Time: {currentLocation.formattedTime}
          </div>
        </div>
      )}
      
>>>>>>> 5e226ec4bb0a2dd70d82f64bf1727be974108c13
      <div className="google-map-frame">
        {mapsApi ? (
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
            title="Open in Google Maps"
          >
            Open in Google Maps
          </button>
          <button type="button" className="map-expand-btn" onClick={() => setExpanded(true)}>
            Expand Map
          </button>
<<<<<<< HEAD
=======
          <button 
            type="button" 
            className="location-btn" 
            onClick={getLiveLocation} 
            disabled={locationTracking}
            title="Get current location and log to console"
            style={{ backgroundColor: locationTracking ? '#ccc' : '#2196F3' }}
          >
            {locationTracking ? 'Tracking Location...' : '🌍 Get Live Location'}
          </button>
>>>>>>> 5e226ec4bb0a2dd70d82f64bf1727be974108c13
          <button type="button" className="location-btn" onClick={handleUseCurrent} disabled={isLocating}>
            {isLocating ? 'Detecting...' : 'Use Current Location'}
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
              {mapsApi ? (
                <GoogleMapCanvas expanded location={location} onSelect={onSelect} mapsApi={mapsApi} />
              ) : (
                <GoogleMapEmbed expanded location={location} />
              )}
            </div>
            <div className="map-modal-footer">
<<<<<<< HEAD
=======
              <button 
                type="button" 
                className="location-btn" 
                onClick={getLiveLocation} 
                disabled={locationTracking}
                title="Get current location with live tracker"
                style={{ backgroundColor: locationTracking ? '#ccc' : '#2196F3', marginRight: '8px' }}
              >
                {locationTracking ? '🌍 Tracking...' : '🌍 Get Live Location'}
              </button>
>>>>>>> 5e226ec4bb0a2dd70d82f64bf1727be974108c13
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
