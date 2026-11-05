'use client'

import { useState } from 'react'

// Clickable 1-5 star picker
export default function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  const labels = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']

  return (
    <div>
      <div className="flex gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
            className={`text-4xl leading-none transition-colors ${n <= shown ? 'text-amber-400' : 'text-gray-300'}`}
          >
            ★
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-600 mt-1 h-5">{labels[shown]}</p>
    </div>
  )
}