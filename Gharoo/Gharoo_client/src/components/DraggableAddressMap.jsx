import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const DEFAULT_LOCATION = { lat: 21.1702, lon: 72.8311 }

const pinIcon = L.divIcon({
  className: 'leaflet-pin-icon',
  html: '<span class="leaflet-draggable-pin"></span>',
  iconSize: [32, 42],
  iconAnchor: [16, 42]
})

function MapCanvas({ expanded = false, location, onSelect }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const center = location || DEFAULT_LOCATION

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const zoom = location ? 17 : 12
    const map = L.map(containerRef.current, {
      center: [center.lat, center.lon],
      zoom,
      zoomControl: true,
      attributionControl: false
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map)

    const marker = L.marker([center.lat, center.lon], {
      draggable: true,
      icon: pinIcon
    }).addTo(map)

    marker.on('dragend', () => {
      const next = marker.getLatLng()
      onSelect({ lat: next.lat, lon: next.lng })
    })

    map.on('click', (event) => {
      marker.setLatLng(event.latlng)
      onSelect({ lat: event.latlng.lat, lon: event.latlng.lng })
    })

    mapRef.current = map
    markerRef.current = marker
    setTimeout(() => map.invalidateSize(), 120)

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return

    const nextCenter = location || DEFAULT_LOCATION
    markerRef.current.setLatLng([nextCenter.lat, nextCenter.lon])
    mapRef.current.setView([nextCenter.lat, nextCenter.lon], location ? 17 : 12, {
      animate: true
    })
    setTimeout(() => mapRef.current?.invalidateSize(), 80)
  }, [location?.lat, location?.lon])

  useEffect(() => {
    setTimeout(() => mapRef.current?.invalidateSize(), 160)
  }, [expanded])

  return <div className={`leaflet-map-canvas ${expanded ? 'expanded' : ''}`} ref={containerRef} />
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

  return (
    <div className="google-map-card">
      <div className="google-map-frame">
        <MapCanvas location={location} onSelect={onSelect} />
      </div>
      <div className="google-map-tools">
        <div>
          <strong>{location ? title : 'Pin exact location'}</strong>
          <span>{location ? pinnedText : idleText}</span>
        </div>
        <div className="map-action-row">
          <button type="button" className="map-expand-btn" onClick={() => setExpanded(true)}>
            Expand Map
          </button>
          <button type="button" className="location-btn" onClick={onUseCurrent} disabled={locating}>
            {locating ? 'Detecting...' : 'Use Current Location'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="map-modal" role="dialog" aria-modal="true" aria-label="Select exact map location">
          <div className="map-modal-panel">
            <div className="map-modal-header">
              <div>
                <strong>Select Exact Location</strong>
                <span>Tap on the map or drag the pin. Address below will update and stay editable.</span>
              </div>
              <button type="button" className="map-close-btn" onClick={() => setExpanded(false)}>
                Close
              </button>
            </div>
            <div className="google-map-frame expanded">
              <MapCanvas expanded location={location} onSelect={onSelect} />
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
