import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { productId, quantity, reason, adjustmentType } = await request.json()
    
    // Mock stock update
    const products = JSON.parse(localStorage.getItem('products') || '[]')
    const productIndex = products.findIndex(p => p.id === productId)
    
    if (productIndex === -1) throw new Error('Product not found')
    
    const product = products[productIndex]
    const newStock = adjustmentType === 'increase' 
      ? product.stock + quantity 
      : Math.max(0, product.stock - quantity)
    
    products[productIndex].stock = newStock
    localStorage.setItem('products', JSON.stringify(products))

    return NextResponse.json({ success: true, newStock })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Adjustment failed' }, { status: 500 })
  }
}