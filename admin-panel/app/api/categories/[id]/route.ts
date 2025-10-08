import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Tek kategori getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sql = 'SELECT * FROM categories WHERE id = $1';
    const result = await query(sql, [id]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
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

// PUT - Kategori güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, slug, description, parent_id, meta_title, meta_description, display_order, is_active } = body;

    const sql = `
      UPDATE categories 
      SET name = $1, slug = $2, description = $3, parent_id = $4,
          meta_title = $5, meta_description = $6, display_order = $7, is_active = $8,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `;

    const result = await query(sql, [
      name,
      slug,
      description,
      parent_id || null,
      meta_title,
      meta_description,
      display_order || 0,
      is_active !== undefined ? is_active : true,
      id
    ]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
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

// DELETE - Kategori sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Önce alt kategorileri kontrol et
    const checkSql = 'SELECT COUNT(*) as count FROM categories WHERE parent_id = $1';
    const checkResult = await query(checkSql, [id]);
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      return NextResponse.json(
        { success: false, error: 'Bu kategorinin alt kategorileri var. Önce onları silmelisiniz.' },
        { status: 400 }
      );
    }

    const sql = 'DELETE FROM categories WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

