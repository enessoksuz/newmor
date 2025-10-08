import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Admin panel'deki API'ye proxy yap
    const adminApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${adminApiUrl}/api/authors`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Admin API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching authors:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch authors' },
      { status: 500 }
    );
  }
}
