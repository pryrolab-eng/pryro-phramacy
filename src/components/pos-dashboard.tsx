"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ShoppingCart, Search, Package, AlertTriangle, DollarSign, TrendingUp } from "lucide-react"
import { useState } from "react"

export default function POSDashboard() {
  const [selectedMedication, setSelectedMedication] = useState("")
  const [cartItems, setCartItems] = useState<any[]>([])

  // Sample data based on your SQL
  const medications = [
    { id: 1, name: "Paracetamol 500mg", price: 120, stock: 150, minStock: 25, prescription: false },
    { id: 2, name: "Amoxicillin 250mg", price: 450, stock: 8, minStock: 15, prescription: true },
    { id: 3, name: "Ibuprofen 400mg", price: 220, stock: 75, minStock: 20, prescription: false },
  ]

  const addToCart = (medication: any) => {
    setCartItems([...cartItems, { ...medication, quantity: 1 }])
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RWF 45,231</div>
            <p className="text-xs text-muted-foreground">+20.1% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RWF 1.2M</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pos">Point of Sale</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="pos" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Search & Selection */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Add Medication</CardTitle>
                </CardHeader>
                <CardContent>
                  <Command className="rounded-lg border">
                    <CommandInput placeholder="Search medications..." />
                    <CommandList>
                      <CommandEmpty>No medications found.</CommandEmpty>
                      <CommandGroup heading="Available Medications">
                        {medications.map((med) => (
                          <CommandItem
                            key={med.id}
                            onSelect={() => addToCart(med)}
                            className="flex items-center justify-between"
                          >
                            <div>
                              <span>{med.name}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={med.prescription ? "destructive" : "secondary"}>
                                  {med.prescription ? "Rx" : "OTC"}
                                </Badge>
                                <Badge variant={med.stock <= med.minStock ? "destructive" : "outline"}>
                                  Stock: {med.stock}
                                </Badge>
                              </div>
                            </div>
                            <span className="font-semibold">RWF {med.price}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </CardContent>
              </Card>
            </div>

            {/* Cart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Cart ({cartItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {cartItems.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Cart is empty</p>
                  ) : (
                    <div className="space-y-2">
                      {cartItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 border rounded">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <span className="font-semibold">RWF {item.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-bold">
                      RWF {cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)}
                    </span>
                  </div>
                  <Button className="w-full" disabled={cartItems.length === 0}>
                    Process Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medication</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medications.map((med) => (
                    <TableRow key={med.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{med.name}</p>
                          {med.prescription && (
                            <Badge variant="destructive" className="text-xs">Prescription Required</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{med.stock} units</span>
                            <span>{Math.round((med.stock / (med.minStock * 4)) * 100)}%</span>
                          </div>
                          <Progress 
                            value={(med.stock / (med.minStock * 4)) * 100} 
                            className="h-2"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={med.stock <= med.minStock ? "destructive" : "default"}>
                          {med.stock <= med.minStock ? "Low Stock" : "In Stock"}
                        </Badge>
                      </TableCell>
                      <TableCell>RWF {med.price}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Sales Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Reports functionality coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}