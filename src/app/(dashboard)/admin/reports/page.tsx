'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../../../supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Download, TrendingUp, Users, Building2, CreditCard, DollarSign, Package } from "lucide-react";
import { Spinner } from '@/components/ui/spinner';

interface RevenueData {
  month: string
  revenue: number
  pharmacies: number
}

interface PlanBreakdown {
  plan_name: string
  subscribers: number
  revenue: number
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [activePharmacies, setActivePharmacies] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [planBreakdown, setPlanBreakdown] = useState<PlanBreakdown[]>([])
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      // Get total revenue from payments
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed')
      
      const revenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
      setTotalRevenue(revenue)

      // Get active pharmacies count
      const { count: pharmacyCount } = await supabase
        .from('pharmacies')
        .select('*', { count: 'exact', head: true })
      
      setActivePharmacies(pharmacyCount || 0)

      // Get total users count
      const { count: userCount } = await supabase
        .from('pharmacy_users')
        .select('*', { count: 'exact', head: true })
      
      setTotalUsers(userCount || 0)

      // Get monthly revenue data
      const { data: monthlyPayments } = await supabase
        .from('payments')
        .select('amount, created_at')
        .eq('status', 'completed')
        .order('created_at', { ascending: true })

      // Group by month
      const monthlyData: { [key: string]: { revenue: number, pharmacies: Set<string> } } = {}
      monthlyPayments?.forEach(p => {
        const month = new Date(p.created_at).toLocaleString('en', { month: 'short' })
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, pharmacies: new Set() }
        }
        monthlyData[month].revenue += Number(p.amount)
      })

      const chartData = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        pharmacies: data.pharmacies.size
      }))
      setRevenueData(chartData)

      // Get plan breakdown from subscriptions
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('plan_name, pharmacy_id')
        .eq('status', 'active')

      const planData: { [key: string]: { count: number, revenue: number } } = {}
      subscriptions?.forEach(s => {
        if (!planData[s.plan_name]) {
          planData[s.plan_name] = { count: 0, revenue: 0 }
        }
        planData[s.plan_name].count++
      })

      // Get plan prices
      const { data: plans } = await supabase
        .from('subscription_plans')
        .select('name, price')

      const breakdown = Object.entries(planData).map(([plan_name, data]) => {
        const plan = plans?.find(p => p.name === plan_name)
        return {
          plan_name,
          subscribers: data.count,
          revenue: data.count * Number(plan?.price || 0)
        }
      })
      setPlanBreakdown(breakdown)

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const reports = [
    { name: "Revenue Report", description: "Monthly subscription revenue breakdown", lastGenerated: "2 hours ago", type: "Financial" },
    { name: "User Activity", description: "User engagement and activity metrics", lastGenerated: "1 day ago", type: "Analytics" },
    { name: "Pharmacy Performance", description: "Individual pharmacy performance metrics", lastGenerated: "3 hours ago", type: "Business" },
    { name: "Subscription Analytics", description: "Plan conversion and churn analysis", lastGenerated: "1 week ago", type: "Subscription" },
  ];

  const metrics = [
    { title: "Total Revenue", value: `RWF ${(totalRevenue / 1000000).toFixed(1)}M`, change: "+15%", icon: DollarSign, trend: "up" },
    { title: "Active Pharmacies", value: activePharmacies.toString(), change: "+3", icon: Building2, trend: "up" },
    { title: "Total Users", value: totalUsers.toString(), change: "+12", icon: Users, trend: "up" },
    { title: "Conversion Rate", value: "78%", change: "+5%", icon: TrendingUp, trend: "up" },
  ];

  const chartData = revenueData.length > 0 ? revenueData : [
    { month: 'Jan', revenue: 0, pharmacies: 0 },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="size-6" />
    </div>
  )

  return (
    <div className="p-6">


        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              Business Reports & Analytics
            </h1>
            <p className="text-gray-600">View business analytics and performance metrics</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {metrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  <metric.icon className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div className="flex items-center text-sm mt-1">
                    <span className="font-medium">{metric.change}</span>
                    <span className="text-muted-foreground ml-1">from last month</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Monthly revenue and pharmacy growth over the past year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 space-y-6">
                {revenueData.map((data, index) => {
                  const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1)
                  const width = (data.revenue / maxRevenue) * 100
                  return (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-12 text-sm font-medium">{data.month}</div>
                    <div className="flex-1 flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded h-1 flex items-center">
                          <div 
                            className="bg-gray-800 h-1 rounded transition-all duration-500"
                            style={{ width: `${width}%` }}
                          >
                          </div>
                        </div>
                      </div>
                      <div className="w-16 text-xs font-medium">
                        {(data.revenue / 1000000).toFixed(1)}M
                      </div>
                      <div className="w-20 text-right">
                        <div className="text-sm font-semibold">{data.pharmacies}</div>
                        <div className="text-xs text-muted-foreground">pharmacies</div>
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Chart</CardTitle>
                <CardDescription>Monthly revenue growth trend</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chartData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 text-sm font-medium">{data.month}</div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded h-2">
                            <div 
                              className="bg-gray-800 h-2 rounded transition-all duration-300"
                              style={{ width: `${(data.revenue / 2000000) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{(data.revenue / 1000000).toFixed(1)}M</div>
                        <div className="text-xs text-muted-foreground">{data.pharmacies} pharmacies</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Monthly revenue by subscription plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {planBreakdown.length > 0 ? planBreakdown.map((plan, index) => {
                    const percentage = totalRevenue > 0 ? ((plan.revenue / totalRevenue) * 100).toFixed(0) : 0
                    return (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{plan.plan_name}</p>
                          <p className="text-sm text-muted-foreground">{plan.subscribers} subscribers</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">RWF {plan.revenue.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{percentage}% of total</p>
                        </div>
                      </div>
                    )
                  }) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No subscription data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Available Reports</CardTitle>
              <CardDescription>Generate and download business reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reports.map((report, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{report.name}</h3>
                      <Badge variant="outline">{report.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Last generated: {report.lastGenerated}</p>
                      <Button size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

    </div>
  );
}
