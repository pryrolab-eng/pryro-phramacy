import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { productId, quantity, costPrice, supplier } = await request.json()
    
    // Mock stock update for purchase
    const products = JSON.parse(localStorage.getItem('products') || '[]')
    const productIndex = products.findIndex(p => p.id === productId)
    
    if (productIndex === -1) throw new Error('Product not found')
    
    products[productIndex].stock += quantity
    localStorage.setItem('products', JSON.stringify(products))

    return NextResponse.json({ 
      success: true, 
      newStock: products[productIndex].stock 
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Purchase failed' }, { status: 500 })
  }
}
