import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './UserForm.css'
import { fetchGeoapifyAddressSuggestions, fetchGeoapifyReverseAddress } from '../utils/geoapify'

const DEFAULT_MAP_LOCATION = { lat: 21.1702, lon: 72.8311 }
const MAP_DRAG_SPAN = { lat: 0.012, lon: 0.012 }

function createMapLink(latitude, longitude) {
  return `https://www.google.com/maps?q=${latitude},${longitude}`
}

function createGoogleMapEmbedUrl(location) {
  if (!location) return 'https://maps.google.com/maps?q=Surat,Gujarat,India&z=12&output=embed'

  const lat = Number(location.lat)
  const lon = Number(location.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return 'https://maps.google.com/maps?q=Surat,Gujarat,India&z=12&output=embed'
  }

  return `https://maps.google.com/maps?q=${lat},${lon}&z=17&output=embed`
}

function getPointFromEvent(event, element) {
  const rect = element.getBoundingClientRect()
  return {
    x: Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100)),
    y: Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100))
  }
}

function getLocationFromPin(center, point) {
  return {
    lat: center.lat + ((50 - point.y) / 100) * MAP_DRAG_SPAN.lat,
    lon: center.lon + ((point.x - 50) / 100) * MAP_DRAG_SPAN.lon
  }
}

function getLocationErrorMessage(error) {
  if (error?.code === 1) {
    return 'Location permission is blocked. Please allow location access from browser settings.'
  }
  if (error?.code === 2) {
    return 'Could not detect your location. Please check GPS/network and try again.'
  }
  if (error?.code === 3) {
    return 'Location detection timed out. Please try again.'
  }
  return 'Could not get current location. Please allow location permission and try again.'
}

