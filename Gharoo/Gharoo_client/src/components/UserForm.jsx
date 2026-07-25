import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './UserForm.css'
import DraggableAddressMap, {
  fetchGoogleAddressSuggestions,
  fetchGooglePlaceDetails,
  fetchGoogleReverseAddress
} from './DraggableAddressMap'

function createMapLink(latitude, longitude) {
  return `https://www.google.com/maps?q=${latitude},${longitude}`
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
  const [localityQuery, setLocalityQuery] = useState(savedData.area || '')
  const [selectedLocation, setSelectedLocation] = useState(() => {
    if (Number.isFinite(savedData.latitude) && Number.isFinite(savedData.longitude)) {
      return { lat: savedData.latitude, lon: savedData.longitude }
    }
    return null
  })
  const [localitySuggestions, setLocalitySuggestions] = useState([])
  const [localityLoading, setLocalityLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [showLocalitySuggestions, setShowLocalitySuggestions] = useState(false)
  const skipLocalityFetch = useRef(false)

  useEffect(() => {
    const query = localityQuery.trim()
    if (skipLocalityFetch.current) {
      skipLocalityFetch.current = false
      return
    }
    if (query.length < 3) {
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      setLocalityLoading(true)
      try {
        setLocalitySuggestions(await fetchGoogleAddressSuggestions(query, { localityOnly: true }))
      } catch (err) {
        if (err.name !== 'AbortError') {
          setLocalitySuggestions([])
        }
      } finally {
        setLocalityLoading(false)
      }
    }, 350)

    return () => {
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [localityQuery])

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  function handleLocalityQueryChange(e) {
    const value = e.target.value
    setLocalityQuery(value)
    setShowLocalitySuggestions(true)
    if (value.trim().length < 3) {
      setLocalitySuggestions([])
      setLocalityLoading(false)
    }
  }

  async function handleLocalitySelect(suggestion) {
    skipLocalityFetch.current = true
    setLocalityQuery(suggestion.label)
    const googleAddress = suggestion.placeId ? await fetchGooglePlaceDetails(suggestion.placeId) : suggestion
    const hasLocation = Number.isFinite(googleAddress?.lat) && Number.isFinite(googleAddress?.lon)
    setFormData({
      ...formData,
      area: googleAddress?.area || formData.area,
      city: googleAddress?.city || formData.city,
      state: googleAddress?.state || formData.state,
      pincode: googleAddress?.pinCode || formData.pincode,
      currentLocation: hasLocation ? createMapLink(googleAddress.lat, googleAddress.lon) : formData.currentLocation
    })
    if (hasLocation) {
      setSelectedLocation({ lat: googleAddress.lat, lon: googleAddress.lon })
      setLocalityQuery(googleAddress.area || googleAddress.label || suggestion.label)
    }
    setLocalitySuggestions([])
    setShowLocalitySuggestions(false)
  }

  function handleAddressType(type) {
    setFormData({ ...formData, addressType: type })
  }

  function applyResolvedAddress(suggestion, latitude, longitude) {
    skipLocalityFetch.current = true
    setLocalityQuery(suggestion?.area || suggestion?.label || `Pinned location: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
    setSelectedLocation({ lat: latitude, lon: longitude })
    setFormData({
      ...formData,
      area: suggestion ? suggestion.area : formData.area,
      city: suggestion ? suggestion.city : formData.city,
      state: suggestion ? suggestion.state : formData.state,
      pincode: suggestion ? suggestion.pinCode : formData.pincode,
      currentLocation: createMapLink(latitude, longitude)
    })
  }

  async function updatePinnedAddress(location) {
    setLocating(true)
    applyResolvedAddress(null, location.lat, location.lon)

    try {
      const suggestion = await fetchGoogleReverseAddress(location.lat, location.lon)
      if (suggestion) {
        applyResolvedAddress(suggestion, location.lat, location.lon)
      }
    } catch {
      applyResolvedAddress(null, location.lat, location.lon)
    } finally {
      setLocating(false)
    }
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

        try {
          const suggestion = await fetchGoogleReverseAddress(latitude, longitude)
          if (suggestion) {
            applyResolvedAddress(suggestion, latitude, longitude)
          }
        } catch {
          applyResolvedAddress(null, latitude, longitude)
        } finally {
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
              <label>Search Area / Locality <span className="required">*</span></label>
              <input
                type="text"
                name="localitySearch"
                value={localityQuery}
                onChange={handleLocalityQueryChange}
                onFocus={() => setShowLocalitySuggestions(true)}
                onBlur={() => window.setTimeout(() => setShowLocalitySuggestions(false), 150)}
                required
                placeholder="Search area, locality or landmark"
              />
              {showLocalitySuggestions && (localityLoading || localitySuggestions.length > 0) && (
                <div className="address-suggestions" role="listbox">
                  {localityLoading && <div className="address-suggestion muted">Searching locality...</div>}
                  {!localityLoading && localitySuggestions.map((suggestion) => (
                    <button type="button" className="address-suggestion" key={suggestion.id} onMouseDown={() => handleLocalitySelect(suggestion)}>
                      <span className="address-source-badge">Locality</span>
                      <span>{suggestion.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <DraggableAddressMap
              location={selectedLocation}
              locating={locating}
              onSelect={updatePinnedAddress}
              onUseCurrent={handleCurrentLocation}
              title="Location pinned"
              idleText="Search area/locality, use GPS, or tap the map."
              pinnedText="Move the pin to fine tune. Flat/building address stays manual."
            />

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

    </div>
  )
}
