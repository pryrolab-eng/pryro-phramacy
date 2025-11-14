'use client'

import { useState, useEffect } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Download, TrendingUp, Users, Building2, CreditCard, DollarSign, Package } from "lucide-react";
import { Spinner } from '@/components/ui/spinner';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700)
    return () => clearTimeout(timer)
  }, [])

  const reports = [
    { name: "Revenue Report", description: "Monthly subscription revenue breakdown", lastGenerated: "2 hours ago", type: "Financial" },
    { name: "User Activity", description: "User engagement and activity metrics", lastGenerated: "1 day ago", type: "Analytics" },
    { name: "Pharmacy Performance", description: "Individual pharmacy performance metrics", lastGenerated: "3 hours ago", type: "Business" },
    { name: "Subscription Analytics", description: "Plan conversion and churn analysis", lastGenerated: "1 week ago", type: "Subscription" },
  ];

  const metrics = [
    { title: "Total Revenue", value: "RWF 1.8M", change: "+15%", icon: DollarSign, trend: "up" },
    { title: "Active Pharmacies", value: "24", change: "+3", icon: Building2, trend: "up" },
    { title: "Total Users", value: "156", change: "+12", icon: Users, trend: "up" },
    { title: "Conversion Rate", value: "78%", change: "+5%", icon: TrendingUp, trend: "up" },
  ];

  const chartData = [
    { month: 'Jan', revenue: 800000, pharmacies: 18 },
    { month: 'Feb', revenue: 1200000, pharmacies: 20 },
    { month: 'Mar', revenue: 1500000, pharmacies: 22 },
    { month: 'Apr', revenue: 1800000, pharmacies: 24 },
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
                {[
                  { month: 'Jan', revenue: 800000, pharmacies: 18, width: 40 },
                  { month: 'Feb', revenue: 1200000, pharmacies: 20, width: 60 },
                  { month: 'Mar', revenue: 1500000, pharmacies: 22, width: 75 },
                  { month: 'Apr', revenue: 1800000, pharmacies: 24, width: 90 },
                  { month: 'May', revenue: 1600000, pharmacies: 23, width: 80 },
                  { month: 'Jun', revenue: 2000000, pharmacies: 25, width: 100 },
                ].map((data, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-12 text-sm font-medium">{data.month}</div>
                    <div className="flex-1 flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded h-1 flex items-center">
                          <div 
                            className="bg-gray-800 h-1 rounded transition-all duration-500"
                            style={{ width: `${data.width}%` }}
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
                ))}
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
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Premium Plans</p>
                      <p className="text-sm text-muted-foreground">8 subscribers</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">RWF 960,000</p>
                      <p className="text-xs text-muted-foreground">53% of total</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Standard Plans</p>
                      <p className="text-sm text-muted-foreground">12 subscribers</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">RWF 600,000</p>
                      <p className="text-xs text-muted-foreground">33% of total</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Setup Fees</p>
                      <p className="text-sm text-muted-foreground">New registrations</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">RWF 240,000</p>
                      <p className="text-xs text-muted-foreground">14% of total</p>
                    </div>
                  </div>
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
