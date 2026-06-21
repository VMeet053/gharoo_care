import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './PaymentPage.css'

export default function PaymentPage() {
  const navigate = useNavigate()
  const userFormData = JSON.parse(localStorage.getItem('userFormData'))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')

  if (!userFormData) {
    navigate('/booking')
    return null
  }

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      alert('Please select a payment method!')
      return
    }
    setIsSubmitting(true)
    try {
      const leadData = {
        name: `${userFormData.firstName} ${userFormData.lastName}`,
        phone: userFormData.contactNumber,
        email: userFormData.email,
        city: userFormData.fullAddress,
        area: userFormData.fullAddress,
        service: 'Home Repair',
        status: 'New'
      }

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      })

      const data = await res.json()
      if (data.success) {
        // Also register as a premium user
        try {
          const selectedPlan = JSON.parse(localStorage.getItem('selectedPlan')) || { name: 'Premium', price: '$19.99' };
          const premiumUserData = {
            name: `${userFormData.firstName} ${userFormData.lastName}`,
            email: userFormData.email,
            phone: userFormData.contactNumber,
            plan: selectedPlan.name,
            price: selectedPlan.price,
            city: userFormData.fullAddress,
            address: userFormData.fullAddress
          };
          await fetch('/api/premium-users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(premiumUserData)
          });
        } catch (premiumErr) {
          console.error('Failed to register premium user:', premiumErr);
        }

        alert('Booking confirmed! We will contact you soon!')
        localStorage.removeItem('userFormData')
        localStorage.removeItem('selectedPlan')
        navigate('/')
      } else {
        alert('Something went wrong! Please try again!')
      }
    } catch (err) {
      console.error(err)
      alert('Something went wrong! Please try again!')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="payment-container">
      <div className="payment-card">
        <h2>Payment Details</h2>
        
        <div className="user-details">
          <h3>Booking Summary</h3>
          <p><strong>Name:</strong> {userFormData.firstName} {userFormData.lastName}</p>
          <p><strong>Email:</strong> {userFormData.email}</p>
          <p><strong>Contact:</strong> {userFormData.contactNumber}</p>
          <p><strong>Address:</strong> {userFormData.fullAddress}</p>
        </div>

        <div className="payment-methods">
          <h3>Select Payment Method</h3>
          <div className="payment-options">
            <button 
              className={`payment-option ${selectedPaymentMethod === 'card' ? 'selected' : ''}`}
              onClick={() => setSelectedPaymentMethod('card')}
            >
              <span className="icon">💳</span> Credit/Debit Card
            </button>
            <button 
              className={`payment-option ${selectedPaymentMethod === 'upi' ? 'selected' : ''}`}
              onClick={() => setSelectedPaymentMethod('upi')}
            >
              <span className="icon">📱</span> UPI
            </button>
            <button 
              className={`payment-option ${selectedPaymentMethod === 'netbanking' ? 'selected' : ''}`}
              onClick={() => setSelectedPaymentMethod('netbanking')}
            >
              <span className="icon">🏦</span> Net Banking
            </button>
            <button 
              className={`payment-option ${selectedPaymentMethod === 'cod' ? 'selected' : ''}`}
              onClick={() => setSelectedPaymentMethod('cod')}
            >
              <span className="icon">💵</span> Cash on Delivery
            </button>
          </div>
        </div>

        <button 
          onClick={handlePayment} 
          className="btn primary btn-shine pay-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Confirm & Pay'}
        </button>
        <button onClick={() => navigate('/booking')} className="btn secondary">
          Back to Form
        </button>
      </div>
    </div>
  )
}
