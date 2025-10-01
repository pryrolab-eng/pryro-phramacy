'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface InventoryItem {
  id: string
  name: string
  stock: number
  minStock: number
  price: number
}

interface Sale {
  id: string
  customer: string
  amount: number
  items: number
  time: string
}

interface PharmacyStore {
  inventory: InventoryItem[]
  sales: Sale[]
  alerts: any[]
  stats: any
  setInventory: (inventory: InventoryItem[]) => void
  addSale: (sale: Sale) => void
  updateStock: (itemId: string, newStock: number) => void
  setAlerts: (alerts: any[]) => void
  setStats: (stats: any) => void
}

const PharmacyContext = createContext<PharmacyStore | null>(null)

export function PharmacyProvider({ children }: { children: ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})

  const addSale = (sale: Sale) => {
    setSales(prev => [sale, ...prev.slice(0, 9)])
  }

  const updateStock = (itemId: string, newStock: number) => {
    setInventory(prev => prev.map(item => 
      item.id === itemId ? { ...item, stock: newStock } : item
    ))
  }

  const value = {
    inventory, sales, alerts, stats,
    setInventory, addSale, updateStock, setAlerts, setStats
  }

  return React.createElement(
    PharmacyContext.Provider,
    { value },
    children
  )
}

export const usePharmacyStore = () => {
  const context = useContext(PharmacyContext)
  if (!context) {
    throw new Error('usePharmacyStore must be used within PharmacyProvider')
  }
  return context
}