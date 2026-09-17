import React from 'react'
import './WhatsAppFloating.css'

function getWhatsAppNumber(settings) {
  const phone = settings?.contact?.phone || '+91 99743 89486'
  const digits = phone.replace(/\D/g, '')

  if (digits.length === 10) {
    return `91${digits}`
  }

  return digits || '919974389486'
}

export default function WhatsAppFloating({ settings }) {
  const phone = getWhatsAppNumber(settings)
  const message = encodeURIComponent('Hello Gharoo Care, I need help with a repair service.')
  const href = `https://wa.me/${phone}?text=${message}`

  return (
    <a
      className="whatsapp-floating"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with Gharoo Care on WhatsApp"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16.02 3.2c-7.03 0-12.75 5.63-12.75 12.56 0 2.2.59 4.36 1.71 6.25L3.2 28.8l6.98-1.74a12.95 12.95 0 0 0 5.84 1.41c7.03 0 12.75-5.63 12.75-12.56S23.05 3.2 16.02 3.2Zm0 22.98c-1.91 0-3.78-.51-5.4-1.47l-.39-.23-4.14 1.03 1.06-4.02-.25-.41a10.2 10.2 0 0 1-1.55-5.32c0-5.67 4.79-10.28 10.67-10.28 5.87 0 10.66 4.61 10.66 10.28 0 5.68-4.79 10.42-10.66 10.42Z" />
        <path d="M21.92 18.49c-.32-.16-1.9-.92-2.2-1.03-.29-.1-.5-.16-.72.16-.21.31-.82 1.02-1.01 1.23-.18.2-.37.23-.69.08-.32-.16-1.35-.49-2.57-1.56-.95-.84-1.59-1.87-1.78-2.18-.18-.31-.02-.48.14-.64.14-.14.32-.37.48-.55.16-.18.21-.31.32-.52.11-.2.05-.39-.03-.55-.08-.16-.72-1.71-.98-2.34-.26-.61-.52-.53-.72-.54h-.61c-.21 0-.55.08-.84.39-.29.31-1.11 1.07-1.11 2.6s1.14 3.01 1.3 3.22c.16.2 2.25 3.38 5.44 4.74.76.32 1.35.51 1.81.65.76.24 1.45.2 2 .12.61-.09 1.9-.76 2.17-1.49.27-.73.27-1.36.19-1.49-.08-.13-.29-.21-.61-.36Z" />
      </svg>
    </a>
  )
}
