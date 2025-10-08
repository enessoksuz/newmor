import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Tek bir sabit sayfa
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  
  try {
    const result = await query(
      'SELECT * FROM static_pages WHERE id = $1',
      [id]
    );
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Sayfa bulunamadı' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching static page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch static page' },
      { status: 500 }
    );
  }
}

// PUT - Sabit sayfa güncelle
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  
  try {
    const body = await request.json();
    const { title, slug, content, meta_title, meta_description, footer_column, display_order, is_active } = body;
    
    const sql = `
      UPDATE static_pages
      SET title = $1, slug = $2, content = $3, meta_title = $4, meta_description = $5,
          footer_column = $6, display_order = $7, is_active = $8, updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
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
      is_active !== false,
      id
    ]);
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Sayfa bulunamadı' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating static page:', error);
    
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Bu slug zaten kullanımda' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update static page' },
      { status: 500 }
    );
  }
}

// DELETE - Sabit sayfa sil
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  
  try {
    const result = await query(
      'DELETE FROM static_pages WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Sayfa bulunamadı' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Sayfa silindi' });
  } catch (error) {
    console.error('Error deleting static page:', error);
    return NextResponse.json(
      { error: 'Failed to delete static page' },
      { status: 500 }
    );
  }
}

