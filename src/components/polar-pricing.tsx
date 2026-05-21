'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Plus } from 'lucide-react'

export type SubscriptionPlanRow = {
  id: string
  name: string
  price: number
  yearly_price: number
  yearly_discount_pct: number
  period: string
  features: string[]
  is_popular: boolean
  is_active: boolean
}

export default function PolarPricing() {
    const [plans, setPlans] = useState<SubscriptionPlanRow[]>([])
    const [loading, setLoading] = useState(true)
    const [billing, setBilling] = useState<'monthly' | 'annually'>('monthly')

    useEffect(() => {
        fetch('/api/plans')
            .then((res) => res.json())
            .then((data) => {
                setPlans(data)
                setLoading(false)
            })
            .catch((error) => {
                console.error('Failed to fetch plans:', error)
                setLoading(false)
            })
    }, [])

    if (loading) {
        return (
            <div className="w-full flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    const getDisplayPrice = (plan: SubscriptionPlanRow) => {
        if (plan.price === 0) return 0
        // Only use yearly price if the admin actually stored one
        if (billing === 'annually' && plan.yearly_price > 0) {
            return plan.yearly_price
        }
        return plan.price
    }

    // Show the discount badge only if there are paid plans with a real yearly price
    const firstPaidPlan = plans.find(p => p.price > 0 && p.yearly_price > 0)
    const badgeDiscountPct = firstPaidPlan?.yearly_discount_pct ?? null

    return (
        <div className="w-full relative mx-auto max-w-6xl">
            {/* Pricing Toggle Navbar */}
            <div className="flex justify-center mb-10">
                <div className="inline-flex items-center rounded-xl border border-gray-200/80 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/50 p-1 shadow-sm">
                    <button 
                        onClick={() => setBilling('monthly')}
                        className={`rounded-lg px-8 py-2 text-sm font-medium shadow-sm transition-all ${billing === 'monthly' ? 'bg-gray-950 text-white dark:bg-gray-800' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                    >
                        Monthly
                    </button>
                    <button 
                        onClick={() => setBilling('annually')}
                        className={`rounded-lg px-8 py-2 text-sm font-medium transition-all flex items-center gap-2 ${billing === 'annually' ? 'bg-gray-950 text-white dark:bg-gray-800' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                    >
                        Annually
                        {badgeDiscountPct !== null && badgeDiscountPct > 0 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${billing === 'annually' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'}`}>-{badgeDiscountPct}%</span>
                        )}
                    </button>
                </div>
            </div>

            {/* The container without wireframe borders */}
            <div className="relative">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {plans.map((plan, index) => {
                        const displayPrice = getDisplayPrice(plan)
                        const yearlySavings = plan.price > 0 && plan.yearly_price > 0
                            ? Math.round(plan.price * 12) - plan.yearly_price
                            : 0
                        return (
                        <div 
                            key={plan.id} 
                            className={`relative flex flex-col p-8 lg:p-10 rounded-3xl border bg-white dark:bg-gray-950 shadow-sm transition-all hover:shadow-md ${
                                plan.is_popular 
                                    ? 'border-gray-900 ring-4 ring-gray-100 dark:border-gray-100 dark:ring-gray-800' 
                                    : 'border-gray-200 dark:border-gray-800'
                            }`}
                        >
                            
                            {/* Plan Badge */}
                            <div className="mb-8">
                                <div className="relative inline-flex items-center justify-center px-5 py-2 rounded-full bg-white dark:bg-gray-900 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <div className="absolute inset-0 rounded-full bg-blue-200/40 dark:bg-blue-900/40 blur-md -z-10 translate-y-1" />
                                    {plan.name}
                                </div>
                            </div>

                            {/* Price */}
                            <div className="mb-6 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                                {displayPrice === 0 ? (
                                    <span className="text-5xl font-serif tracking-tight text-gray-900 dark:text-white">Free</span>
                                ) : (
                                    <>
                                        <span className="text-5xl font-serif tracking-tight text-gray-900 dark:text-white">
                                            {displayPrice.toLocaleString()}
                                        </span>
                                        <span className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">RWF</span>
                                    </>
                                )}
                                <span className="text-sm font-medium text-gray-900 dark:text-white ml-0.5">
                                    /{billing === 'annually' ? 'year' : plan.period.replace('per ', '')}
                                </span>
                            </div>
                            {/* Savings line for annual billing */}
                            {billing === 'annually' && plan.price > 0 && plan.yearly_price > 0 && yearlySavings > 0 && (
                                <p className="text-xs font-medium text-green-600 dark:text-green-400 -mt-4 mb-4">
                                    Save RWF {yearlySavings.toLocaleString()} vs monthly
                                </p>
                            )}

                            {/* Description */}
                            <p className="mb-8 text-sm text-gray-500 dark:text-gray-400 leading-relaxed min-h-[40px]">
                                {plan.is_popular 
                                    ? "Get started with advanced tools for growing pharmacies & professionals."
                                    : plan.price === 0 
                                        ? "Get started with essential tracking and management — no credit card required."
                                        : "High-volume access, API integration, team tools, and enterprise-grade security."}
                            </p>

                            {/* CTA Button */}
                            <Link
                                href={`/sign-up`}
                                className={`mb-10 block w-full rounded-lg py-3 text-center text-sm font-semibold transition-all shadow-sm ${
                                    plan.is_popular
                                        ? 'bg-[#0f1115] text-white hover:bg-black shadow-[0_8px_20px_rgba(0,0,0,0.12)]'
                                        : 'bg-gray-100/80 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
                                }`}
                            >
                                {plan.price === 0 ? 'Get Started Free' : `Upgrade to ${plan.name}`}
                            </Link>

                            {/* Features */}
                            <ul className="space-y-3.5 flex-1">
                                {plan.features?.filter(f => f && f.trim().length > 0).map((f, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-gray-500 dark:text-gray-400">
                                        <Check className="size-4 text-gray-900 dark:text-white shrink-0 mt-0.5" strokeWidth={2.5} />
                                        <span className="leading-tight">{f}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        )
                    })}

                </div>
            </div>
        </div>
    )
}
