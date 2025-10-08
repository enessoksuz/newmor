import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Tek yazar getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sql = `
      SELECT 
        a.*,
        COUNT(DISTINCT aa.article_id) as article_count
      FROM authors a
      LEFT JOIN article_authors aa ON a.id = aa.author_id
      WHERE a.id = $1
      GROUP BY a.id
    `;
    const result = await query(sql, [id]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Author not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Yazar güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { username, email, full_name, bio, avatar_url, role, is_active } = body;

    const sql = `
      UPDATE authors 
      SET username = $1, email = $2, full_name = $3, bio = $4,
          avatar_url = $5, role = $6, is_active = $7,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `;

    const result = await query(sql, [
      username,
      email,
      full_name,
      bio,
      avatar_url,
      role,
      is_active !== undefined ? is_active : true,
      id
    ]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Author not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
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

// DELETE - Yazar sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Önce yazara ait makale var mı kontrol et
    const checkSql = 'SELECT COUNT(*) as count FROM article_authors WHERE author_id = $1';
    const checkResult = await query(checkSql, [id]);
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      return NextResponse.json(
        { success: false, error: 'Bu yazarın makaleleri var. Önce makalelerdeki ilişkilerini kaldırmalısınız.' },
        { status: 400 }
      );
    }

    const sql = 'DELETE FROM authors WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Author not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Author deleted successfully'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

