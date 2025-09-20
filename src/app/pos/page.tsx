"use client";

import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Scan, Search, CreditCard, Receipt, Minus, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  inventory_id: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  insurance?: string;
}

export default function POSPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [hasInsurance, setHasInsurance] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState<any>(null);
  const [insuranceProviders, setInsuranceProviders] = useState<any[]>([]);

  useEffect(() => {
    fetchInventory();
    fetchInsuranceProviders();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory');
      if (response.ok) {
        const data = await response.json();
        setInventory(data);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
  };

  const fetchInsuranceProviders = async () => {
    try {
      const response = await fetch('/api/insurance');
      const data = await response.json();
      setInsuranceProviders(data);
    } catch (error) {
      console.error('Failed to fetch insurance providers:', error);
    }
  };

  const addToCart = (item: any) => {
    const existingItem = cartItems.find(cartItem => cartItem.inventory_id === item.id);
    
    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: item.name || item.medications?.name || 'Unknown',
        price: item.price || item.selling_price,
        quantity: 1,
        total: item.price || item.selling_price,
        inventory_id: item.id
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCartItems(cartItems.map(item => 
      item.id === id 
        ? { ...item, quantity: newQuantity, total: item.price * newQuantity }
        : item
    ));
  };

  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const addCustomer = async () => {
    if (!customerName.trim()) return;
    
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customerName,
          phone: customerPhone
        })
      });
      
      if (response.ok) {
        alert('Patient added successfully!');
      } else {
        alert('Failed to add patient');
      }
    } catch (error) {
      console.error('Error adding patient:', error);
      alert('Error adding patient');
    }
  };

  const processSale = async () => {
    if (cartItems.length === 0) return;
    
    setLoading(true);
    try {
      const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
      const insuranceAmount = hasInsurance && selectedInsurance ? (subtotal * selectedInsurance.coverage_percentage / 100) : 0;
      const customerAmount = subtotal - insuranceAmount;
      
      const sale = {
        customer_name: customerName || 'Walk-in Customer',
        customer_phone: customerPhone,
        subtotal,
        insurance_amount: insuranceAmount,
        customer_amount: customerAmount,
        total_amount: subtotal,
        payment_method: 'cash',
        status: 'completed'
      };

      const items = cartItems.map(item => ({
        inventory_id: item.inventory_id,
        medication_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.total
      }));

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sale, items })
      });

      if (response.ok) {
        setCartItems([]);
        setCustomerName('');
        setCustomerPhone('');
        setHasInsurance(false);
        setSelectedInsurance(null);
        alert('Sale completed successfully!');
      } else {
        throw new Error('Failed to process sale');
      }
    } catch (error) {
      console.error('Sale error:', error);
      alert('Failed to process sale');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const filteredInventory = inventory.filter(item => 
    item.medications?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scan className="h-5 w-5" />
                    POS System
                  </CardTitle>
                  <CardDescription>Scan barcode or search for medications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search medications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1"
                      />
                      <Button variant="outline" size="icon">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                      {filteredInventory.map((item) => (
                        <Button
                          key={item.id}
                          variant="outline"
                          className="text-xs h-auto py-2 flex flex-col"
                          onClick={() => addToCart(item)}
                          disabled={(item.stock || item.quantity_in_stock) <= 0}
                        >
                          <span className="font-medium">{item.name || item.medications?.name}</span>
                          <span className="text-gray-500">RWF {(item.price || item.selling_price)?.toLocaleString()}</span>
                          <span className="text-xs">Stock: {item.stock || item.quantity_in_stock}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Patient name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="icon" onClick={addCustomer}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Phone number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="insurance"
                      checked={hasInsurance}
                      onChange={(e) => setHasInsurance(e.target.checked)}
                    />
                    <label htmlFor="insurance" className="text-sm">Has Insurance</label>
                  </div>
                  {hasInsurance && (
                    <select
                      className="w-full p-2 border rounded"
                      value={selectedInsurance?.id || ''}
                      onChange={(e) => {
                        const provider = insuranceProviders.find(p => p.id === e.target.value)
                        setSelectedInsurance(provider)
                      }}
                    >
                      <option value="">Select Insurance Provider</option>
                      {insuranceProviders.map(provider => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name} ({provider.coverage_percentage}%)
                        </option>
                      ))}
                    </select>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Current Sale</CardTitle>
                  <CardDescription>Items in cart</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-gray-600">RWF {item.price.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm w-8 text-center">{item.quantity}</span>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-red-500"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>RWF {cartItems.reduce((sum, item) => sum + item.total, 0).toLocaleString()}</span>
                    </div>
                    {hasInsurance && selectedInsurance && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>{selectedInsurance.name} ({selectedInsurance.coverage_percentage}%):</span>
                        <span>-RWF {(cartItems.reduce((sum, item) => sum + item.total, 0) * selectedInsurance.coverage_percentage / 100).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-medium">
                      <span>Patient Pays:</span>
                      <span>RWF {(cartItems.reduce((sum, item) => sum + item.total, 0) - (hasInsurance && selectedInsurance ? cartItems.reduce((sum, item) => sum + item.total, 0) * selectedInsurance.coverage_percentage / 100 : 0)).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={processSale}
                      disabled={cartItems.length === 0 || loading}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {loading ? 'Processing...' : 'Process Payment'}
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Receipt className="h-4 w-4 mr-2" />
                      Print Receipt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}