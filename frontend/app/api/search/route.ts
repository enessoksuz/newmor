import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const searchQuery = searchParams.get('q') || '';

    if (!searchQuery || searchQuery.trim().length < 2) {
      return NextResponse.json({ success: true, articles: [] });
    }

    const client = await pool.connect();
    
    const sql = `
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.summary,
        a.featured_image,
        a.published_at,
        json_agg(DISTINCT jsonb_build_object(
          'id', au.id,
          'name', au.full_name,
          'username', au.username
        )) FILTER (WHERE au.id IS NOT NULL) as authors,
        json_agg(DISTINCT jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'slug', c.slug
        )) FILTER (WHERE c.id IS NOT NULL) as categories
      FROM articles a
      LEFT JOIN article_authors aa ON a.id = aa.article_id
      LEFT JOIN authors au ON aa.author_id = au.id
      LEFT JOIN article_categories ac ON a.id = ac.article_id
      LEFT JOIN categories c ON ac.category_id = c.id
      WHERE a.status = 'published'
        AND (
          a.title ILIKE $1
          OR a.content ILIKE $1
          OR a.summary ILIKE $1
        )
      GROUP BY a.id
      ORDER BY a.updated_at DESC
      LIMIT 50
    `;

    const searchPattern = `%${searchQuery}%`;
    const result = await client.query(sql, [searchPattern]);
    
    client.release();

    return NextResponse.json({
      success: true,
      articles: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error searching articles:', error);
    return NextResponse.json(
      { success: false, message: 'Arama sırasında bir hata oluştu', articles: [] },
      { status: 500 }
    );
  }
}

