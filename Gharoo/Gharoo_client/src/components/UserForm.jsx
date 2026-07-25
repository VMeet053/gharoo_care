import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './UserForm.css'
import DraggableAddressMap, {
  fetchAddressSuggestions,
  fetchPlaceDetails,
  fetchReverseAddress
} from './DraggableAddressMap'

function createMapLink(latitude, longitude) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
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

function coalesce(...values) {
  for (const v of values) {
    if (typeof v === 'string' ? v.trim() !== '' : v != null) {
      return typeof v === 'string' ? v.trim() : v
    }
  }
  return ''
}

const FIELD_DEFAULTS = {
  firstName: '',
  email: '',
  contactNumber: '',
  altContact: '',
  flatHouse: '',
  area: '',
  city: '',
  state: '',
  pincode: '',
  currentLocation: '',
  addressType: 'Home'
}

export default function UserForm() {
  const navigate = useNavigate()

  const savedData = (() => {
    try {
      return JSON.parse(localStorage.getItem('userFormData')) || {}
    } catch {
      return {}
    }
  })()

  const selectedPlan = (() => {
    try {
      return JSON.parse(localStorage.getItem('selectedPlan')) || null
    } catch {
      return null
    }
  })()

  const [formData, setFormData] = useState({
    ...FIELD_DEFAULTS,
    ...Object.fromEntries(
      Object.entries(FIELD_DEFAULTS).map(([k]) => [k, savedData[k] ?? FIELD_DEFAULTS[k]])
    )
  })

  const [selectedLocation, setSelectedLocation] = useState(() => {
    if (Number.isFinite(savedData.latitude) && Number.isFinite(savedData.longitude)) {
      return { lat: savedData.latitude, lon: savedData.longitude }
    }
    return null
  })

  const [localityQuery, setLocalityQuery] = useState(savedData.area || '')
  const [localitySuggestions, setLocalitySuggestions] = useState([])
  const [localityLoading, setLocalityLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [reverseResolving, setReverseResolving] = useState(false)
  const [showLocalitySuggestions, setShowLocalitySuggestions] = useState(false)
  const skipLocalityFetch = useRef(false)
  const debounceIdRef = useRef(null)
  const reverseIdRef = useRef(null)
  const lastPinNonceRef = useRef(0)

  useEffect(() => {
    return () => {
      if (debounceIdRef.current) window.clearTimeout(debounceIdRef.current)
      if (reverseIdRef.current) window.clearTimeout(reverseIdRef.current)
    }
  }, [])

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleLocalityQueryChange(e) {
    const value = e.target.value
    setLocalityQuery(value)
    setShowLocalitySuggestions(true)
    if (debounceIdRef.current) {
      window.clearTimeout(debounceIdRef.current)
      debounceIdRef.current = null
    }

    const trimmed = value.trim()
    if (trimmed.length < 3) {
      setLocalitySuggestions([])
      setLocalityLoading(false)
      return
    }

    setLocalityLoading(true)
    debounceIdRef.current = window.setTimeout(async () => {
      try {
        const suggestions = await fetchAddressSuggestions(trimmed, { localityOnly: true })
        setLocalitySuggestions(suggestions)
      } catch (err) {
      } finally {
        setLocalityLoading(false)
      }
    }, 380)
  }

  async function applyResolvedSuggestion(suggestion, latitude, longitude) {
    if (skipLocalityFetch.current) skipLocalityFetch.current = false

    const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude)
    const mapLink = hasCoords ? createMapLink(latitude, longitude) : formData.currentLocation

    setFormData((prev) => {
      const nextArea = coalesce(suggestion?.area, prev.area)
      const nextCity = coalesce(suggestion?.city, prev.city)
      const nextState = coalesce(suggestion?.state, prev.state)
      const nextPin = coalesce(suggestion?.pinCode, prev.pincode)
      const nextFlatHouse = coalesce(suggestion?.flatHouse, prev.flatHouse)

      setLocalityQuery((prevQuery) => {
        const queryLabel = suggestion?.area || suggestion?.label
        if (!prevQuery && !queryLabel) return prevQuery
        const best = coalesce(queryLabel, prevQuery)
        return best
      })

      return {
        ...prev,
        flatHouse: nextFlatHouse,
        area: nextArea,
        city: nextCity,
        state: nextState,
        pincode: nextPin,
        currentLocation: mapLink || prev.currentLocation
      }
    })

    if (hasCoords) {
      setSelectedLocation({ lat: latitude, lon: longitude })
    }
  }

  async function handleLocalitySelect(suggestion) {
    setShowLocalitySuggestions(false)
    setLocalitySuggestions([])
    if (debounceIdRef.current) {
      window.clearTimeout(debounceIdRef.current)
      debounceIdRef.current = null
    }

    const fastCoordinates =
      Number.isFinite(suggestion?.lat) && Number.isFinite(suggestion?.lon)
        ? { lat: suggestion.lat, lon: suggestion.lon }
        : null

    if (fastCoordinates) {
      applyResolvedSuggestion(suggestion, fastCoordinates.lat, fastCoordinates.lon)
    }

    try {
      const details = await fetchPlaceDetails(suggestion)
      if (!details) {
        if (!fastCoordinates) {
          alert('Could not load full address details. Please try another suggestion or drag the map pin.')
        }
        return
      }

      applyResolvedSuggestion(
        details,
        Number.isFinite(details.lat) ? details.lat : fastCoordinates?.lat,
        Number.isFinite(details.lon) ? details.lon : fastCoordinates?.lon
      )
    } catch (err) {
      console.warn('Place details failed:', err)
      if (!fastCoordinates) {
        alert('Could not load full address details. Please try another suggestion or drag the map pin.')
      }
    }
  }

  function updatePinnedAddressHandler(location, nonce) {
    applyResolvedSuggestion(null, location.lat, location.lon)
    setReverseResolving(true)

    if (reverseIdRef.current) {
      window.clearTimeout(reverseIdRef.current)
    }

    reverseIdRef.current = window.setTimeout(async () => {
      try {
        const suggestion = await fetchReverseAddress(location.lat, location.lon)
        if (nonce !== lastPinNonceRef.current) return
        if (suggestion) {
          applyResolvedSuggestion(suggestion, location.lat, location.lon)
        }
      } catch (err) {
        console.warn('Reverse geocode failed for pin failed:', err)
      } finally {
          if (nonce === lastPinNonceRef.current) setReverseResolving(false)
        }
    }, 300)
  }

  async function updatePinnedAddress(location) {
    const nonce = ++lastPinNonceRef.current + 1
    lastPinNonceRef.current = nonce
    setLocating(true)
    try {
      updatePinnedAddressHandler(location, nonce)
    } finally {
      setTimeout(() => {
        if (nonce === lastPinNonceRef.current) setLocating(false)
      }, 420)
    }
  }

  async function handleCurrentLocation() {
    if (!navigator.geolocation) {
      alert('Current location is not supported in this browser.')
      return
    }

    const nonce = ++lastPinNonceRef.current + 1
    lastPinNonceRef.current = nonce
    setLocating(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          updatePinnedAddressHandler({ lat: latitude, lon: longitude }, nonce)
          const suggestion = await fetchReverseAddress(latitude, longitude)
          if (nonce !== lastPinNonceRef.current) return
          if (suggestion) {
            applyResolvedSuggestion(suggestion, latitude, longitude)
          }
        } catch (err) {
          console.warn('Reverse geocode for current location failed:', err)
        } finally {
          if (nonce === lastPinNonceRef.current) setLocating(false)
        }
      },
      (error) => {
        if (nonce === lastPinNonceRef.current) setLocating(false)
        alert(getLocationErrorMessage(error))
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    )
  }

  function handleSubmit(e) {
    e.preventDefault()
    const hasPin = selectedLocation && formData.currentLocation.trim()
    if (!hasPin) {
      alert('Please add current location before payment. Use "Use Current Location" or tap on the map to drop a pin.')
      return
    }
    const fullAddressParts = [
      formData.flatHouse?.trim(),
      formData.area?.trim(),
      formData.city?.trim(),
      formData.state?.trim(),
      formData.pincode?.trim()
    ].filter(Boolean)
    const fullAddress = fullAddressParts.join(', ')
    const dataToSave = {
      ...formData,
      fullAddress,
      latitude: selectedLocation?.lat ?? savedData.latitude ?? '',
      longitude: selectedLocation?.lon ?? savedData.longitude ?? ''
    }
    localStorage.setItem('userFormData', JSON.stringify(dataToSave))
    navigate('/payment')
  }

  return (
    <div className="form-container">
      <div className="form-card">
        <aside className="booking-summary">
          <button type="button" className="form-back-btn" onClick={() => navigate('/pricing')}>
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
              <label>Search Area / Locality <span className="required">*</span></label>
              <div className="address-search-wrap">
                <input
                  type="text"
                  name="localitySearch"
                  value={localityQuery}
                  onChange={handleLocalityQueryChange}
                  onFocus={() => setShowLocalitySuggestions(true)}
                  onBlur={() => window.setTimeout(() => setShowLocalitySuggestions(false), 180)}
                  required
                  placeholder="Search area, locality or landmark (e.g. Nana Varachha, Vesu, Pal Road)"
                  autoComplete="off"
                />
                {localityLoading && <span className="search-spinner" aria-hidden="true" />}
              </div>
              {showLocalitySuggestions && (localityLoading || localitySuggestions.length > 0) && (
                <div className="address-suggestions" role="listbox">
                  {localityLoading && <div className="address-suggestion muted">Searching nearby areas...</div>}
                  {!localityLoading &&
                    localitySuggestions.map((suggestion) => (
                      <button
                        type="button"
                        className="address-suggestion"
                        key={suggestion.id}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          handleLocalitySelect(suggestion)
                        }}
                        onTouchStart={() => handleLocalitySelect(suggestion)}
                      >
                        <span className="address-source-badge">
                          {suggestion.source === 'google' ? 'Google' : 'Area'}
                        </span>
                        <span>{suggestion.label}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            <DraggableAddressMap
              location={selectedLocation}
              locating={locating || reverseResolving}
              onSelect={updatePinnedAddress}
              onUseCurrent={handleCurrentLocation}
              title="Location pinned"
              idleText="Search area/locality above, use GPS, or tap the map to drop a pin."
              pinnedText="Move the pin to fine-tune the exact spot. Flat/building stays manual."
            />

            <div className="form-group">
              <label>
                Flat / House / Building <span className="required">*</span>
              </label>
              <input
                type="text"
                name="flatHouse"
                value={formData.flatHouse}
                onChange={handleChange}
                required
                placeholder="C 202, Maruti Residency"
              />
            </div>

            <div className="form-group">
              <label>
                Area / Locality <span className="required">*</span>
              </label>
              <input
                type="text"
                name="area"
                value={formData.area}
                onChange={handleChange}
                required
                placeholder="Auto-filled when you select area above or drop a pin"
              />
            </div>

            <div className="form-group">
              <label>City <span className="required">*</span></label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                placeholder="Surat (auto-filled from pin/area)"
              />
            </div>

            <div className="form-group">
              <label>State <span className="required">*</span></label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                placeholder="Gujarat (auto-filled from pin/area)"
              />
            </div>

            <div className="form-group">
              <label>Pincode <span className="required">*</span></label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                required
                placeholder="6-digit pincode (auto-filled)"
                maxLength={6}
                pattern="[0-9]{6}"
              />
            </div>

            <div className="form-group">
              <label>Type of Address</label>
              <div className="address-type-group">
                <button
                  type="button"
                  className={`address-type-btn ${formData.addressType === 'Home' ? 'active' : ''}`}
                  onClick={() => handleAddressType('Home')}
                >
                  🏠 Home
                </button>
                <button
                  type="button"
                  className={`address-type-btn ${formData.addressType === 'Work' ? 'active' : ''}`}
                  onClick={() => handleAddressType('Work')}
                >
                  💼 Work
                </button>
                <button
                  type="button"
                  className={`address-type-btn ${formData.addressType === 'Other' ? 'active' : ''}`}
                  onClick={() => handleAddressType('Other')}
                >
                  📍 Other
                </button>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn primary btn-shine submit-btn">
              Proceed to Payment →
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  function handleAddressType(type) {
    setFormData((prev) => ({ ...prev, addressType: type }))
  }
}
