import { NextRequest, NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';

// GET - Tüm makaleleri getir
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const categoryId = searchParams.get('category');
    const authorId = searchParams.get('author');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const featured = searchParams.get('featured');
    const offset = (page - 1) * limit;

    let whereClauses = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClauses.push(`a.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (search) {
      whereClauses.push(`(
        a.title ILIKE $${paramIndex} OR 
        a.content ILIKE $${paramIndex} OR 
        a.summary ILIKE $${paramIndex} OR
        au.full_name ILIKE $${paramIndex} OR
        au.username ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (categoryId) {
      whereClauses.push(`EXISTS (
        SELECT 1 FROM article_categories ac2 
        WHERE ac2.article_id = a.id AND ac2.category_id = $${paramIndex}
      )`);
      params.push(categoryId);
      paramIndex++;
    }

    if (authorId) {
      whereClauses.push(`EXISTS (
        SELECT 1 FROM article_authors aa2 
        WHERE aa2.article_id = a.id AND aa2.author_id = $${paramIndex}
      )`);
      params.push(authorId);
      paramIndex++;
    }

    if (startDate) {
      whereClauses.push(`a.created_at >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereClauses.push(`a.created_at <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    if (featured) {
      whereClauses.push(`a.is_featured = $${paramIndex}`);
      params.push(featured === 'true');
      paramIndex++;
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

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
      ${whereClause}
      GROUP BY a.id
      ORDER BY a.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const result = await query(sql, params);

    // Toplam sayıyı al
    const countSql = `SELECT COUNT(*) as total FROM articles a ${whereClause}`;
    const countResult = await query(countSql, params.slice(0, paramIndex - 1));
    const total = parseInt(countResult.rows[0].total);

    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Articles GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Yeni makale ekle
export async function POST(request: NextRequest) {
  const client = await getClient();
  
  try {
    const body = await request.json();
    const { 
      title, slug, summary, content, featured_image, status, 
      meta_title, meta_description, meta_keywords, is_featured,
      author_ids, category_ids, primary_category_id
    } = body;

    if (!title || !slug || !content) {
      return NextResponse.json(
        { success: false, error: 'Title, slug and content are required' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    // Makaleyi ekle
    const articleSql = `
      INSERT INTO articles (
        title, slug, summary, content, featured_image, status,
        meta_title, meta_description, meta_keywords, is_featured, published_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const articleResult = await client.query(articleSql, [
      title,
      slug,
      summary || null,
      content,
      featured_image || null,
      status || 'draft',
      meta_title || title,
      meta_description || summary || '',
      meta_keywords || null,
      is_featured || false,
      status === 'published' ? new Date() : null
    ]);

    const article = articleResult.rows[0];

    // Yazarları ekle
    if (author_ids && author_ids.length > 0) {
      for (let i = 0; i < author_ids.length; i++) {
        await client.query(
          'INSERT INTO article_authors (article_id, author_id, author_order) VALUES ($1, $2, $3)',
          [article.id, author_ids[i], i]
        );
      }
    }

    // Kategorileri ekle
    if (category_ids && category_ids.length > 0) {
      for (const categoryId of category_ids) {
        await client.query(
          'INSERT INTO article_categories (article_id, category_id, is_primary) VALUES ($1, $2, $3)',
          [article.id, categoryId, categoryId === primary_category_id]
        );
      }
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      data: article
    }, { status: 201 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Articles POST error:', error);
    
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

