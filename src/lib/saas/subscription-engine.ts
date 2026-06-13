// SaaS Subscription Engine — Prisma-only business logic (server-side).

import type {
  ActivateSubscriptionParams,
  Branch,
  BranchUsage,
  PharmacySubscriptionSummary,
  Subscription,
  SubscriptionInvoice,
  SubscriptionPlan,
  TransactionCheckResult,
} from './types'
import {
  saasActivateSubscription,
  saasCancelSubscription,
  saasCheckBranchCanTransact,
  saasCreateBranch,
  saasCreatePlan,
  saasGenerateMonthlyInvoice,
  saasGetActivePlans,
  saasGetAllPlans,
  saasGetAllSubscriptions,
  saasGetBranchCurrentUsage,
  saasGetPharmacyBranches,
  saasGetPharmacyMainSubscription,
  saasGetPharmacySubscriptionSummary,
  saasGetPharmacySubscriptions,
  saasGetPlanById,
  saasIncrementBranchTx,
  saasUpdatePlan,
} from '@/lib/db/saas-engine'

export async function getActivePlans(): Promise<SubscriptionPlan[]> {
  return saasGetActivePlans()
}

export async function getPlanById(planId: string): Promise<SubscriptionPlan | null> {
  return saasGetPlanById(planId)
}

export async function getPharmacySubscriptions(pharmacyId: string): Promise<Subscription[]> {
  return saasGetPharmacySubscriptions(pharmacyId)
}

export async function getPharmacyMainSubscription(pharmacyId: string): Promise<Subscription | null> {
  return saasGetPharmacyMainSubscription(pharmacyId)
}

export async function getPharmacyBranches(pharmacyId: string): Promise<Branch[]> {
  return saasGetPharmacyBranches(pharmacyId)
}

export async function getBranchCurrentUsage(branchId: string): Promise<BranchUsage | null> {
  return saasGetBranchCurrentUsage(branchId)
}

export async function getPharmacySubscriptionSummary(
  pharmacyId: string,
): Promise<PharmacySubscriptionSummary> {
  return saasGetPharmacySubscriptionSummary(pharmacyId)
}

export async function activateSubscription(
  params: ActivateSubscriptionParams,
): Promise<Subscription> {
  return saasActivateSubscription(params)
}

export async function cancelSubscription(
  subscriptionId: string,
  pharmacyId: string,
): Promise<void> {
  return saasCancelSubscription(subscriptionId, pharmacyId)
}

export async function checkBranchCanTransact(
  branchId: string,
): Promise<TransactionCheckResult> {
  return saasCheckBranchCanTransact(branchId)
}

export async function incrementBranchTx(branchId: string) {
  return saasIncrementBranchTx(branchId)
}

export async function createBranch(
  pharmacyId: string,
  data: { name: string; address?: string; phone?: string; email?: string },
): Promise<Branch> {
  return saasCreateBranch(pharmacyId, data)
}

export async function generateMonthlyInvoice(
  pharmacyId: string,
  billingMonth?: string,
): Promise<SubscriptionInvoice> {
  return saasGenerateMonthlyInvoice(pharmacyId, billingMonth)
}

export async function getAllSubscriptions(opts?: {
  status?: string
  limit?: number
  offset?: number
}) {
  return saasGetAllSubscriptions(opts)
}

export async function getAllPlans(): Promise<SubscriptionPlan[]> {
  return saasGetAllPlans()
}

export async function createPlan(input: {
  name: string
  price: number
  billing_period: string
  plan_type: string
  max_branches: number
  max_users: number
  monthly_tx_limit: number
  features: string[]
  is_popular?: boolean
}): Promise<SubscriptionPlan> {
  return saasCreatePlan(input)
}

export async function updatePlan(
  planId: string,
  updates: Partial<{
    name: string
    price: number
    billing_period: string
    plan_type: string
    max_branches: number
    max_users: number
    monthly_tx_limit: number
    features: string[]
    is_popular: boolean
    is_active: boolean
  }>,
): Promise<SubscriptionPlan> {
  return saasUpdatePlan(planId, updates)
}
