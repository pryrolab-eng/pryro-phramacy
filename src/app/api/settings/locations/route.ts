import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

const DEFAULT_LOCATIONS = [
  { id: '1', name: 'Main Store', description: 'Primary location', is_active: true },
  { id: '2', name: 'Branch', description: 'Secondary location', is_active: true },
  { id: '3', name: 'Cold Storage', description: 'Temperature controlled', is_active: true },
  { id: '4', name: 'Warehouse', description: 'Bulk storage', is_active: true },
]

function isMissingStockLocationsTable(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = (error as { code?: string }).code
  return code === 'PGRST205' || code === '42P01'
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!userPharmacy) {
      return NextResponse.json({ success: false, error: 'Pharmacy not found' }, { status: 404 })
    }

    const { data: locations, error } = await supabase
      .from('stock_locations')
      .select('*')
      .eq('pharmacy_id', userPharmacy.pharmacy_id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) {
      if (isMissingStockLocationsTable(error)) {
        return NextResponse.json(DEFAULT_LOCATIONS)
      }
      throw error
    }
    return NextResponse.json(locations || [])
  } catch (error) {
    if (isMissingStockLocationsTable(error)) {
      return NextResponse.json(DEFAULT_LOCATIONS)
    }
    console.error('Error fetching locations:', error)
    return NextResponse.json(DEFAULT_LOCATIONS)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!userPharmacy) {
      return NextResponse.json({ success: false, error: 'Pharmacy not found' }, { status: 404 })
    }

    const body = await request.json()
    
    const { data: location, error } = await supabase
      .from('stock_locations')
      .insert({
        pharmacy_id: userPharmacy.pharmacy_id,
        name: body.name,
        description: body.description || '',
        is_active: true
      })
      .select()
      .single()

    if (error) {
      if (isMissingStockLocationsTable(error)) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Stock locations are not set up yet. Run database migrations (stock_locations).',
          },
          { status: 503 }
        )
      }
      throw error
    }
    return NextResponse.json({ success: true, location })
  } catch (error) {
    if (isMissingStockLocationsTable(error)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Stock locations are not set up yet. Run database migrations (stock_locations).',
        },
        { status: 503 }
      )
    }
    console.error('Error creating location:', error)
    return NextResponse.json({ success: false, error: 'Failed to create location' }, { status: 500 })
  }
}
