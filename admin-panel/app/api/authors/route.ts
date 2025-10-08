import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Tüm yazarları getir
export async function GET(request: NextRequest) {
  try {
    const sql = `
      SELECT 
        a.*,
        COUNT(DISTINCT aa.article_id) as article_count
      FROM authors a
      LEFT JOIN article_authors aa ON a.id = aa.author_id
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `;

    const result = await query(sql);
    
    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error: any) {
    console.error('Authors GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Yeni yazar ekle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, full_name, bio, avatar_url, role } = body;

    if (!username || !email || !full_name) {
      return NextResponse.json(
        { success: false, error: 'Username, email and full_name are required' },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO authors (username, email, full_name, bio, avatar_url, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING *
    `;

    const result = await query(sql, [
      username,
      email,
      full_name,
      bio || null,
      avatar_url || null,
      role || 'writer'
    ]);

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    }, { status: 201 });
  } catch (error: any) {
    console.error('Authors POST error:', error);
    
    // Unique constraint hatası
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Bu username veya email zaten kullanılıyor' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

