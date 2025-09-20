'use client'

import { useState, useEffect } from 'react'
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Package, Plus, Search, Filter } from "lucide-react";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    batch_number: '',
    quantity: '',
    unit_cost: '',
    selling_price: '',
    minimum_stock_level: '',
    expiry_date: ''
  });
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchInventory();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory');
      if (response.ok) {
        const data = await response.json();
        setInventory(data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const getStatusColor = (item: any) => {
    if (item.stock <= item.minStock) return "bg-red-100 text-red-800";
    if (item.stock <= item.minStock * 1.5) return "bg-orange-100 text-orange-800";
    return "bg-green-100 text-green-800";
  };

  const getStatus = (item: any) => {
    if (item.stock <= item.minStock) return "Critical";
    if (item.stock <= item.minStock * 1.5) return "Low Stock";
    return "In Stock";
  };

  const handleAddItem = async () => {
    try {
      const response = await fetch('/api/inventory/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      
      if (response.ok) {
        await fetchInventory();
        setIsAddingItem(false);
        setNewItem({
          name: '',
          category: '',
          batch_number: '',
          quantity: '',
          unit_cost: '',
          selling_price: '',
          minimum_stock_level: '',
          expiry_date: ''
        });
        alert('Medication added successfully!');
      } else {
        alert('Failed to add medication');
      }
    } catch (error) {
      console.error('Error adding medication:', error);
      alert('Error adding medication');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Package className="h-8 w-8 text-blue-600" />
              Inventory Management
            </h1>
            <p className="text-gray-600">Track stock levels, manage suppliers, and monitor expiry dates</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-green-600">{inventory.length}</div>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-orange-600">{inventory.filter(item => item.stock <= item.minStock).length}</div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-red-600">0</div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">RWF {inventory.reduce((sum, item) => sum + (item.stock * item.price), 0).toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Total Value</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Inventory Items</CardTitle>
                  <CardDescription>Manage your medication stock</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Medication</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label>Medication Name</Label>
                          <Input
                            value={newItem.name}
                            onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Category</Label>
                          <select
                            className="w-full p-2 border rounded"
                            value={newItem.category}
                            onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                          >
                            <option value="">Select Category</option>
                            {categories.map(category => (
                              <option key={category.id} value={category.name}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>Batch Number</Label>
                            <Input
                              value={newItem.batch_number}
                              onChange={(e) => setNewItem({...newItem, batch_number: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              value={newItem.quantity}
                              onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>Unit Cost (RWF)</Label>
                            <Input
                              type="number"
                              value={newItem.unit_cost}
                              onChange={(e) => setNewItem({...newItem, unit_cost: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label>Selling Price (RWF)</Label>
                            <Input
                              type="number"
                              value={newItem.selling_price}
                              onChange={(e) => setNewItem({...newItem, selling_price: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>Min Stock Level</Label>
                            <Input
                              type="number"
                              value={newItem.minimum_stock_level}
                              onChange={(e) => setNewItem({...newItem, minimum_stock_level: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label>Expiry Date</Label>
                            <Input
                              type="date"
                              value={newItem.expiry_date}
                              onChange={(e) => setNewItem({...newItem, expiry_date: e.target.value})}
                            />
                          </div>
                        </div>
                        <Button onClick={handleAddItem} disabled={!newItem.name}>
                          Add Medication
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <Input placeholder="Search medications..." className="flex-1" />
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                {inventory.map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{item.name}</h3>
                      <Badge className={getStatusColor(item)}>{getStatus(item)}</Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm text-gray-600">
                      <div><span className="font-medium">Stock:</span> {item.stock}</div>
                      <div><span className="font-medium">Min:</span> {item.minStock}</div>
                      <div><span className="font-medium">Price:</span> RWF {item.price?.toLocaleString()}</div>
                      <div><span className="font-medium">Expires:</span> {item.expiryDate}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}