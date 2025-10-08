import { NextRequest, NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';

// POST - Toplu işlemler (silme, durum güncelleme, öne çıkarma)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, articleIds } = body;

    if (!action || !articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz istek' },
        { status: 400 }
      );
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');

      let result;
      
      switch (action) {
        case 'delete':
          // Önce ilişkili kayıtları sil
          await client.query(
            'DELETE FROM article_authors WHERE article_id = ANY($1)',
            [articleIds]
          );
          await client.query(
            'DELETE FROM article_categories WHERE article_id = ANY($1)',
            [articleIds]
          );
          // Makaleleri sil
          result = await client.query(
            'DELETE FROM articles WHERE id = ANY($1) RETURNING id',
            [articleIds]
          );
          break;

        case 'publish':
          result = await client.query(
            `UPDATE articles 
             SET status = 'published', 
                 published_at = COALESCE(published_at, CURRENT_TIMESTAMP),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ANY($1) 
             RETURNING id`,
            [articleIds]
          );
          break;

        case 'draft':
          result = await client.query(
            `UPDATE articles 
             SET status = 'draft', 
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ANY($1) 
             RETURNING id`,
            [articleIds]
          );
          break;

        case 'feature':
          result = await client.query(
            `UPDATE articles 
             SET is_featured = true, 
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ANY($1) 
             RETURNING id`,
            [articleIds]
          );
          break;

        case 'unfeature':
          result = await client.query(
            `UPDATE articles 
             SET is_featured = false, 
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ANY($1) 
             RETURNING id`,
            [articleIds]
          );
          break;

        default:
          await client.query('ROLLBACK');
          return NextResponse.json(
            { success: false, error: 'Geçersiz işlem' },
            { status: 400 }
          );
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `${result.rowCount} makale güncellendi`,
        count: result.rowCount
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Bulk operation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

