'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { buildSignUpUrl } from '@/lib/onboarding/intent'
import { usePublicMainPlans } from '@/hooks/usePlans'
import type { PlanRow } from '@/lib/http/plans'
import { planMarketingBlurb } from '@/lib/subscription/plan-marketing-features'
import { formatPlanPriceSuffix } from '@/lib/subscription/plan-period'
import { PlanFeatureList } from '@/components/subscription/plan-feature-list'
import { landingContainerWide } from '@/lib/landing-layout'
import { AnimatedTextRoller } from '@/components/shadcn-space/animated-text/animated-text-04'

export type SubscriptionPlanRow = {
  id: string
  name: string
  price: number
  period: string
  features: string[]
  is_popular: boolean
  is_active: boolean
  max_users?: number
  max_branches?: number
  monthly_tx_limit?: number
  billing_period?: string
}

function toDisplayPlan(plan: PlanRow): SubscriptionPlanRow {
  return {
    id: plan.id,
    name: plan.name,
    price: plan.price,
    period: plan.period ?? 'per month',
    features: (plan.features ?? []).filter(
      (f): f is string => typeof f === 'string' && f.trim().length > 0,
    ),
    is_popular: Boolean(plan.is_popular),
    is_active: true,
    max_users: plan.max_users,
    max_branches: plan.max_branches,
    monthly_tx_limit: plan.monthly_tx_limit,
    billing_period: plan.billing_period as string | undefined,
  }
}

export default function PolarPricing() {
    const [mounted, setMounted] = useState(false)
    const plansQuery = usePublicMainPlans()
    const plans = (plansQuery.data ?? []).map(toDisplayPlan)
    const [billing, setBilling] = useState<'monthly' | 'annually'>('monthly')

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted || plansQuery.isPending) {
        return (
            <div className="w-full flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    /** Monthly list price; annual toggle shows 20% off that monthly rate. */
    const getDisplayPrice = (monthly: number) => {
        if (monthly === 0) return 0
        return billing === 'annually' ? Math.round(monthly * 0.8) : monthly
    }

    /** What the customer pays once per year at checkout (monthly × 12 × 0.8). */
    const getAnnualTotal = (monthly: number) => {
        if (monthly === 0) return 0
        return Math.round(monthly * 12 * 0.8)
    }

    return (
        <div className={`relative w-full ${landingContainerWide}`}>
            <div className="flex justify-center mb-10">
                <div className="inline-flex items-center rounded-xl border border-gray-200/80 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/50 p-1 shadow-sm">
                    <button 
                        onClick={() => setBilling('monthly')}
                        className={`rounded-lg px-8 py-2 text-sm font-medium shadow-sm transition-all ${billing === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                    >
                        Monthly
                    </button>
                    <button 
                        onClick={() => setBilling('annually')}
                        className={`rounded-lg px-8 py-2 text-sm font-medium transition-all flex items-center gap-2 ${billing === 'annually' ? 'bg-primary text-primary-foreground' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                    >
                        Annually
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${billing === 'annually' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'}`}>-20%</span>
                    </button>
                </div>
            </div>

            <div className="relative">
                <div className="mx-auto grid max-w-5xl grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 2xl:max-w-6xl 2xl:gap-8">
                    {plans.map((plan) => {
                        const displayPrice = getDisplayPrice(plan.price)
                        const annualTotal = getAnnualTotal(plan.price)
                        const priceSuffix = formatPlanPriceSuffix({
                          price: displayPrice,
                          period: plan.period,
                          billingPeriod: plan.billing_period,
                          pricingToggle: billing,
                        })
                        return (
                        <div 
                            key={plan.id} 
                            className={`relative flex flex-col p-6 rounded-2xl border bg-white dark:bg-gray-950 shadow-sm transition-all hover:shadow-md ${
                                plan.is_popular 
                                    ? 'border-gray-900 ring-2 ring-gray-100 dark:border-gray-100 dark:ring-gray-800' 
                                    : 'border-gray-200 dark:border-gray-800'
                            }`}
                        >
                            <div className="mb-4">
                                <div className="relative inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white dark:bg-gray-900 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <div className="absolute inset-0 rounded-full bg-blue-200/40 dark:bg-blue-900/40 blur-md -z-10 translate-y-1" />
                                    {plan.name}
                                </div>
                            </div>

                            <div className="mb-3 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                                {displayPrice === 0 ? (
                                    <span className="text-4xl font-serif tracking-tight text-gray-900 dark:text-white">Free</span>
                                ) : (
                                    <>
                                        <span className="text-4xl font-serif tracking-tight text-gray-900 dark:text-white">
                                            {displayPrice.toLocaleString()}
                                        </span>
                                        <span className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">RWF</span>
                                    </>
                                )}
                                {priceSuffix ? (
                                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-full">
                                    {priceSuffix}
                                    {billing === "annually" && plan.price > 0 ? (
                                      <AnimatedTextRoller
                                        className="mt-1.5 w-full"
                                        lineClassName="h-5 flex items-center text-xs font-medium"
                                        intervalMs={2800}
                                        lines={[
                                          {
                                            text: "20% off",
                                            className:
                                              "text-emerald-700 dark:text-emerald-400",
                                          },
                                          {
                                            text: `${annualTotal.toLocaleString()} RWF billed yearly`,
                                            className:
                                              "text-gray-600 dark:text-gray-400",
                                          },
                                        ]}
                                      />
                                    ) : null}
                                  </span>
                                ) : null}
                            </div>

                            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 min-h-[2.5rem]">
                                {planMarketingBlurb(plan)}
                            </p>

                            <Link
                                href={buildSignUpUrl({
                                    planId: plan.id,
                                    planName: plan.name,
                                    billing: billing === 'annually' ? 'annual' : 'monthly',
                                })}
                                className={`mb-6 block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-all shadow-sm ${
                                    plan.is_popular
                                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_8px_20px_rgba(0,0,0,0.12)]'
                                        : 'bg-gray-100/80 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
                                }`}
                            >
                                Get Started
                            </Link>

                            <PlanFeatureList
                                features={plan.features}
                                maxVisible={5}
                                dense
                                className="flex-1"
                            />
                        </div>
                        )
                    })}

                </div>
            </div>
        </div>
    )
}
