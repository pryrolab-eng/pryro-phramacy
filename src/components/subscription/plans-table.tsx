'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Crown, Edit, CheckCircle, Loader2 } from 'lucide-react'
import { TablePagination } from './table-pagination'
import { useTablePagination } from './use-table-pagination'

// ─── Types ────────────────────────────────────────────────

export interface PlanTableRow {
  id: string
  name: string
  price: number
  yearly_price?: number
  yearly_discount_pct?: number
  period: string
  billing_period?: string
  plan_type?: string
  max_branches?: number
  max_users?: number
  monthly_tx_limit?: number
  features: string[]
  users: number          // active subscriber count
  popular: boolean
  is_active: boolean
  polar_product_id?: string
}

interface PlansTableProps {
  plans: PlanTableRow[]
  togglingPlanId?: string | null
  onEdit?: (plan: PlanTableRow) => void
  onToggleActive?: (plan: PlanTableRow, nextActive: boolean) => void
  /** Show the toggle + edit columns (admin mode). Default: true */
  showActions?: boolean
  pageSize?: number
}

/**
 * Reusable paginated shadcn Table for subscription plans.
 * Used in the admin subscriptions page (card + table view).
 */
export function PlansTable({
  plans,
  togglingPlanId = null,
  onEdit,
  onToggleActive,
  showActions = true,
  pageSize = 8,
}: PlansTableProps) {
  const pagination = useTablePagination(plans, { pageSize })

  if (plans.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No plans yet. Create one above.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Limits</TableHead>
              <TableHead>Features</TableHead>
              <TableHead className="text-center">Subscribers</TableHead>
              <TableHead className="text-center">Status</TableHead>
              {showActions && (
                <>
                  <TableHead className="text-center">Offer to new</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.paginatedData.map((plan) => (
              <TableRow
                key={plan.id}
                className={!plan.is_active ? 'opacity-60' : ''}
              >
                {/* Plan name + popular badge */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{plan.name}</span>
                    {plan.popular && (
                      <Badge className="bg-gray-800 text-white text-[10px] px-1.5 py-0.5">
                        <Crown className="h-2.5 w-2.5 mr-1" />
                        Popular
                      </Badge>
                    )}
                  </div>
                </TableCell>

                {/* Price */}
                <TableCell className="whitespace-nowrap">
                  <div>
                    <span className="font-semibold">
                      {plan.price === 0
                        ? 'Free'
                        : `RWF ${plan.price.toLocaleString()}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        /{plan.billing_period ?? plan.period}
                      </span>
                    )}
                  </div>
                  {plan.yearly_price && plan.yearly_price > 0 && plan.price > 0 && (
                    <div className="text-xs text-muted-foreground">
                      RWF {plan.yearly_price.toLocaleString()}/yr
                      {(plan.yearly_discount_pct ?? 0) > 0 && (
                        <span className="ml-1 text-green-600">
                          ({plan.yearly_discount_pct}% off)
                        </span>
                      )}
                    </div>
                  )}
                </TableCell>

                {/* Plan type */}
                <TableCell>
                  <Badge variant="outline" className="text-xs capitalize">
                    {plan.plan_type === 'branch_addon' ? 'Add-on' : (plan.plan_type ?? 'main')}
                  </Badge>
                </TableCell>

                {/* Limits */}
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {plan.max_branches != null && (
                    <div>{plan.max_branches} branch{plan.max_branches !== 1 ? 'es' : ''}</div>
                  )}
                  {plan.max_users != null && (
                    <div>{plan.max_users} staff</div>
                  )}
                  {plan.monthly_tx_limit != null && (
                    <div>{plan.monthly_tx_limit.toLocaleString()} tx/mo</div>
                  )}
                </TableCell>

                {/* Features (first 3 inline) */}
                <TableCell>
                  <ul className="space-y-0.5">
                    {plan.features.slice(0, 3).map((f, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground"
                      >
                        <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                    {plan.features.length > 3 && (
                      <li className="text-xs text-muted-foreground pl-4">
                        +{plan.features.length - 3} more
                      </li>
                    )}
                  </ul>
                </TableCell>

                {/* Subscriber count */}
                <TableCell className="text-center">
                  <span className="font-medium">{plan.users}</span>
                </TableCell>

                {/* Active badge */}
                <TableCell className="text-center">
                  <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>

                {showActions && (
                  <>
                    {/* Toggle */}
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        {togglingPlanId === plan.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Switch
                            id={`table-active-${plan.id}`}
                            checked={plan.is_active}
                            onCheckedChange={(checked) =>
                              onToggleActive?.(plan, checked)
                            }
                            aria-label={`Toggle ${plan.name} active`}
                          />
                        )}
                      </div>
                    </TableCell>

                    {/* Edit */}
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit?.(plan)}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setPage}
        totalItems={pagination.totalItems}
        pageSize={pagination.pageSize}
      />
    </div>
  )
}
