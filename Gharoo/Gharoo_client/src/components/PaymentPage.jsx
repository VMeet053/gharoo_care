import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './PaymentPage.css'
import { useToast } from './ToastProvider'

const UPI_ID = 'kalpeshgajera3-1@okaxis'
const UPI_NAME = 'Kalpesh Gajera'

function parsePlanAmount(price = '') {
  const amount = Number(String(price).replace(/[^0-9.]/g, ''))
  return Number.isFinite(amount) ? amount : 0
}

function readLocalStorageJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key))
  } catch {
    return null
  }
}

export default function PaymentPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const userFormData = readLocalStorageJson('userFormData')
  const selectedPlan = readLocalStorageJson('selectedPlan')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!userFormData) {
    navigate('/booking')
    return null
  }

  const planAmount = parsePlanAmount(selectedPlan?.price)
  const paymentAmount = planAmount.toFixed(2)
  const customerName = [userFormData.firstName, userFormData.lastName].filter(Boolean).join(' ')
  const transactionNote = `Gharoo Care ${selectedPlan?.name || 'Premium'} Plan`
  const upiUri = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_NAME)}&am=${paymentAmount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiUri)}`

  const handlePayment = async () => {
    if (!selectedPlan || !planAmount) {
      showToast('Please select a plan before payment.', 'warning', 'Plan required')
      return
    }
    if (!userFormData.currentLocation) {
      showToast('Please go back and add current location.', 'warning', 'Current location required')
      return
    }

    setIsSubmitting(true)
    try {
      const leadData = {
        name: customerName,
        phone: userFormData.contactNumber,
        email: userFormData.email,
        houseNumber: userFormData.flatHouse || '',
        address: userFormData.fullAddress || '',
        currentLocation: userFormData.currentLocation || '',
        city: userFormData.city,
        area: userFormData.area,
        service: 'Home Repair',
        status: 'New',
        isPremium: true,
        premiumPlan: selectedPlan.name,
        premiumPrice: selectedPlan.price
      }

      const premiumUserData = {
        name: customerName,
        email: userFormData.email,
        phone: userFormData.contactNumber,
        plan: selectedPlan.name,
        price: selectedPlan.price,
        city: userFormData.city,
        address: userFormData.fullAddress,
        status: 'Payment Pending',
        paymentStatus: 'Pending Approval',
        paymentMethod: 'UPI',
        upiId: UPI_ID,
        paymentName: UPI_NAME,
        transactionNote,
        leadData
      }

      const res = await fetch('/api/premium-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(premiumUserData)
      })

      const data = await res.json()
      if (data.success) {
        showToast('Payment submitted. Admin approval pending.', 'success', 'Payment sent')
        localStorage.removeItem('userFormData')
        localStorage.removeItem('selectedPlan')
        setTimeout(() => navigate('/'), 900)
      } else {
        showToast(data.message || 'Something went wrong. Please try again.', 'error', 'Payment failed')
      }
    } catch (err) {
      console.error(err)
      showToast('Something went wrong. Please try again.', 'error', 'Payment failed')
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
          <p><strong>Name:</strong> {customerName}</p>
          <p><strong>Email:</strong> {userFormData.email}</p>
          <p><strong>Contact:</strong> {userFormData.contactNumber}</p>
          <p><strong>Address:</strong> {userFormData.fullAddress}</p>
          <p><strong>Current Location:</strong> {userFormData.currentLocation ? <a href={userFormData.currentLocation} target="_blank" rel="noreferrer">Open map</a> : 'Required'}</p>
          <p><strong>Plan:</strong> {selectedPlan?.name || '-'}</p>
          <p><strong>Amount:</strong> Rs. {planAmount.toLocaleString('en-IN')}</p>
        </div>

        <div className="upi-payment-panel">
          <div className="upi-payment-copy">
            <h3>Scan & Pay with GPay / UPI</h3>
            <p>Payee: <strong>{UPI_NAME}</strong></p>
            <p>UPI ID: <strong>{UPI_ID}</strong></p>
            <p>Amount: <strong>Rs. {planAmount.toLocaleString('en-IN')}</strong></p>
          </div>
          <div className="qr-box">
            <img src={qrUrl} alt={`UPI QR for Rs. ${planAmount}`} />
            <span>QR includes selected plan amount</span>
          </div>
        </div>

        <button
          onClick={handlePayment}
          className="btn primary btn-shine pay-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'I Have Paid'}
        </button>
        <button onClick={() => navigate('/booking')} className="btn secondary">
          Back to Form
        </button>
      </div>
    </div>
  )
}
