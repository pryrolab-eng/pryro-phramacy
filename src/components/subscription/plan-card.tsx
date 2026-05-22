'use client'

import Link from 'next/link'
import { Check, Crown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SubscriptionPlan } from '@/lib/saas/types'

// ─── Props ────────────────────────────────────────────────

export interface PlanCardProps {
  plan: SubscriptionPlan
  billingCycle: 'monthly' | 'yearly'
  isCurrent: boolean
  isPending?: boolean
  onSelect: (plan: SubscriptionPlan) => void
  /**
   * When set, the CTA renders as a <Link> to this href instead of a <Button>.
   * Used on the public pricing page where clicking goes to sign-up.
   */
  ctaHref?: string
}

// ─── Helpers ──────────────────────────────────────────────

function formatPrice(amount: number): string {
  if (amount === 0) return 'Free'
  // Show in thousands for RWF readability: 50000 → "50K"
  if (amount >= 1000) return `${Math.round(amount / 1000)}K`
  return amount.toLocaleString()
}

// ─── Component ────────────────────────────────────────────

export function PlanCard({ plan, billingCycle, isCurrent, isPending, onSelect, ctaHref }: PlanCardProps) {
  const yearlyPrice = plan.yearly_price != null && plan.yearly_price > 0 ? plan.yearly_price : 0
  const showYearly = billingCycle === 'yearly' && plan.price > 0 && yearlyPrice > 0
  const displayPrice = showYearly ? yearlyPrice : plan.price
  const displayPeriod = showYearly ? 'yr' : plan.billing_period === 'free' ? '' : 'mo'
  const yearlySavings = plan.price > 0 && yearlyPrice > 0
    ? Math.round(((plan.price * 12 - yearlyPrice) / (plan.price * 12)) * 100)
    : 0

  const isPopular = plan.is_popular
  const isFree = displayPrice === 0
  const isEnterprise = plan.price === 0 && plan.billing_period !== 'free'

  // CTA label
  const ctaLabel = isCurrent
    ? 'Current Plan'
    : isFree
      ? `Try ${plan.name} free`
      : isEnterprise
        ? 'Contact sales'
        : 'Get started'

  return (
    <div
      className={`
        relative flex flex-col rounded-2xl border bg-white p-7 shadow-sm transition-shadow
        hover:shadow-md
        ${isPopular ? 'border-2 border-gray-900 shadow-md' : 'border-gray-200'}
        ${isCurrent ? 'ring-2 ring-green-500 ring-offset-2' : ''}
      `}
    >
      {/* Popular badge — top-right pill */}
      {isPopular && showYearly && yearlySavings > 0 && (
        <span className="absolute -top-3 right-5 rounded-full bg-green-500 px-3 py-0.5 text-xs font-semibold text-white shadow">
          Save {yearlySavings}%
        </span>
      )}
      {isPopular && !(showYearly && yearlySavings > 0) && (
        <span className="absolute -top-3 right-5 rounded-full bg-gray-900 px-3 py-0.5 text-xs font-semibold text-white shadow">
          Most Popular
        </span>
      )}
      {isCurrent && (
        <span className="absolute -top-3 left-5 rounded-full bg-green-600 px-3 py-0.5 text-xs font-semibold text-white shadow">
          Current
        </span>
      )}

      {/* Plan label */}
      <p className="text-sm font-medium text-gray-500 mb-1">{plan.name}</p>

      {/* Price */}
      <div className="mb-1">
        {isFree ? (
          <p className="text-5xl font-extrabold text-gray-900 tracking-tight">Free</p>
        ) : isEnterprise ? (
          <p className="text-5xl font-extrabold text-gray-900 tracking-tight">Flexible</p>
        ) : (
          <p className="text-5xl font-extrabold text-gray-900 tracking-tight">
            RWF {formatPrice(displayPrice)}
            <span className="text-base font-normal text-gray-400">/{displayPeriod}</span>
          </p>
        )}
      </div>

      {/* Tagline */}
      <p className="text-sm text-gray-500 mb-6">
        {isFree
          ? 'For solo use with light needs.'
          : isEnterprise
            ? 'For team use with custom needs.'
            : `For ${plan.max_branches > 1 ? 'multi-branch' : 'single-branch'} pharmacies.`}
      </p>

      {/* Feature list */}
      <ul className="flex-1 space-y-2.5 mb-8">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
            <Check className="h-4 w-4 text-gray-700 shrink-0 mt-0.5" strokeWidth={2.5} />
            {feature}
          </li>
        ))}
        {/* Always show limits as features */}
        {plan.max_branches > 0 && (
          <li className="flex items-start gap-2.5 text-sm text-gray-700">
            <Check className="h-4 w-4 text-gray-700 shrink-0 mt-0.5" strokeWidth={2.5} />
            Up to {plan.max_branches} branch{plan.max_branches !== 1 ? 'es' : ''}
          </li>
        )}
        {plan.max_users > 0 && (
          <li className="flex items-start gap-2.5 text-sm text-gray-700">
            <Check className="h-4 w-4 text-gray-700 shrink-0 mt-0.5" strokeWidth={2.5} />
            {plan.max_users} staff member{plan.max_users !== 1 ? 's' : ''}
          </li>
        )}
        {plan.monthly_tx_limit > 0 && (
          <li className="flex items-start gap-2.5 text-sm text-gray-700">
            <Check className="h-4 w-4 text-gray-700 shrink-0 mt-0.5" strokeWidth={2.5} />
            {plan.monthly_tx_limit.toLocaleString()} transactions/mo
          </li>
        )}
      </ul>

      {/* CTA */}
      {ctaHref ? (
        <Link
          href={ctaHref}
          className={`
            w-full rounded-full py-3 text-sm font-semibold text-center transition-all block
            ${isPopular
              ? 'bg-gray-900 hover:bg-gray-800 text-white'
              : 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50'}
          `}
        >
          {isFree ? `Try ${plan.name} free` : `Get started`}
        </Link>
      ) : (
        <Button
          className={`
            w-full rounded-full py-5 text-sm font-semibold transition-all
            ${isCurrent
              ? 'bg-green-600 hover:bg-green-700 text-white cursor-default'
              : isPopular
                ? 'bg-gray-900 hover:bg-gray-800 text-white'
                : 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50'}
          `}
          disabled={isCurrent || isPending}
          onClick={() => !isCurrent && onSelect(plan)}
        >
          {isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : isCurrent
              ? <><Crown className="h-3.5 w-3.5 mr-1.5" />{ctaLabel}</>
              : ctaLabel}
        </Button>
      )}
    </div>
  )
}
