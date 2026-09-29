import React from 'react'
import './BrandMarquee.css'

const defaultBrands = [
  'Apple Repair', 'Samsung Service', 'Dell Support', 'HP Certified',
  'Lenovo Fix', 'Asus Care', 'Sony Repair', 'LG Service',
  'Microsoft', 'Google Pixel', 'OnePlus', 'Xiaomi'
]

export default function BrandMarquee({ settings }) {
  const brands = settings?.brandMarquee?.brands?.length > 0 ? settings.brandMarquee.brands : defaultBrands

  return (
    <section className="brand-marquee">
      <div className="marquee-track">
        {[...brands, ...brands].map((brand, i) => (
          <span key={i} className="marquee-item">
            <span className="marquee-dot" />
            {brand}
          </span>
        ))}
      </div>
    </section>
  )
}
