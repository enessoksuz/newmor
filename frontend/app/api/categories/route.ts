import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sql = `
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
      WHERE is_active = true
      ORDER BY sort_path
    `;

    const result = await query(sql);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


