import { NextResponse } from 'next/server'

const stores = [
  {
    id: '1',
    name: 'Central Pharmacy',
    owner: 'John Doe',
    location: 'Kigali, Rwanda',
    phone: '+250788123456',
    email: 'central@pharmacy.com',
    status: 'active',
    plan: 'standard',
    created_at: '2024-01-15'
  },
  {
    id: '2', 
    name: 'Health Plus Pharmacy',
    owner: 'Jane Smith',
    location: 'Butare, Rwanda',
    phone: '+250788654321',
    email: 'healthplus@pharmacy.com',
    status: 'active',
    plan: 'premium',
    created_at: '2024-02-10'
  }
]

export async function GET() {
  return NextResponse.json(stores)
}
