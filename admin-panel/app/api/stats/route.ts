import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const client = await pool.connect();
    
    try {
      // Toplam makale sayısı
      const totalArticlesResult = await client.query('SELECT COUNT(*) as total FROM articles');
      const totalArticles = parseInt(totalArticlesResult.rows[0].total);
      
      // Yayınlanmış makale sayısı
      const publishedResult = await client.query(
        'SELECT COUNT(*) as total FROM articles WHERE status = $1',
        ['published']
      );
      const publishedArticles = parseInt(publishedResult.rows[0].total);
      
      // Taslak makale sayısı
      const draftResult = await client.query(
        'SELECT COUNT(*) as total FROM articles WHERE status = $1',
        ['draft']
      );
      const draftArticles = parseInt(draftResult.rows[0].total);
      
      // Toplam kategori sayısı
      const categoriesResult = await client.query('SELECT COUNT(*) as total FROM categories');
      const totalCategories = parseInt(categoriesResult.rows[0].total);
      
      // Toplam yazar sayısı
      const authorsResult = await client.query('SELECT COUNT(*) as total FROM authors');
      const totalAuthors = parseInt(authorsResult.rows[0].total);
      
      // Toplam görüntülenme sayısı
      const viewsResult = await client.query('SELECT SUM(view_count) as total FROM articles');
      const totalViews = parseInt(viewsResult.rows[0].total) || 0;
      
      return NextResponse.json({
        success: true,
        data: {
          totalArticles,
          publishedArticles,
          draftArticles,
          totalCategories,
          totalAuthors,
          totalViews,
        }
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
