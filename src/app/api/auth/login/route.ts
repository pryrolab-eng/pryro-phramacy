import { NextRequest, NextResponse } from 'next/server'

const users = [
  { email: 'abdousentore@gmail.com', password: 'admin123', role: 'superadmin', name: 'Super Admin' },
  { email: 'pharmacy@test.com', password: 'pharmacy123', role: 'pharmacy_owner', name: 'Pharmacy Owner' },
  { email: 'pharmacist@test.com', password: 'pharmacist123', role: 'pharmacist', name: 'Pharmacist' },
  { email: 'cashier@test.com', password: 'cashier123', role: 'cashier', name: 'Cashier' }
]

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    const user = users.find(u => u.email === email && u.password === password)
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    
    return NextResponse.json({ 
      success: true, 
      user: { email: user.email, role: user.role, name: user.name },
      token: 'mock-jwt-token'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}