import { NextRequest, NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';

// GET - Tek makale getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sql = `
      SELECT 
        a.*,
        json_agg(DISTINCT jsonb_build_object(
          'id', au.id,
          'name', au.full_name,
          'username', au.username,
          'avatar_url', au.avatar_url,
          'order', aa.author_order
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
      WHERE a.id = $1
      GROUP BY a.id
    `;
    
    const result = await query(sql, [id]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
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

// PUT - Makale güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await getClient();
  
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      title, slug, summary, content, featured_image, status,
      meta_title, meta_description, meta_keywords, is_featured,
      author_ids, category_ids, primary_category_id
    } = body;

    await client.query('BEGIN');

    // Makaleyi güncelle
    const articleSql = `
      UPDATE articles 
      SET title = $1, slug = $2, summary = $3, content = $4,
          featured_image = $5, status = $6, meta_title = $7,
          meta_description = $8, meta_keywords = $9, is_featured = $10,
          published_at = CASE WHEN status = 'published' AND published_at IS NULL 
                         THEN CURRENT_TIMESTAMP 
                         ELSE published_at END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `;

    const articleResult = await client.query(articleSql, [
      title, slug, summary, content, featured_image, status,
      meta_title, meta_description, meta_keywords, is_featured,
      id
    ]);

    if (articleResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    // Mevcut yazarları sil ve yenilerini ekle
    if (author_ids) {
      await client.query('DELETE FROM article_authors WHERE article_id = $1', [id]);
      
      for (let i = 0; i < author_ids.length; i++) {
        await client.query(
          'INSERT INTO article_authors (article_id, author_id, author_order) VALUES ($1, $2, $3)',
          [id, author_ids[i], i]
        );
      }
    }

    // Mevcut kategorileri sil ve yenilerini ekle
    if (category_ids) {
      await client.query('DELETE FROM article_categories WHERE article_id = $1', [id]);
      
      for (const categoryId of category_ids) {
        await client.query(
          'INSERT INTO article_categories (article_id, category_id, is_primary) VALUES ($1, $2, $3)',
          [id, categoryId, categoryId === primary_category_id]
        );
      }
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      data: articleResult.rows[0]
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Bu slug zaten kullanılıyor' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// DELETE - Makale sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // CASCADE olduğu için ilişkiler otomatik silinecek
    const sql = 'DELETE FROM articles WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

