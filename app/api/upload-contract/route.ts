import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Upload to Blob storage with a contracts folder prefix
    // Using private access since the Blob store is configured as private
    const blob = await put(`contracts/${Date.now()}-${file.name}`, file, {
      access: 'private',
    })

    // Return pathname for private blobs (will be served via /api/file route)
    return NextResponse.json({ 
      pathname: blob.pathname,
      fileName: file.name
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
