import { NextResponse } from 'next/server'

export async function GET() {
  const auditLogs = [
    { id: '1', user: 'john@pharmacy.com', action: 'Sale Created', details: 'Invoice INV-001 for 25,000 RWF', timestamp: new Date().toISOString() },
    { id: '2', user: 'jane@pharmacy.com', action: 'Stock Updated', details: 'Paracetamol stock adjusted +50', timestamp: new Date().toISOString() },
    { id: '3', user: 'admin@pharmacy.com', action: 'User Created', details: 'New pharmacist added', timestamp: new Date().toISOString() }
  ]
  return NextResponse.json(auditLogs)
}
