import React, { useEffect, useRef, useState } from 'react'
import {
  GEOAPIFY_API_KEY,
  fetchGeoapifyAddressSuggestions,
  fetchGeoapifyReverseAddress
} from '../utils/geoapify'

const DEFAULT_LOCATION = { lat: 21.1702, lon: 72.8311 }
const GOOGLE_MAPS_API_KEY = (import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) || ''

let googleMapsPromise
let leafletPromise

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

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L)
  if (leafletPromise) return leafletPromise

  leafletPromise = new Promise((resolve, reject) => {
    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    css.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
    css.crossOrigin = ''

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
    script.crossOrigin = ''
    script.async = false

    css.onerror = () => reject(new Error('Leaflet CSS failed to load'))
    script.onerror = () => reject(new Error('Leaflet JS failed to load'))
    script.onload = () => resolve(window.L)

    document.head.appendChild(css)
    document.head.appendChild(script)
  })

  return leafletPromise
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

function LeafletMapCanvas({ expanded = false, location, onSelect }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const center = location || DEFAULT_LOCATION

  useEffect(() => {
    let cancelled = false
    if (!containerRef.current || mapRef.current) return

    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current) return
        const tileUrl =
          'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        const map = L.map(containerRef.current, {
          center: [center.lat, center.lon],
          zoom: location ? 18 : 12,
          zoomControl: true,
          attributionControl: false
        })
        L.tileLayer(tileUrl, {
          maxZoom: 20,
          subdomains: 'abcd',
          attribution: '© OpenStreetMap © CARTO'
        }).addTo(map)

        const icon = L.divIcon({
          className: 'gharoo-map-marker',
          html: `<div style="transform:translate(-50%,-100%);">
            <svg viewBox="0 0 32 40" width="36" height="44" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,.25));">
              <path d="M16 1C9 1 4 6 4 13 C4 21 16 38 16 38 C16 38 28 21 28 13 C28 6 23 1 16 1 Z" fill="#166534" stroke="white" stroke-width="1.5"/>
              <circle cx="16" cy="13" r="4.5" fill="white"/>
              <circle cx="16" cy="13" r="2.3" fill="#166534"/>
            </svg>
          </div>`,
          iconSize: [36, 44],
          iconAnchor: [18, 44]
        })

        const marker = L.marker([center.lat, center.lon], {
          draggable: true,
          icon,
          autoPan: true
        }).addTo(map)

        marker.on('dragend', () => {
          const pos = marker.getLatLng()
          onSelect({ lat: pos.lat, lon: pos.lng })
        })
        map.on('click', (e) => {
          marker.setLatLng(e.latlng)
          onSelect({ lat: e.latlng.lat, lon: e.latlng.lng })
        })

        mapRef.current = map
        markerRef.current = marker
      })
      .catch((err) => {
        console.error('Leaflet load error:', err)
      })

    return () => {
      cancelled = true
      if (mapRef.current) {
        try {
          mapRef.current.remove()
        } catch {}
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return
    const nextCenter = location || DEFAULT_LOCATION
    const nextLatLng = [nextCenter.lat, nextCenter.lon]
    markerRef.current.setLatLng(nextLatLng)
    mapRef.current.setView(nextLatLng, location ? 18 : 12)
  }, [location?.lat, location?.lon])

  useEffect(() => {
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize({ animate: false })
        const nextCenter = location || DEFAULT_LOCATION
        mapRef.current.setView([nextCenter.lat, nextCenter.lon])
      }
    }, 160)
  }, [expanded])

  return (
    <>
      <style>{`
        .google-map-canvas.leaflet-container-expanded { position: relative; }
        .leaflet-container { background: #e6eef8; }
        .gharoo-map-marker { background: transparent; border: 0; }
      `}</style>
      <div className={`google-map-canvas ${expanded ? 'expanded' : ''}`} ref={containerRef} />
    </>
  )
}

export async function fetchAddressSuggestions(query, options = {}) {
  const text = (query || '').trim()
  if (text.length < 3) return []

  if (GOOGLE_MAPS_API_KEY) {
    try {
      const mapsApi = await loadGoogleMaps()
      const service = new mapsApi.places.AutocompleteService()
      const input = options.localityOnly ? `${text}, Gujarat, India` : text
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
      return predictions.slice(0, 8).map((prediction) => ({
        id: prediction.place_id,
        label: prediction.description,
        source: 'google',
        placeId: prediction.place_id
      }))
    } catch (err) {
      console.warn('Google autocomplete failed, falling back to Geoapify:', err)
    }
  }

  try {
    const geoapifySuggestions = await fetchGeoapifyAddressSuggestions(text)
    return geoapifySuggestions.map((suggestion) => ({
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
  const [useLeaflet, setUseLeaflet] = useState(false)
  const [mapError, setMapError] = useState('')
  const hasGoogleKey = useHasGoogleKey()

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
          setUseLeaflet(true)
          setMapError('')
        })
    } else {
      setUseLeaflet(true)
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
      <div className="google-map-frame">
        {useLeaflet ? (
          <LeafletMapCanvas expanded={expanded} location={location} onSelect={onSelect} />
        ) : mapsApi ? (
          <GoogleMapCanvas expanded={expanded} location={location} onSelect={onSelect} mapsApi={mapsApi} />
        ) : (
          <div className="google-map-error">{mapError || 'Loading Map...'}</div>
        )}
      </div>
      <div className="google-map-tools">
        <div>
          <strong>{location ? title : 'Pin exact location'}</strong>
          <span>{location ? pinnedText : idleText}</span>
        </div>
        <div className="map-action-row">
          {!useLeaflet && (
            <button
              type="button"
              className="map-expand-btn secondary"
              onClick={openGoogleMapsInNewTab}
              title="Open in Google Maps"
            >
              Open in Google Maps
            </button>
          )}
          <button type="button" className="map-expand-btn" onClick={() => setExpanded(true)}>
            Expand Map
          </button>
          <button type="button" className="location-btn" onClick={onUseCurrent} disabled={locating}>
            {locating ? 'Detecting...' : 'Use Current Location'}
          </button>
        </div>
      </div>

      {expanded && (useLeaflet || mapsApi) && (
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
              {useLeaflet ? (
                <LeafletMapCanvas expanded location={location} onSelect={onSelect} />
              ) : (
                <GoogleMapCanvas expanded location={location} onSelect={onSelect} mapsApi={mapsApi} />
              )}
            </div>
            <div className="map-modal-footer">
              <button type="button" className="location-btn" onClick={onUseCurrent} disabled={locating}>
                {locating ? 'Detecting Current Location...' : '📍 Use My Current Location'}
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
