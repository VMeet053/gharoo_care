import React, { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ServiceManRegistration() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    idProofType: '',
    idProofNumber: ''
  })
  const [frontImage, setFrontImage] = useState(null)
  const [backImage, setBackImage] = useState(null)
  const [frontImagePreview, setFrontImagePreview] = useState(null)
  const [backImagePreview, setBackImagePreview] = useState(null)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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
        setMessage(data.message)
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          idProofType: '',
          idProofNumber: ''
        })
        setFrontImage(null)
        setBackImage(null)
        setFrontImagePreview(null)
        setBackImagePreview(null)
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
    <div style={{
      minHeight: '100vh',
      padding: '2rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        width: '100%'
      }}>
        <h1 style={{ color: '#1e293b', marginBottom: '1.5rem', textAlign: 'center' }}>
          Service Man Registration
        </h1>

        {message && (
          <div style={{
            background: '#d1fae5',
            color: '#065f46',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#334155', fontWeight: '600' }}>
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  fontSize: '1rem'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#334155', fontWeight: '600' }}>
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#334155', fontWeight: '600' }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.875rem',
                borderRadius: '8px',
                border: '2px solid #e2e8f0',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#334155', fontWeight: '600' }}>
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.875rem',
                borderRadius: '8px',
                border: '2px solid #e2e8f0',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#334155', fontWeight: '600' }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  fontSize: '1rem'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#334155', fontWeight: '600' }}>
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#334155', fontWeight: '600' }}>
                ID Proof Type
              </label>
              <select
                name="idProofType"
                value={formData.idProofType}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  fontSize: '1rem'
                }}
              >
                <option value="">Select ID Proof</option>
                <option value="Pan Card">Pan Card</option>
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="Driving License">Driving License</option>
                <option value="Election Card">Election Card</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#334155', fontWeight: '600' }}>
                ID Proof Number
              </label>
              <input
                type="text"
                name="idProofNumber"
                value={formData.idProofNumber}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          {/* Front ID Proof Image */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#334155', fontWeight: '600' }}>
              Front Side of ID Proof
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFrontImageChange}
              style={{ width: '100%', padding: '0.5rem' }}
            />
            {frontImagePreview && (
              <div style={{ marginTop: '0.5rem' }}>
                <img
                  src={frontImagePreview}
                  alt="Front ID Proof Preview"
                  style={{
                    maxWidth: '200px', borderRadius: '8px', border: '2px solid #e2e8f0' }}
                />
              </div>
            )}
          </div>

          {/* Back ID Proof Image */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#334155', fontWeight: '600' }}>
              Back Side of ID Proof
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleBackImageChange}
              style={{ width: '100%', padding: '0.5rem' }}
            />
            {backImagePreview && (
              <div style={{ marginTop: '0.5rem' }}>
                <img
                  src={backImagePreview}
                  alt="Back ID Proof Preview"
                  style={{
                    maxWidth: '200px', borderRadius: '8px', border: '2px solid #e2e8f0' }}
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              padding: '1rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '0.5rem'
            }}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: '#475569' }}>
            Already registered?{' '}
            <Link
              to="http://localhost:5175/service/login"
              style={{ color: '#4f46e5', fontWeight: '600', textDecoration: 'underline' }}
            >
              Login Here
            </Link>
          </p>
          <p style={{ color: '#475569', marginTop: '0.5rem' }}>
            <Link
              to="/"
              style={{ color: '#334155' }}
            >
              Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
