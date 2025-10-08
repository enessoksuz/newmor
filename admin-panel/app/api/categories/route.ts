import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Tüm kategorileri getir
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parent_id');

    let sql = `
      WITH RECURSIVE cat_tree AS (
        SELECT 
          c.id, c.name, c.slug, c.description, c.parent_id, 
          c.display_order, c.is_active, c.meta_title, c.meta_description,
          0 as level,
          ARRAY[c.display_order] as sort_path
        FROM categories c 
        WHERE c.parent_id IS NULL
        
        UNION ALL
        
        SELECT 
          c.id, c.name, c.slug, c.description, c.parent_id,
          c.display_order, c.is_active, c.meta_title, c.meta_description,
          ct.level + 1,
          ct.sort_path || c.display_order
        FROM categories c
        JOIN cat_tree ct ON c.parent_id = ct.id
      )
      SELECT * FROM cat_tree
      ORDER BY sort_path
    `;

    const result = await query(sql);
    
    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error: any) {
    console.error('Categories GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Yeni kategori ekle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, parent_id, meta_title, meta_description, display_order } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO categories (name, slug, description, parent_id, meta_title, meta_description, display_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await query(sql, [
      name,
      slug,
      description || null,
      parent_id || null,
      meta_title || `${name} - YeniMorFikir`,
      meta_description || description || `${name} kategorisindeki tüm içerikler`,
      display_order || 0
    ]);

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    }, { status: 201 });
  } catch (error: any) {
    console.error('Categories POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

