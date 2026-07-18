import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './ServiceManRegistration.css'
import { fetchGeoapifyAddressSuggestions } from '../utils/geoapify'

export default function ServiceManRegistration() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    idProofType: '',
    houseNumber: '',
    address: '',
    city: '',
    state: '',
    pinCode: ''
  })
  const [frontImage, setFrontImage] = useState(null)
  const [backImage, setBackImage] = useState(null)
  const [frontImagePreview, setFrontImagePreview] = useState(null)
  const [backImagePreview, setBackImagePreview] = useState(null)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [addressSuggestions, setAddressSuggestions] = useState([])
  const [addressLoading, setAddressLoading] = useState(false)
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false)
  const skipAddressFetch = useRef(false)

  useEffect(() => {
    const address = formData.address.trim()
    if (skipAddressFetch.current) {
      skipAddressFetch.current = false
      return
    }
    if (address.length < 3) {
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      setAddressLoading(true)
      try {
        setAddressSuggestions(await fetchGeoapifyAddressSuggestions(address, controller.signal))
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
  }, [formData.address])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'phone') {
      const cleanValue = value.replace(/\D/g, '').slice(0, 10)
      setFormData(prev => ({ ...prev, [name]: cleanValue }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    if (name === 'address') {
      setShowAddressSuggestions(true)
      if (value.trim().length < 3) {
        setAddressSuggestions([])
        setAddressLoading(false)
      }
    }
  }

  const handleAddressSelect = (feature) => {
    skipAddressFetch.current = true
    setFormData(prev => ({
      ...prev,
      address: feature.address,
      houseNumber: prev.houseNumber,
      city: feature.city,
      state: feature.state,
      pinCode: feature.pinCode
    }))
    setAddressSuggestions([])
    setShowAddressSuggestions(false)
  }

  const handleFrontImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFrontImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setFrontImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBackImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setBackImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setBackImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address!')
      return
    }

    if (formData.phone.length !== 10) {
      setError('Phone number must be exactly 10 digits!')
      return
    }

    if (!formData.address.trim()) {
      setError('Please enter your address!')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long!')
      return
    }

    if (!/\d/.test(formData.password) || !/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      setError('Password must contain at least one number and one special character!')
      return
    }

    setLoading(true)

    try {
      const formDataToSend = new FormData()
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key])
      })
      if (frontImage) {
        formDataToSend.append('frontIdProofImage', frontImage)
      }
      if (backImage) {
        formDataToSend.append('backIdProofImage', backImage)
      }

      const res = await fetch('/api/service-man/register', {
        method: 'POST',
        body: formDataToSend
      })
      const data = await res.json()
      if (data.success) {
        setMessage("Service man registered successfully! Redirecting to login screen...")
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          idProofType: '',
          houseNumber: '',
          address: '',
          city: '',
          state: '',
          pinCode: ''
        })
        setFrontImage(null)
        setBackImage(null)
        setFrontImagePreview(null)
        setBackImagePreview(null)
        setTimeout(() => {
          window.location.href = '/service/login'
        }, 1500)
      } else {
        setError(data.message)
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('Something went wrong, please try again!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-body">
      <div className="register-card">
        <h1 className="register-title">
          Service Man Registration
        </h1>

        {message && (
          <div className="alert-message success">
            {message}
          </div>
        )}
        {error && (
          <div className="alert-message error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-grid">
            <div>
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>House / Flat Number</label>
            <input
              type="text"
              name="houseNumber"
              value={formData.houseNumber}
              onChange={handleChange}
              placeholder="House, flat, floor"
            />
          </div>

          <div className="form-grid">
            <div>
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label>ID Proof Type</label>
            <select
              name="idProofType"
              value={formData.idProofType}
              onChange={handleChange}
              required
            >
              <option value="">Select ID Proof</option>
              <option value="Pan Card">Pan Card</option>
              <option value="Aadhaar Card">Aadhaar Card</option>
              <option value="Driving License">Driving License</option>
              <option value="Election Card">Election Card</option>
            </select>
          </div>

          <div className="address-autocomplete">
            <label>Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              onFocus={() => setShowAddressSuggestions(true)}
              onBlur={() => window.setTimeout(() => setShowAddressSuggestions(false), 150)}
              rows="3"
              required
              placeholder="Search and select your address"
            />
            {showAddressSuggestions && (addressLoading || addressSuggestions.length > 0) && (
              <div className="address-suggestions" role="listbox">
                {addressLoading && <div className="address-suggestion muted">Searching address...</div>}
                {!addressLoading && addressSuggestions.map((feature) => (
                  <button type="button" className="address-suggestion" key={feature.id} onMouseDown={() => handleAddressSelect(feature)}>
                    <span className="address-pin">{feature.source === 'places' ? 'Place' : 'Address'}</span>
                    <span>{feature.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="form-grid">
            <div>
              <label>City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
              />
            </div>
            <div>
              <label>State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="State"
              />
            </div>
          </div>

          <div>
            <label>Pin Code</label>
            <input
              type="text"
              name="pinCode"
              value={formData.pinCode}
              onChange={handleChange}
              placeholder="Pin Code"
            />
          </div>

          {formData.idProofType && (
            <>
              {/* Front ID Proof Image */}
              <div className="upload-box">
                <label className="upload-label">
                  📸 Front Side of ID Proof
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFrontImageChange}
                  required
                  className="file-input"
                />
                {frontImagePreview && (
                  <div style={{ marginTop: '1rem' }}>
                    <img
                      src={frontImagePreview}
                      alt="Front ID Proof Preview"
                      className="preview-image"
                      decoding="async"
                    />
                  </div>
                )}
              </div>

              {/* Back ID Proof Image */}
              <div className="upload-box">
                <label className="upload-label">
                  📸 Back Side of ID Proof
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBackImageChange}
                  required
                  className="file-input"
                />
                {backImagePreview && (
                  <div style={{ marginTop: '1rem' }}>
                    <img
                      src={backImagePreview}
                      alt="Back ID Proof Preview"
                      className="preview-image"
                      decoding="async"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-submit"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Already registered?{' '}
            <a href="/service/login">
              Login Here
            </a>
          </p>
          <p>
            <Link to="/">
              Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