export default function UserForm() {
  const navigate = useNavigate()

  const savedData = (() => {
    try { return JSON.parse(localStorage.getItem('userFormData')) || {} } catch { return {} }
  })()

  const selectedPlan = (() => {
    try { return JSON.parse(localStorage.getItem('selectedPlan')) || null } catch { return null }
  })()

  const [formData, setFormData] = useState({
    firstName: savedData.firstName || '',
    email: savedData.email || '',
    contactNumber: savedData.contactNumber || '',
    altContact: savedData.altContact || '',
    flatHouse: savedData.flatHouse || '',
    area: savedData.area || '',
    city: savedData.city || '',
    state: savedData.state || '',
    pincode: savedData.pincode || '',
    currentLocation: savedData.currentLocation || '',
    addressType: savedData.addressType || 'Home',
  })
  const [addressQuery, setAddressQuery] = useState(savedData.fullAddress || '')
  const [selectedLocation, setSelectedLocation] = useState(() => {
    if (Number.isFinite(savedData.latitude) && Number.isFinite(savedData.longitude)) {
      return { lat: savedData.latitude, lon: savedData.longitude }
    }
    return null
  })
  const [addressSuggestions, setAddressSuggestions] = useState([])
  const [addressLoading, setAddressLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [pinPosition, setPinPosition] = useState({ x: 50, y: 50 })
  const [pinDragging, setPinDragging] = useState(false)
  const [mapExpanded, setMapExpanded] = useState(false)
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false)
  const mapFrameRef = useRef(null)
  const pinDraggingRef = useRef(false)
  const skipAddressFetch = useRef(false)
  const googleMapUrl = createGoogleMapEmbedUrl(selectedLocation)
  const mapCenter = selectedLocation || DEFAULT_MAP_LOCATION

  useEffect(() => {
    const query = addressQuery.trim()
    if (skipAddressFetch.current) {
      skipAddressFetch.current = false
      return
    }
    if (query.length < 3) {
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      setAddressLoading(true)
      try {
        setAddressSuggestions(await fetchGeoapifyAddressSuggestions(query, controller.signal))
      } catch (err) {
        if (err.name !== 'AbortError') {
          setAddressSuggestions([])
        }
      } finally {
        setAddressLoading(false)
      }
    }, 350)

    return () => {
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [addressQuery])

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  function handleAddressQueryChange(e) {
    const value = e.target.value
    setAddressQuery(value)
    setShowAddressSuggestions(true)
    if (value.trim().length < 3) {
      setAddressSuggestions([])
      setAddressLoading(false)
    }
  }

  function handleAddressSelect(suggestion) {
    skipAddressFetch.current = true
    setAddressQuery(suggestion.label)
    const hasLocation = Number.isFinite(suggestion.lat) && Number.isFinite(suggestion.lon)
    setPinPosition({ x: 50, y: 50 })
    setFormData({
      ...formData,
      flatHouse: suggestion.name || suggestion.address,
      area: suggestion.area,
      city: suggestion.city,
      state: suggestion.state,
      pincode: suggestion.pinCode,
      currentLocation: hasLocation ? createMapLink(suggestion.lat, suggestion.lon) : formData.currentLocation
    })
    if (hasLocation) {
      setSelectedLocation({ lat: suggestion.lat, lon: suggestion.lon })
    }
    setAddressSuggestions([])
    setShowAddressSuggestions(false)
  }

  function handleAddressType(type) {
    setFormData({ ...formData, addressType: type })
  }

  function applyResolvedAddress(suggestion, latitude, longitude) {
    skipAddressFetch.current = true
    setAddressQuery(suggestion?.label || `Pinned location: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
    setSelectedLocation({ lat: latitude, lon: longitude })
    setPinPosition({ x: 50, y: 50 })
    setFormData({
      ...formData,
      flatHouse: suggestion?.name || formData.flatHouse,
      area: suggestion?.area || formData.area,
      city: suggestion?.city || formData.city,
      state: suggestion?.state || formData.state,
      pincode: suggestion?.pinCode || formData.pincode,
      currentLocation: createMapLink(latitude, longitude)
    })
  }

  async function updatePinnedAddress(point) {
    const pinnedLocation = getLocationFromPin(mapCenter, point)
    setLocating(true)
    applyResolvedAddress(null, pinnedLocation.lat, pinnedLocation.lon)

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 7000)
    try {
      const suggestion = await fetchGeoapifyReverseAddress(pinnedLocation.lat, pinnedLocation.lon, controller.signal)
      if (suggestion) {
        applyResolvedAddress(suggestion, pinnedLocation.lat, pinnedLocation.lon)
      }
    } catch {
      applyResolvedAddress(null, pinnedLocation.lat, pinnedLocation.lon)
    } finally {
      window.clearTimeout(timeoutId)
      setLocating(false)
    }
  }

  function handleMapPointerDown(event) {
    if (!mapFrameRef.current) return
    event.preventDefault()
    const point = getPointFromEvent(event, mapFrameRef.current)
    pinDraggingRef.current = true
    setPinDragging(true)
    setPinPosition(point)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleMapPointerMove(event) {
    if (!pinDraggingRef.current || !mapFrameRef.current) return
    setPinPosition(getPointFromEvent(event, mapFrameRef.current))
  }

  function handleMapPointerUp(event) {
    if (!pinDraggingRef.current || !mapFrameRef.current) return
    const point = getPointFromEvent(event, mapFrameRef.current)
    pinDraggingRef.current = false
    setPinDragging(false)
    setPinPosition(point)
    updatePinnedAddress(point)
  }

  function handleCurrentLocation() {
    if (!navigator.geolocation) {
      alert('Current location is not supported in this browser.')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        applyResolvedAddress(null, latitude, longitude)
        const controller = new AbortController()
        const timeoutId = window.setTimeout(() => controller.abort(), 7000)

        try {
          const suggestion = await fetchGeoapifyReverseAddress(latitude, longitude, controller.signal)
          if (suggestion) {
            applyResolvedAddress(suggestion, latitude, longitude)
          }
        } catch {
          applyResolvedAddress(null, latitude, longitude)
        } finally {
          window.clearTimeout(timeoutId)
          setLocating(false)
        }
      },
      (error) => {
        setLocating(false)
        alert(getLocationErrorMessage(error))
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    )
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!formData.currentLocation.trim()) {
      alert('Please add current location before payment.')
      return
    }
    const fullAddress = `${formData.flatHouse}, ${formData.area}, ${formData.city}, ${formData.state} - ${formData.pincode}`
    const dataToSave = {
      ...formData,
      fullAddress,
      latitude: selectedLocation?.lat || '',
      longitude: selectedLocation?.lon || ''
    }
    localStorage.setItem('userFormData', JSON.stringify(dataToSave))
    navigate('/payment')
  }

  return (
    <div className="form-container">
      <div className="form-card">
        <aside className="booking-summary">
          <button
            type="button"
            className="form-back-btn"
            onClick={() => navigate('/pricing')}
          >
            Back to Plans
          </button>
          <span className="booking-kicker">Selected Plan</span>
          <h2>{selectedPlan?.name || 'Book Your Plan'}</h2>
          <div className="booking-price">{selectedPlan?.price || 'Choose a plan'}</div>
          <p>Share your contact and service address. We will confirm the slot before payment.</p>
          <div className="booking-summary-list">
            <span>Priority technician assignment</span>
            <span>Doorstep pickup support</span>
            <span>Secure payment checkout</span>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="booking-form">
          <div className="booking-form-header">
            <span>Booking Details</span>
            <h1>Complete Your Booking</h1>
          </div>

          <div className="booking-fields">
            <div className="form-group">
              <label>First Name <span className="required">*</span></label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required placeholder="Enter your first name" />
            </div>

            <div className="form-group">
              <label>Email Address <span className="required">*</span></label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Enter your email" />
            </div>

            <div className="form-group">
              <label>10-digit Mobile Number <span className="required">*</span></label>
              <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required placeholder="Mobile number" maxLength={10} pattern="[0-9]{10}" />
            </div>

            <div className="form-group">
              <label>Alternate Phone <span className="optional">(Optional)</span></label>
              <input type="tel" name="altContact" value={formData.altContact} onChange={handleChange} placeholder="Alternate number" maxLength={10} />
            </div>

            <div className="address-section-label">Delivery Address</div>

            <div className="form-group address-search-group">
              <label>Search Address / Place <span className="required">*</span></label>
              <input
                type="text"
                name="addressSearch"
                value={addressQuery}
                onChange={handleAddressQueryChange}
                onFocus={() => setShowAddressSuggestions(true)}
                onBlur={() => window.setTimeout(() => setShowAddressSuggestions(false), 150)}
                required
                placeholder="Search society, building, shop or full address"
              />
              {showAddressSuggestions && (addressLoading || addressSuggestions.length > 0) && (
                <div className="address-suggestions" role="listbox">
                  {addressLoading && <div className="address-suggestion muted">Searching address...</div>}
                  {!addressLoading && addressSuggestions.map((suggestion) => (
                    <button type="button" className="address-suggestion" key={suggestion.id} onMouseDown={() => handleAddressSelect(suggestion)}>
                      <span className="address-source-badge">{suggestion.source === 'places' ? 'Place' : 'Address'}</span>
                      <span>{suggestion.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="google-map-card">
              <div className="google-map-frame" ref={mapFrameRef}>
                <iframe
                  title="Google map selected service location"
                  src={googleMapUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div
                  className={`map-drag-layer ${pinDragging ? 'dragging' : ''}`}
                  onPointerDown={handleMapPointerDown}
                  onPointerMove={handleMapPointerMove}
                  onPointerUp={handleMapPointerUp}
                  onPointerCancel={() => {
                    pinDraggingRef.current = false
                    setPinDragging(false)
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="Move map pin"
                >
                  <span
                    className="draggable-map-pin"
                    style={{ left: `${pinPosition.x}%`, top: `${pinPosition.y}%` }}
                  />
                </div>
              </div>
              <div className="google-map-tools">
                <div>
                  <strong>{formData.currentLocation ? 'Location pinned' : 'Pin exact service location'}</strong>
                  <span>{formData.currentLocation ? 'Drag the pin to fine tune. Address below stays editable.' : 'Search your society/building, use GPS, or drag the pin on map.'}</span>
                </div>
                <div className="map-action-row">
                  <button type="button" className="map-expand-btn" onClick={() => setMapExpanded(true)}>
                    Expand Map
                  </button>
                  <button type="button" className="location-btn" onClick={handleCurrentLocation} disabled={locating}>
                    {locating ? 'Detecting...' : 'Use Current Location'}
                  </button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Flat / House / Building <span className="required">*</span></label>
              <input type="text" name="flatHouse" value={formData.flatHouse} onChange={handleChange} required placeholder="C 202, Maruti Residency" />
            </div>

            <div className="form-group">
              <label>Area / Locality <span className="required">*</span></label>
              <input type="text" name="area" value={formData.area} onChange={handleChange} required placeholder="Nana Varachha, Near XYZ" />
            </div>

            <div className="form-group">
              <label>City <span className="required">*</span></label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} required placeholder="Surat" />
            </div>

            <div className="form-group">
              <label>State <span className="required">*</span></label>
              <input type="text" name="state" value={formData.state} onChange={handleChange} required placeholder="Gujarat" />
            </div>

            <div className="form-group">
              <label>Pincode <span className="required">*</span></label>
              <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} required placeholder="6-digit pincode" maxLength={6} pattern="[0-9]{6}" />
            </div>

            <div className="form-group">
              <label>Type of Address</label>
              <div className="address-type-group">
                <button type="button" className={`address-type-btn ${formData.addressType === 'Home' ? 'active' : ''}`} onClick={() => handleAddressType('Home')}>
                  Home
                </button>
                <button type="button" className={`address-type-btn ${formData.addressType === 'Work' ? 'active' : ''}`} onClick={() => handleAddressType('Work')}>
                  Work
                </button>
                <button type="button" className={`address-type-btn ${formData.addressType === 'Other' ? 'active' : ''}`} onClick={() => handleAddressType('Other')}>
                  Other
                </button>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn primary btn-shine submit-btn">
              Proceed to Payment
            </button>
          </div>
        </form>
      </div>

      {mapExpanded && (
        <div className="map-modal" role="dialog" aria-modal="true" aria-label="Select exact map location">
          <div className="map-modal-panel">
            <div className="map-modal-header">
              <div>
                <strong>Select Exact Location</strong>
                <span>Tap or drag the pin, then edit address below.</span>
              </div>
              <button type="button" className="map-close-btn" onClick={() => setMapExpanded(false)}>
                Close
              </button>
            </div>
            <div className="google-map-frame expanded" ref={mapFrameRef}>
              <iframe
                title="Expanded Google map selected service location"
                src={googleMapUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div
                className={`map-drag-layer ${pinDragging ? 'dragging' : ''}`}
                onPointerDown={handleMapPointerDown}
                onPointerMove={handleMapPointerMove}
                onPointerUp={handleMapPointerUp}
                onPointerCancel={() => {
                  pinDraggingRef.current = false
                  setPinDragging(false)
                }}
                role="button"
                tabIndex={0}
                aria-label="Move map pin"
              >
                <span
                  className="draggable-map-pin"
                  style={{ left: `${pinPosition.x}%`, top: `${pinPosition.y}%` }}
                />
              </div>
            </div>
            <button type="button" className="location-btn" onClick={handleCurrentLocation} disabled={locating}>
              {locating ? 'Detecting...' : 'Use Current Location'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
