'use client'

import { useState } from 'react'
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Users, Building2, CreditCard, BarChart3, TrendingUp, AlertTriangle, Calendar } from "lucide-react";

export default function AdminPage() {
  const [hoveredPoint, setHoveredPoint] = useState<any>(null)
  
  const chartData = [
    { month: 'Jan', pharmacies: 18, revenue: 1200000 },
    { month: 'Feb', pharmacies: 20, revenue: 1400000 },
    { month: 'Mar', pharmacies: 22, revenue: 1600000 },
    { month: 'Apr', pharmacies: 24, revenue: 1800000 },
    { month: 'May', pharmacies: 23, revenue: 1700000 },
    { month: 'Jun', pharmacies: 25, revenue: 2000000 },
    { month: 'Jul', pharmacies: 27, revenue: 2200000 },
    { month: 'Aug', pharmacies: 26, revenue: 2100000 },
    { month: 'Sep', pharmacies: 28, revenue: 2300000 },
    { month: 'Oct', pharmacies: 30, revenue: 2500000 },
    { month: 'Nov', pharmacies: 29, revenue: 2400000 },
    { month: 'Dec', pharmacies: 32, revenue: 2600000 },
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Settings className="h-8 w-8 text-blue-600" />
              Admin Dashboard
            </h1>
            <p className="text-gray-600">Manage pharmacies, subscriptions, and platform analytics</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Shops</CardTitle>
                <Building2 className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">+3 this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expired Businesses</CardTitle>
                <AlertTriangle className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Plan Subscriptions</CardTitle>
                <CreditCard className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">RWF 1.8M</div>
                <p className="text-xs text-muted-foreground">+15% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
                <BarChart3 className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">Active categories</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
                <Users className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">Free, Standard, Premium</p>
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
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-gray-800"></div>
                      <span className="font-medium">Premium</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">8 shops</p>
                      <p className="text-xs text-muted-foreground">33%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-gray-600"></div>
                      <span className="font-medium">Standard</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">12 shops</p>
                      <p className="text-xs text-muted-foreground">50%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                      <span className="font-medium">Free</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">4 shops</p>
                      <p className="text-xs text-muted-foreground">17%</p>
                    </div>
                  </div>
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
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Premium Plans</span>
                    <span className="font-semibold">RWF 960,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Standard Plans</span>
                    <span className="font-semibold">RWF 600,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Setup Fees</span>
                    <span className="font-semibold">RWF 240,000</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total Revenue</span>
                      <span className="font-bold text-lg">RWF 1,800,000</span>
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
                  {[
                    { email: 'pharmacy1@test.com', shop: 'City Pharmacy', date: '2 hours ago', plan: 'Premium' },
                    { email: 'owner@medcare.rw', shop: 'MediCare Plus', date: '1 day ago', plan: 'Standard' },
                    { email: 'admin@wellness.rw', shop: 'Wellness Pharmacy', date: '2 days ago', plan: 'Free' },
                    { email: 'contact@healthplus.rw', shop: 'Health Plus', date: '3 days ago', plan: 'Standard' }
                  ].map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{user.email}</p>
                        <p className="text-xs text-muted-foreground">{user.shop} • {user.date}</p>
                      </div>
                      <Badge variant="outline">{user.plan}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}