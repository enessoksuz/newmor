import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ success: false, message: 'URL required' }, { status: 400 });
    }

    const client = await pool.connect();

    // URL zaten var mı kontrol et
    const checkResult = await client.query(
      'SELECT id, hit_count FROM not_found_logs WHERE url = $1',
      [url]
    );

    if (checkResult.rowCount > 0) {
      // Varsa hit_count'u artır ve last_seen_at'ı güncelle
      await client.query(
        'UPDATE not_found_logs SET hit_count = hit_count + 1, last_seen_at = CURRENT_TIMESTAMP WHERE url = $1',
        [url]
      );
    } else {
      // Yoksa yeni kayıt oluştur
      await client.query(
        'INSERT INTO not_found_logs (url, hit_count, status, first_seen_at, last_seen_at) VALUES ($1, 1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [url, 'active']
      );
    }

    client.release();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging 404:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to log 404' },
      { status: 500 }
    );
  }
}

