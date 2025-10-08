import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Tüm sabit sayfaları listele
export async function GET() {
  try {
    const sql = `
      SELECT * FROM static_pages
      ORDER BY footer_column NULLS LAST, display_order, title
    `;
    
    const result = await query(sql, []);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching static pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch static pages' },
      { status: 500 }
    );
  }
}

// POST - Yeni sayfa oluştur
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, slug, content, meta_title, meta_description, footer_column, display_order, is_active } = body;
    
    const sql = `
      INSERT INTO static_pages (title, slug, content, meta_title, meta_description, footer_column, display_order, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const result = await query(sql, [
      title,
      slug,
      content || '',
      meta_title || title,
      meta_description || '',
      footer_column || null,
      display_order || 0,
      is_active !== false
    ]);
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating static page:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json(
        { error: 'Bu slug zaten kullanımda' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create static page' },
      { status: 500 }
    );
  }
}

