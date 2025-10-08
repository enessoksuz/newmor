import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Placeholder içeren makaleleri getir
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Placeholder içeren makaleleri bul
    const sql = `
      SELECT 
        a.*,
        json_agg(DISTINCT jsonb_build_object(
          'id', au.id,
          'name', au.full_name,
          'username', au.username,
          'avatar_url', au.avatar_url
        )) FILTER (WHERE au.id IS NOT NULL) as authors,
        json_agg(DISTINCT jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'slug', c.slug,
          'is_primary', ac.is_primary
        )) FILTER (WHERE c.id IS NOT NULL) as categories
      FROM articles a
      LEFT JOIN article_authors aa ON a.id = aa.article_id
      LEFT JOIN authors au ON aa.author_id = au.id
      LEFT JOIN article_categories ac ON a.id = ac.article_id
      LEFT JOIN categories c ON ac.category_id = c.id
      WHERE a.content LIKE '%placeholder%'
      GROUP BY a.id
      ORDER BY a.updated_at DESC
      LIMIT $1 OFFSET $2
    `;

    const countSql = `
      SELECT COUNT(DISTINCT a.id) as total
      FROM articles a
      WHERE a.content LIKE '%placeholder%'
    `;

    const [articlesResult, countResult] = await Promise.all([
      query(sql, [limit, offset]),
      query(countSql, [])
    ]);

    return NextResponse.json({
      success: true,
      data: articlesResult.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      limit
    });
  } catch (error) {
    console.error('Eksik resimler sorgusu hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Veriler yüklenemedi' },
      { status: 500 }
    );
  }
}

