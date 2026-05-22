'use client'

// ─── BillingToggle ─────────────────────────────────────────
// Annually / Monthly pill toggle — matches the screenshot design.

interface BillingToggleProps {
  value: 'monthly' | 'yearly'
  onChange: (v: 'monthly' | 'yearly') => void
  /** Discount % shown next to "Annually" when > 0 */
  discountPct?: number | null
}

export function BillingToggle({ value, onChange, discountPct }: BillingToggleProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 p-1 gap-1">
      <button
        type="button"
        onClick={() => onChange('yearly')}
        className={`
          rounded-full px-5 py-1.5 text-sm font-semibold transition-all
          ${value === 'yearly'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900'}
        `}
      >
        Annually
        {discountPct != null && discountPct > 0 && value !== 'yearly' && (
          <span className="ml-1.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">
            -{discountPct}%
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={`
          rounded-full px-5 py-1.5 text-sm font-semibold transition-all
          ${value === 'monthly'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'}
        `}
      >
        Monthly
      </button>
    </div>
  )
}
