import React, { useEffect, useRef, useState } from 'react'

const DEFAULT_LOCATION = { lat: 21.1702, lon: 72.8311 }
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
let googleMapsPromise

function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google.maps)
  if (!GOOGLE_MAPS_API_KEY) return Promise.reject(new Error('Google Maps API key is missing'))
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
  const lat = typeof latLng?.lat === 'function' ? latLng.lat() : fallbackLocation.lat
  const lon = typeof latLng?.lng === 'function' ? latLng.lng() : fallbackLocation.lon

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

function MapCanvas({ expanded = false, location, onSelect, onReady, mapsApi }) {
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
      draggable: true
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
    onReady?.(map)

    return () => {
      mapsApi.event.clearInstanceListeners(marker)
      mapsApi.event.clearInstanceListeners(map)
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
    }, 120)
  }, [expanded, mapsApi])

  return <div className={`google-map-canvas ${expanded ? 'expanded' : ''}`} ref={containerRef} />
}

export async function fetchGoogleAddressSuggestions(query, options = {}) {
  const text = query.trim()
  if (text.length < 3) return []

  const mapsApi = await loadGoogleMaps()
  const service = new mapsApi.places.AutocompleteService()
  const input = options.localityOnly ? `${text}, Gujarat, India` : text

  return new Promise((resolve) => {
    service.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: 'in' },
        types: options.localityOnly ? ['geocode'] : ['geocode', 'establishment']
      },
      (predictions, status) => {
        if (status !== mapsApi.places.PlacesServiceStatus.OK || !predictions) {
          resolve([])
          return
        }

        resolve(predictions.slice(0, 8).map((prediction) => ({
          id: prediction.place_id,
          label: prediction.description,
          source: 'google',
          placeId: prediction.place_id
        })))
      }
    )
  })
}

export async function fetchGooglePlaceDetails(placeId) {
  const mapsApi = await loadGoogleMaps()
  const container = document.createElement('div')
  const service = new mapsApi.places.PlacesService(container)

  return new Promise((resolve) => {
    service.getDetails(
      {
        placeId,
        fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id']
      },
      (place, status) => {
        if (status !== mapsApi.places.PlacesServiceStatus.OK || !place?.geometry?.location) {
          resolve(null)
          return
        }

        resolve(normalizeGoogleAddress(place, {
          lat: place.geometry.location.lat(),
          lon: place.geometry.location.lng()
        }))
      }
    )
  })
}

export async function fetchGoogleReverseAddress(latitude, longitude) {
  const mapsApi = await loadGoogleMaps()
  const geocoder = new mapsApi.Geocoder()
  const location = { lat: latitude, lng: longitude }

  return new Promise((resolve) => {
    geocoder.geocode({ location }, (results, status) => {
      if (status !== 'OK' || !results?.length) {
        resolve(null)
        return
      }

      resolve(normalizeGoogleAddress(results[0], { lat: latitude, lon: longitude }))
    })
  })
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

  useEffect(() => {
    loadGoogleMaps()
      .then(setMapsApi)
      .catch(() => setMapError('Google Maps API key missing or invalid.'))
  }, [])

  return (
    <div className="google-map-card">
      <div className="google-map-frame">
        {mapsApi ? (
          <MapCanvas location={location} onSelect={onSelect} mapsApi={mapsApi} />
        ) : (
          <div className="google-map-error">{mapError || 'Loading Google Map...'}</div>
        )}
      </div>
      <div className="google-map-tools">
        <div>
          <strong>{location ? title : 'Pin exact location'}</strong>
          <span>{location ? pinnedText : idleText}</span>
        </div>
        <div className="map-action-row">
          <button type="button" className="map-expand-btn" onClick={() => setExpanded(true)} disabled={!mapsApi}>
            Expand Map
          </button>
          <button type="button" className="location-btn" onClick={onUseCurrent} disabled={locating}>
            {locating ? 'Detecting...' : 'Use Current Location'}
          </button>
        </div>
      </div>

      {expanded && mapsApi && (
        <div className="map-modal" role="dialog" aria-modal="true" aria-label="Select exact map location">
          <div className="map-modal-panel">
            <div className="map-modal-header">
              <div>
                <strong>Select Exact Location</strong>
                <span>Tap on Google Map or drag the pin. Same Google location fills below.</span>
              </div>
              <button type="button" className="map-close-btn" onClick={() => setExpanded(false)}>
                Close
              </button>
            </div>
            <div className="google-map-frame expanded">
              <MapCanvas expanded location={location} onSelect={onSelect} mapsApi={mapsApi} />
            </div>
            <button type="button" className="location-btn" onClick={onUseCurrent} disabled={locating}>
              {locating ? 'Detecting...' : 'Use Current Location'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
