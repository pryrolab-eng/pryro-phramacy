import { Polar } from '@polar-sh/sdk'

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  // Change to 'production' when going live
  server: 'sandbox',
})

export const POLAR_PLANS = {
  starter: {
    name: 'Starter',
    productId: process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_STARTER!,
    price: 29,
    description: 'Perfect for single-branch pharmacies',
    features: ['1 Branch', 'Up to 5 staff', 'POS & Inventory', 'Basic reports'],
  },
  growth: {
    name: 'Growth',
    productId: process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_GROWTH!,
    price: 79,
    description: 'For growing multi-branch pharmacies',
    features: ['Up to 5 branches', 'Unlimited staff', 'Insurance billing', 'Advanced analytics'],
  },
  enterprise: {
    name: 'Enterprise',
    productId: process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_ENTERPRISE!,
    price: 199,
    description: 'Full platform for large pharmacy chains',
    features: ['Unlimited branches', 'Priority support', 'Custom integrations', 'SLA guarantee'],
  },
} as const

export type PolarPlan = keyof typeof POLAR_PLANS
