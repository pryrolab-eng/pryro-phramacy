import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }
    
    // Mock file upload
    const upload = {
      id: Date.now().toString(),
      filename: file.name,
      size: file.size,
      type: file.type,
      url: `/uploads/${Date.now()}-${file.name}`,
      uploadedAt: new Date().toISOString()
    }
    
    return NextResponse.json({ success: true, upload })
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
