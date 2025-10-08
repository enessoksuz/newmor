import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - 404 loglarını listele
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'all';
    const offset = (page - 1) * limit;

    const client = await pool.connect();

    // WHERE clause
    let whereClause = '';
    let params: any[] = [];
    
    if (status !== 'all') {
      whereClause = 'WHERE status = $1';
      params.push(status);
    }

    // Toplam sayı
    const countResult = await client.query(
      `SELECT COUNT(*) FROM not_found_logs ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Sayfalanmış veri
    const dataParams = status !== 'all' ? [status, limit, offset] : [limit, offset];
    const dataQuery = `
      SELECT 
        id,
        url,
        hit_count,
        status,
        redirect_to,
        first_seen_at,
        last_seen_at,
        notes
      FROM not_found_logs
      ${whereClause}
      ORDER BY hit_count DESC, last_seen_at DESC
      LIMIT $${status !== 'all' ? '2' : '1'} OFFSET $${status !== 'all' ? '3' : '2'}
    `;

    const result = await client.query(dataQuery, dataParams);
    client.release();

    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching 404 logs:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch 404 logs' },
      { status: 500 }
    );
  }
}

// DELETE - 404 log sil
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    }

    const client = await pool.connect();
    await client.query('DELETE FROM not_found_logs WHERE id = $1', [id]);
    client.release();

    return NextResponse.json({ success: true, message: '404 log deleted' });
  } catch (error) {
    console.error('Error deleting 404 log:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete 404 log' },
      { status: 500 }
    );
  }
}

