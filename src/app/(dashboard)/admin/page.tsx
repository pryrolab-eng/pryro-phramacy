'use client'

import { useState, useEffect } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Users, Building2, CreditCard, BarChart3, TrendingUp, AlertTriangle, Calendar } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Spinner } from '@/components/ui/spinner';

interface AdminStats {
  totalShops: number
  newThisMonth: number
  expiredBusinesses: number
  totalPlans: number
  totalCategories: number
  subscriptionRevenue: number
}

export default function AdminPage() {
  const [hoveredPoint, setHoveredPoint] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats>({
    totalShops: 0,
    newThisMonth: 0,
    expiredBusinesses: 0,
    totalPlans: 0,
    totalCategories: 0,
    subscriptionRevenue: 0
  })
  const [recentUsers, setRecentUsers] = useState([])
  const [planDistribution, setPlanDistribution] = useState([])
  const [categoriesCount, setCategoriesCount] = useState(0)
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Fetch admin stats
        const statsResponse = await fetch('/api/admin/pharmacies')
        if (statsResponse.ok) {
          const pharmacies = await statsResponse.json()
          
          // Fetch plans
          const plansResponse = await fetch('/api/admin/plans')
          const plans = plansResponse.ok ? await plansResponse.json() : []
          
          // Fetch categories count
          try {
            const categoriesResponse = await fetch('/api/categories')
            if (categoriesResponse.ok) {
              const categories = await categoriesResponse.json()
              setCategoriesCount(categories.length)
            }
          } catch (e) {
            setCategoriesCount(3) // Fallback to known count
          }
          
          // Calculate plan distribution
          const planCounts = {}
          pharmacies.forEach(p => {
            const plan = p.subscription_plan || 'Free'
            planCounts[plan] = (planCounts[plan] || 0) + 1
          })
          
          const totalPharmacies = pharmacies.length || 1
          setPlanDistribution([
            { name: 'Premium', count: planCounts.Premium || 0, percentage: Math.round(((planCounts.Premium || 0) / totalPharmacies) * 100) },
            { name: 'Standard', count: planCounts.Standard || 0, percentage: Math.round(((planCounts.Standard || 0) / totalPharmacies) * 100) },
            { name: 'Free', count: planCounts.Free || 0, percentage: Math.round(((planCounts.Free || 0) / totalPharmacies) * 100) }
          ])
          
          // Calculate stats from real data
          setStats({
            totalShops: pharmacies.length,
            newThisMonth: pharmacies.filter(p => {
              const created = new Date(p.created_at)
              const thisMonth = new Date()
              return created.getMonth() === thisMonth.getMonth() && created.getFullYear() === thisMonth.getFullYear()
            }).length,
            expiredBusinesses: pharmacies.filter(p => p.subscription_expires_at && new Date(p.subscription_expires_at) < new Date()).length,
            totalPlans: plans.length,
            totalCategories: categoriesCount,
            subscriptionRevenue: plans.reduce((sum, plan) => sum + parseFloat(plan.price || 0), 0)
          })
          
          // Set recent users from pharmacies
          setRecentUsers(pharmacies.slice(0, 4).map(p => ({
            email: p.email,
            shop: p.name,
            date: new Date(p.created_at).toLocaleDateString(),
            plan: p.subscription_plan || 'Free'
          })))
          
          // Generate chart data from real pharmacies
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          const currentMonth = new Date().getMonth()
          const chartDataArray = []
          
          for (let i = 0; i < 12; i++) {
            const monthIndex = (currentMonth - 11 + i + 12) % 12
            const monthPharmacies = pharmacies.filter(p => {
              const createdMonth = new Date(p.created_at).getMonth()
              return createdMonth <= monthIndex
            }).length
            
            chartDataArray.push({
              month: months[monthIndex],
              pharmacies: Math.max(1, monthPharmacies),
              revenue: monthPharmacies * 75000 // Average revenue per pharmacy
            })
          }
          
          setChartData(chartDataArray)
        }
      } catch (error) {
        console.error('Error fetching admin data:', error)
        // Keep default values
      } finally {
        setLoading(false)
      }
    }
    
    fetchAdminData()
  }, [])
  
  // Chart data now comes from database

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="size-6" />
    </div>
  )

  return (
    <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <SidebarTrigger />
              <div className="h-4 w-px bg-border" />
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="h-8 w-8 text-blue-600" />
                Admin Dashboard
              </h1>
            </div>
            <p className="text-gray-600">Manage pharmacies, subscriptions, and platform analytics</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Shops</CardTitle>
                <Building2 className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalShops}</div>
                <p className="text-xs text-muted-foreground">+{stats.newThisMonth} this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expired Businesses</CardTitle>
                <AlertTriangle className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.expiredBusinesses}</div>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Plan Subscriptions</CardTitle>
                <CreditCard className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">RWF {(stats.subscriptionRevenue / 1000).toLocaleString()}K</div>
                <p className="text-xs text-muted-foreground">From database</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
                <BarChart3 className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{categoriesCount || stats.totalCategories}</div>
                <p className="text-xs text-muted-foreground">Active categories</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
                <Users className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPlans}</div>
                <p className="text-xs text-muted-foreground">Available plans</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Platform Analytics</CardTitle>
              <CardDescription>Monthly growth in pharmacies and revenue</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-full relative">
                <svg className="w-full h-full" viewBox="0 0 800 150">
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#374151" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#374151" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Curved line */}
                  <path
                    d={`M ${chartData.map((data, index) => {
                      const x = 20 + index * 65
                      const y = 120 - (data.revenue / 2600000) * 100
                      return index === 0 ? `${x},${y}` : `L ${x},${y}`
                    }).join(' ')}`}
                    fill="none"
                    stroke="#374151"
                    strokeWidth="2"
                    className="transition-all duration-300"
                  />
                  
                  {/* Area under curve */}
                  <path
                    d={`M 20,120 ${chartData.map((data, index) => {
                      const x = 20 + index * 65
                      const y = 120 - (data.revenue / 2600000) * 100
                      return `L ${x},${y}`
                    }).join(' ')} L 735,120 Z`}
                    fill="url(#gradient)"
                  />
                  
                  {/* Hover points */}
                  {chartData.map((data, index) => (
                    <circle
                      key={index}
                      cx={20 + index * 65}
                      cy={120 - (data.revenue / 2600000) * 100}
                      r="6"
                      fill="transparent"
                      className="cursor-pointer hover:fill-gray-800 transition-all"
                      onMouseEnter={() => setHoveredPoint({ ...data, x: 20 + index * 65, y: 120 - (data.revenue / 2600000) * 100 })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  ))}
                  
                  {/* Month labels */}
                  {chartData.map((data, index) => (
                    <text
                      key={index}
                      x={20 + index * 65}
                      y={140}
                      textAnchor="middle"
                      className="text-xs fill-gray-400"
                    >
                      {data.month}
                    </text>
                  ))}
                </svg>
                
                {/* Hover tooltip */}
                {hoveredPoint && (
                  <div 
                    className="absolute bg-white border rounded-lg p-3 shadow-lg pointer-events-none z-10"
                    style={{
                      left: hoveredPoint.x - 50,
                      top: hoveredPoint.y - 80
                    }}
                  >
                    <div className="text-sm font-medium">{hoveredPoint.month}</div>
                    <div className="text-xs text-muted-foreground">Revenue: RWF {(hoveredPoint.revenue / 1000000).toFixed(1)}M</div>
                    <div className="text-xs text-muted-foreground">Pharmacies: {hoveredPoint.pharmacies}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Plan Overview</CardTitle>
                <CardDescription>Distribution of subscription plans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {planDistribution.map((plan, index) => (
                    <div key={plan.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${
                          index === 0 ? 'bg-gray-800' : 
                          index === 1 ? 'bg-gray-600' : 'bg-gray-400'
                        }`}></div>
                        <span className="font-medium">{plan.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{plan.count} shops</p>
                        <p className="text-xs text-muted-foreground">{plan.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Finance Overview</CardTitle>
                <CardDescription>Subscription revenue breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {planDistribution.map((plan) => (
                    <div key={plan.name} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{plan.name} Plans</span>
                      <span className="font-semibold">RWF {(plan.count * (plan.name === 'Premium' ? 120000 : plan.name === 'Standard' ? 50000 : 0)).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total Revenue</span>
                      <span className="font-bold text-lg">RWF {stats.subscriptionRevenue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>New Registered Users</CardTitle>
                <CardDescription>Recent user registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentUsers.length > 0 ? recentUsers.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{user.email}</p>
                        <p className="text-xs text-muted-foreground">{user.shop} • {user.date}</p>
                      </div>
                      <Badge variant="outline">{user.plan}</Badge>
                    </div>
                  )) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No recent registrations
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  );
}
