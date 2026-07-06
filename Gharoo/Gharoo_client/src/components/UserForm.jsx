import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './UserForm.css'

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
    addressType: savedData.addressType || 'Home',
  })

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  function handleAddressType(type) {
    setFormData({ ...formData, addressType: type })
  }

  function handleSubmit(e) {
    e.preventDefault()
    const fullAddress = `${formData.flatHouse}, ${formData.area}, ${formData.city}, ${formData.state} - ${formData.pincode}`
    const dataToSave = { ...formData, fullAddress }
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

            <div className="address-section-label">Address Details</div>

            <div className="form-group">
              <label>Flat / House / Building <span className="required">*</span></label>
              <input type="text" name="flatHouse" value={formData.flatHouse} onChange={handleChange} required placeholder="C 202 Many Residency" />
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
              </div>
            </div>
          </div>

          <button type="submit" className="btn primary btn-shine submit-btn">
            Proceed to Payment
          </button>
        </form>
      </div>
    </div>
  )
}
